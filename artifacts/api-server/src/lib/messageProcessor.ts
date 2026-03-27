import { supabase } from './supabase.js';
import { sendWhatsAppMessage } from './whatsapp.js';
import { logger } from './logger.js';

let processorInterval: NodeJS.Timeout | null = null;

async function markFailed(id: string, reason: string): Promise<void> {
  // Try with error_note column first; fall back if column doesn't exist
  const { error } = await supabase
    .from('whatsapp_logs')
    .update({ status: 'failed', error_note: reason })
    .eq('id', id);

  if (error) {
    // Column likely doesn't exist — retry without error_note
    await supabase
      .from('whatsapp_logs')
      .update({ status: 'failed' })
      .eq('id', id);
  }
}

async function processMessages(): Promise<void> {
  const { data: pending, error } = await supabase
    .from('whatsapp_logs')
    .select('*')
    .eq('status', 'pending')
    .not('phone', 'is', null)
    .limit(20);

  if (error) {
    logger.error({ error }, 'Failed to fetch pending WhatsApp messages');
    return;
  }

  if (!pending || pending.length === 0) return;

  logger.info({ count: pending.length }, 'Processing pending WhatsApp messages');

  for (const log of pending) {
    if (!log.phone?.trim() || !log.gym_id) {
      await markFailed(log.id, 'Missing phone or gym_id');
      continue;
    }

    try {
      await sendWhatsAppMessage(log.gym_id, log.phone, log.message);
      await supabase
        .from('whatsapp_logs')
        .update({ status: 'sent' })
        .eq('id', log.id);
      logger.info({ logId: log.id, phone: log.phone }, 'WhatsApp message sent');
    } catch (err: any) {
      const reason = err?.message ?? 'Unknown error';
      await markFailed(log.id, reason);
      logger.warn({ logId: log.id, gymId: log.gym_id, reason }, 'WhatsApp send failed');
    }
  }
}

export function startMessageProcessor(): void {
  if (processorInterval) return;
  processorInterval = setInterval(() => {
    processMessages().catch(err =>
      logger.error({ err }, 'Unhandled error in message processor'),
    );
  }, 30_000);
  logger.info('WhatsApp message processor started (30s interval)');
}

export function stopMessageProcessor(): void {
  if (processorInterval) {
    clearInterval(processorInterval);
    processorInterval = null;
  }
}
