import { Router } from 'express';
import {
  getOrCreateSession,
  getSessionStatus,
  sendWhatsAppMessage,
  disconnectSession,
} from '../lib/whatsapp.js';
import { logger } from '../lib/logger.js';

const router = Router();

// GET /api/whatsapp/qr/:gymId
// Starts (or resumes) a session and returns the current QR code (if pending) or connected status.
router.get('/whatsapp/qr/:gymId', async (req, res) => {
  const { gymId } = req.params;
  if (!gymId) return res.status(400).json({ error: 'gymId is required' });

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
// Returns connection status without starting a new session.
router.get('/whatsapp/status/:gymId', (req, res) => {
  const { gymId } = req.params;
  const { status, phone, qrBase64 } = getSessionStatus(gymId);
  return res.json({ status, phone, hasQr: !!qrBase64 });
});

// POST /api/whatsapp/send - send a message directly
router.post('/whatsapp/send', async (req, res) => {
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
router.delete('/whatsapp/disconnect/:gymId', async (req, res) => {
  const { gymId } = req.params;
  try {
    await disconnectSession(gymId);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
