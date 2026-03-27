import { supabase } from './supabase.js';
import { sendWhatsAppMessage } from './whatsapp.js';
import { logger } from './logger.js';

let processorInterval: NodeJS.Timeout | null = null;

// In-flight log IDs: prevents duplicate delivery when a cycle takes longer than 30s
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

async function processMessages(): Promise<void> {
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

  // Filter out any logs already being processed in this cycle
  const eligible = (pending as WhatsAppLog[]).filter(log => !inFlight.has(log.id));
  if (eligible.length === 0) return;

  logger.info({ count: eligible.length }, 'Processing pending WhatsApp messages');

  const tasks = eligible.map(async (log) => {
    inFlight.add(log.id);
    try {
      if (!log.gym_id) {
        await markFailed(log.id, 'Missing gym_id');
        return;
      }

      if (!log.phone?.trim()) {
        // Broadcast: fan-out to all gym members with phone numbers
        try {
          await sendBroadcast(log);
          const { error: updateErr } = await supabase
            .from('whatsapp_logs')
            .update({ status: 'sent' })
            .eq('id', log.id);
          if (updateErr) {
            // Message was delivered but status update failed — log explicitly to
            // prevent silent duplicate resend on next cycle.
            logger.error({ logId: log.id, dbErr: updateErr.message },
              'Broadcast sent but status update failed — manual reconciliation required');
          } else {
            logger.info({ logId: log.id }, 'Broadcast delivered and marked sent');
          }
        } catch (err: unknown) {
          const reason = err instanceof Error ? err.message : 'Broadcast failed';
          await markFailed(log.id, reason);
          logger.warn({ logId: log.id, reason }, 'Broadcast failed');
        }
        return;
      }

      // Single-recipient message
      try {
        await sendWhatsAppMessage(log.gym_id, log.phone, log.message);
        const { error: updateErr } = await supabase
          .from('whatsapp_logs')
          .update({ status: 'sent' })
          .eq('id', log.id);
        if (updateErr) {
          // Message was delivered but we couldn't mark it sent — log so operators
          // can reconcile before the next cycle re-processes this row.
          logger.error({ logId: log.id, phone: log.phone, dbErr: updateErr.message },
            'Message sent but status update failed — manual reconciliation required');
        } else {
          logger.info({ logId: log.id, phone: log.phone }, 'WhatsApp message sent');
        }
      } catch (err: unknown) {
        const reason = err instanceof Error ? err.message : 'Unknown error';
        await markFailed(log.id, reason);
        logger.warn({ logId: log.id, gymId: log.gym_id, reason }, 'WhatsApp send failed');
      }
    } finally {
      inFlight.delete(log.id);
    }
  });

  await Promise.all(tasks);
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
