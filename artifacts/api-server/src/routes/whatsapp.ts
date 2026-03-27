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
// or connected status. Only super_admin may call this.
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
      await new Promise(r => setTimeout(r, 500));
      attempts++;
    }

    const s = getSessionStatus(gymId);
    return res.json({ status: s.status, qr: s.qrBase64, phone: s.phone });
  } catch (err: any) {
    logger.error({ gymId, err }, 'Error getting WhatsApp QR');
    return res.status(500).json({ error: err.message ?? 'Internal error' });
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

// POST /api/whatsapp/send — direct send (bypasses queue, for admin testing)
router.post('/whatsapp/send', ...adminOnly, async (req, res) => {
  const { gymId, phone, message } = req.body as { gymId?: string; phone?: string; message?: string };
  if (!gymId || !phone || !message) {
    return res.status(400).json({ error: 'gymId, phone, and message are required' });
  }
  try {
    await sendWhatsAppMessage(gymId, phone, message);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/whatsapp/disconnect/:gymId
router.delete('/whatsapp/disconnect/:gymId', ...adminOnly, async (req, res) => {
  const gymId = String(req.params['gymId']);
  try {
    await disconnectSession(gymId);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
