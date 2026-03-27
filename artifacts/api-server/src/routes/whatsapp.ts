import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getOrCreateSession,
  getSessionStatus,
  sendWhatsAppMessage,
  disconnectSession,
} from '../lib/whatsapp.js';
import { logger } from '../lib/logger.js';

const router = Router();

const adminOnly = [requireAuth, requireRole('super_admin')];

// GET /api/whatsapp/qr/:gymId
// Starts (or resumes) a Baileys session and returns the current QR code (if pending)
// or connected status. Polls up to 12s for QR to appear. Only super_admin may call this.
router.get('/whatsapp/qr/:gymId', ...adminOnly, async (req, res) => {
  const gymId = String(req.params['gymId']);
  try {
    await getOrCreateSession(gymId);

    // Poll up to 12 seconds for QR to appear (or connection to open)
    let attempts = 0;
    while (attempts < 24) {
      const s = getSessionStatus(gymId);
      if (s.status === 'connected') {
        return res.json({ status: 'connected', qr: null, phone: s.phone });
      }
      if (s.qrBase64) {
        return res.json({ status: 'connecting', qr: s.qrBase64, phone: null });
      }
      await new Promise<void>(r => setTimeout(r, 500));
      attempts++;
    }

    const s = getSessionStatus(gymId);
    return res.json({ status: s.status, qr: s.qrBase64, phone: s.phone });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    logger.error({ gymId, err }, 'Error getting WhatsApp QR');
    return res.status(500).json({ error: msg });
  }
});

// GET /api/whatsapp/status/:gymId
// Returns connection status. Also returns fresh QR base64 so the client can
// refresh the displayed QR automatically when Baileys generates a new one.
// Only super_admin may call this.
router.get('/whatsapp/status/:gymId', ...adminOnly, (req, res) => {
  const gymId = String(req.params['gymId']);
  const { status, phone, qrBase64 } = getSessionStatus(gymId);
  return res.json({ status, phone, hasQr: !!qrBase64, qr: qrBase64 });
});

interface SendPayload {
  gymId?: unknown;
  phone?: unknown;
  message?: unknown;
}

// POST /api/whatsapp/send — direct send (bypasses queue, for admin testing)
router.post('/whatsapp/send', ...adminOnly, async (req, res) => {
  const { gymId, phone, message } = (req.body ?? {}) as SendPayload;
  const missing: string[] = [];
  if (typeof gymId !== 'string' || !gymId.trim()) missing.push('gymId');
  if (typeof phone !== 'string' || !phone.trim()) missing.push('phone');
  if (typeof message !== 'string' || !message.trim()) missing.push('message');
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing or invalid fields: ${missing.join(', ')}` });
  }
  try {
    await sendWhatsAppMessage(gymId as string, phone as string, message as string);
    return res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Send failed';
    return res.status(500).json({ error: msg });
  }
});

// DELETE /api/whatsapp/disconnect/:gymId
router.delete('/whatsapp/disconnect/:gymId', ...adminOnly, async (req, res) => {
  const gymId = String(req.params['gymId']);
  try {
    await disconnectSession(gymId);
    return res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Disconnect failed';
    return res.status(500).json({ error: msg });
  }
});

export default router;
