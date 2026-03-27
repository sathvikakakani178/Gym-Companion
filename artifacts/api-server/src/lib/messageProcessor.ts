import { supabase } from './supabase.js';
import { sendWhatsAppMessage } from './whatsapp.js';
import { logger } from './logger.js';

let processorInterval: NodeJS.Timeout | null = null;

// In-memory guard: used as fallback when DB-level claim is unavailable
// (e.g., 'processing' status not in schema). Prevents intra-process duplicates.
const inFlight = new Set<string>();

interface WhatsAppLog {
  id: string;
  gym_id: string;
  phone: string | null;
  message: string;
  status: string;
}

interface Member {
  id: string;
  phone: string | null;
}

async function markFailed(id: string, reason: string): Promise<void> {
  const { error } = await supabase
    .from('whatsapp_logs')
    .update({ status: 'failed', error_note: reason })
    .eq('id', id);

  if (error) {
    // error_note column may not exist yet — fall back without it
    await supabase
      .from('whatsapp_logs')
      .update({ status: 'failed' })
      .eq('id', id);
  }
}

/**
 * Atomically claim a pending log row by transitioning it to 'processing'.
 * Returns false if the row was already claimed by another process/instance.
 *
 * Strategy:
 *  1. Try DB-level atomic claim (status: pending → processing).
 *     Works across multiple API instances and is the primary guard.
 *  2. If the DB update fails (e.g., 'processing' not a valid schema value),
 *     fall back to the in-memory inFlight Set which prevents intra-process
 *     duplicates within a single instance.
 */
async function claimRow(id: string): Promise<boolean> {
  // In-memory guard: reject if already processing within this instance
  if (inFlight.has(id)) return false;

  const { data, error } = await supabase
    .from('whatsapp_logs')
    .update({ status: 'processing' })
    .eq('id', id)
    .eq('status', 'pending')  // Only update if still pending (atomic cross-instance claim)
    .select('id');

  if (error) {
    // Only fall back to in-memory lock for schema-related errors (e.g. CHECK constraint
    // violation because 'processing' is not yet a valid status value).
    // Transient DB errors (network, timeout) should NOT be swallowed — re-throw so the
    // row is not claimed and will be retried on the next 30s cycle.
    const isSchemaError =
      error.code === '23514' || // check_violation (CHECK constraint failed)
      error.code === '22P02' || // invalid_text_representation
      (error.message ?? '').toLowerCase().includes('check');

    if (!isSchemaError) {
      logger.warn({ id, err: error.message, code: error.code },
        'Transient DB error during claim — skipping row for this cycle');
      return false;
    }

    // Schema does not support 'processing' status yet — fall back to in-memory guard.
    // Run the migration at artifacts/api-server/migrations/001_whatsapp_logs_processing_status.sql
    // against your Supabase project to enable cross-instance duplicate prevention.
    logger.debug({ id, err: error.message }, 'DB claim step unavailable (schema) — using in-memory lock (single-instance only)');
    inFlight.add(id);
    return true;
  }

  const claimed = Array.isArray(data) && data.length > 0;
  if (claimed) inFlight.add(id); // Track in-memory too for consistency
  return claimed;
}

function releaseRow(id: string): void {
  inFlight.delete(id);
}

/**
 * Fan-out broadcast: deliver message to all members of the gym who have a phone number.
 * Throws if no members are found or all sends fail.
 */
async function sendBroadcast(log: WhatsAppLog): Promise<void> {
  const { data: members, error } = await supabase
    .from('members')
    .select('id, phone')
    .eq('gym_id', log.gym_id)
    .not('phone', 'is', null);

  if (error) {
    throw new Error(`Failed to fetch members: ${error.message}`);
  }

  const eligible = (members ?? []) as Member[];
  if (eligible.length === 0) {
    throw new Error('No members with phone numbers in this gym');
  }

  let sent = 0;
  let failed = 0;

  for (const member of eligible) {
    const phone = member.phone?.trim();
    if (!phone) continue;
    try {
      await sendWhatsAppMessage(log.gym_id, phone, log.message);
      sent++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Send failed';
      logger.warn({ logId: log.id, memberId: member.id, reason: msg }, 'Broadcast: recipient failed');
      failed++;
    }
  }

  logger.info({ logId: log.id, gymId: log.gym_id, sent, failed }, 'Broadcast complete');

  if (sent === 0) {
    throw new Error(`Broadcast: all ${failed} recipient(s) failed to receive message`);
  }
}

async function markSent(id: string, context: Record<string, unknown>): Promise<void> {
  const { error: updateErr } = await supabase
    .from('whatsapp_logs')
    .update({ status: 'sent' })
    .eq('id', id);

  if (updateErr) {
    // Message was delivered but we couldn't mark it sent — log explicitly so
    // operators can reconcile rather than risk a duplicate resend on next cycle.
    logger.error({ logId: id, dbErr: updateErr.message, ...context },
      'Message sent but status update failed — manual reconciliation required');
  }
}

async function processLog(log: WhatsAppLog): Promise<void> {
  // Atomically claim the row to prevent duplicate delivery under multi-instance deployment
  const claimed = await claimRow(log.id);
  if (!claimed) {
    logger.debug({ logId: log.id }, 'Row already claimed by another instance — skipping');
    return;
  }

  try {
    if (!log.phone?.trim()) {
      // Broadcast: fan-out to all gym members with phone numbers
      try {
        await sendBroadcast(log);
        await markSent(log.id, { type: 'broadcast' });
        logger.info({ logId: log.id }, 'Broadcast delivered and marked sent');
      } catch (err: unknown) {
        const reason = err instanceof Error ? err.message : 'Broadcast failed';
        await markFailed(log.id, reason);
        logger.warn({ logId: log.id, reason }, 'Broadcast failed');
      }
    } else {
      // Single-recipient message
      try {
        await sendWhatsAppMessage(log.gym_id, log.phone, log.message);
        await markSent(log.id, { phone: log.phone });
        logger.info({ logId: log.id, phone: log.phone }, 'WhatsApp message sent');
      } catch (err: unknown) {
        const reason = err instanceof Error ? err.message : 'Unknown error';
        await markFailed(log.id, reason);
        logger.warn({ logId: log.id, gymId: log.gym_id, reason }, 'WhatsApp send failed');
      }
    }
  } finally {
    // Always release the in-memory lock so the row can be retried on the next
    // cycle if it was marked failed, or cleaned up after success.
    releaseRow(log.id);
  }
}

/**
 * Reset rows that have been stuck in 'processing' for more than 5 minutes back to 'pending'.
 * Handles the case where a server crash or markSent DB failure left rows in 'processing'
 * with no further progress. Without this, they would never be retried (the processor
 * only selects 'pending' rows).
 */
async function requeueStaleProcessingRows(): Promise<void> {
  const staleAfterMs = 5 * 60 * 1000; // 5 minutes
  const staleBefore = new Date(Date.now() - staleAfterMs).toISOString();

  const { data: reset, error } = await supabase
    .from('whatsapp_logs')
    .update({ status: 'pending' })
    .eq('status', 'processing')
    .lt('updated_at', staleBefore)
    .select('id');

  if (error) {
    // 'updated_at' may not exist in this schema — log at debug so it doesn't
    // flood prod logs if the column is absent.
    logger.debug({ err: error.message }, 'Stale processing row recovery unavailable (schema may lack updated_at)');
    return;
  }

  const count = Array.isArray(reset) ? reset.length : 0;
  if (count > 0) {
    logger.warn({ count }, 'Requeued stale processing rows back to pending for retry');
  }
}

async function processMessages(): Promise<void> {
  // First, recover any rows stuck in 'processing' from a previous crash or failed status update.
  await requeueStaleProcessingRows();

  const { data: pending, error } = await supabase
    .from('whatsapp_logs')
    .select('*')
    .eq('status', 'pending')
    .limit(20);

  if (error) {
    logger.error({ error }, 'Failed to fetch pending WhatsApp messages');
    return;
  }

  if (!pending || pending.length === 0) return;

  logger.info({ count: pending.length }, 'Processing pending WhatsApp messages');

  // Process concurrently — DB-level claim prevents cross-instance duplicates
  await Promise.all((pending as WhatsAppLog[]).map(log => processLog(log)));
}

export function startMessageProcessor(): void {
  if (processorInterval) return;
  // Run once immediately so any pending messages from before this restart
  // are delivered without waiting for the first 30s interval.
  processMessages().catch(err =>
    logger.error({ err }, 'Unhandled error in message processor (initial run)'),
  );
  processorInterval = setInterval(() => {
    processMessages().catch(err =>
      logger.error({ err }, 'Unhandled error in message processor'),
    );
  }, 30_000);
  logger.info('WhatsApp message processor started (immediate + 30s interval)');
}

export function stopMessageProcessor(): void {
  if (processorInterval) {
    clearInterval(processorInterval);
    processorInterval = null;
  }
}
