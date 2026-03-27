import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import type { ILogger } from '@whiskeysockets/baileys/lib/Utils/logger.js';
import * as QRCode from 'qrcode';
import { mkdirSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import pino from 'pino';
import { logger } from './logger.js';

// Persist sessions in the workspace directory so they survive restarts/redeploys.
// The sessions directory is gitignored (.local/whatsapp-sessions/).
export const SESSIONS_DIR =
  process.env['WHATSAPP_SESSIONS_DIR'] ??
  path.join(process.cwd(), '.local', 'whatsapp-sessions');

const silentLogger = pino({ level: 'silent' }) as unknown as ILogger;

export type SessionStatus = 'disconnected' | 'connecting' | 'connected';

interface BailDisconnectError {
  output?: { statusCode?: number };
}

interface Session {
  sock: ReturnType<typeof makeWASocket> | null;
  status: SessionStatus;
  phone: string | null;
  qrBase64: string | null;
  reconnectTimer?: NodeJS.Timeout;
}

const sessions = new Map<string, Session>();

function getSessionDir(gymId: string): string {
  return path.join(SESSIONS_DIR, gymId);
}

async function createSession(gymId: string): Promise<Session> {
  const sessDir = getSessionDir(gymId);
  mkdirSync(sessDir, { recursive: true });

  const existing = sessions.get(gymId);
  if (existing?.reconnectTimer) clearTimeout(existing.reconnectTimer);

  const session: Session = {
    sock: null,
    status: 'connecting',
    phone: null,
    qrBase64: null,
  };
  sessions.set(gymId, session);

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: ['GymLeads', 'Chrome', '3.0'],
      logger: silentLogger,
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
    });

    session.sock = sock;

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        session.status = 'connecting';
        try {
          session.qrBase64 = await QRCode.toDataURL(qr);
        } catch (e: unknown) {
          logger.error({ gymId, err: e }, 'QR encode error');
        }
        logger.info({ gymId }, 'WhatsApp QR ready');
      }

      if (connection === 'open') {
        session.status = 'connected';
        session.qrBase64 = null;
        session.phone = sock.user?.id?.split(':')[0] ?? null;
        logger.info({ gymId, phone: session.phone }, 'WhatsApp connected');
      }

      if (connection === 'close') {
        const bailErr = lastDisconnect?.error as BailDisconnectError | undefined;
        const statusCode = bailErr?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;
        session.status = 'disconnected';
        session.sock = null;
        session.qrBase64 = null;
        logger.info({ gymId, loggedOut }, 'WhatsApp disconnected');
        if (!loggedOut) {
          session.reconnectTimer = setTimeout(() => createSession(gymId), 8000);
        } else {
          sessions.delete(gymId);
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);
  } catch (err: unknown) {
    logger.error({ gymId, err }, 'Failed to init WhatsApp session');
    session.status = 'disconnected';
  }

  return session;
}

export async function getOrCreateSession(gymId: string): Promise<Session> {
  const existing = sessions.get(gymId);
  if (existing && existing.status !== 'disconnected') return existing;
  return createSession(gymId);
}

export function getSessionStatus(gymId: string): {
  status: SessionStatus;
  phone: string | null;
  qrBase64: string | null;
} {
  const s = sessions.get(gymId);
  if (!s) return { status: 'disconnected', phone: null, qrBase64: null };
  return { status: s.status, phone: s.phone, qrBase64: s.qrBase64 };
}

/**
 * Normalise a phone string to an E.164-style digit sequence (no `+` prefix) for Baileys.
 *
 * Behaviour (in order):
 *   1. Strip everything that is not a digit or a leading `+`.
 *   2. Remove a leading `+` (Baileys expects pure digits).
 *   3. If the result is exactly 10 digits, assume an Indian local number and
 *      prepend `91` (the India country code).  Override this default via the
 *      `WHATSAPP_DEFAULT_COUNTRY_CODE` env-var (e.g. `1` for US/CA, `44` for UK).
 *
 * Examples:
 *   "+919876543210" → "919876543210"
 *   "9876543210"    → "919876543210" (India default)
 *   "+14155550100"  → "14155550100"  (already has country code)
 */
export function normalisePhone(raw: string): string {
  const stripped = raw.trim().replace(/[^\d+]/g, '').replace(/^\+/, '');
  if (stripped.length === 10) {
    const cc = process.env['WHATSAPP_DEFAULT_COUNTRY_CODE'] ?? '91';
    return `${cc}${stripped}`;
  }
  return stripped;
}

export async function sendWhatsAppMessage(gymId: string, phone: string, text: string): Promise<void> {
  const s = sessions.get(gymId);
  if (!s || s.status !== 'connected' || !s.sock) {
    throw new Error(`WhatsApp not connected for gym: ${gymId}`);
  }
  const jid = `${normalisePhone(phone)}@s.whatsapp.net`;
  await s.sock.sendMessage(jid, { text });
}

export async function disconnectSession(gymId: string): Promise<void> {
  const s = sessions.get(gymId);
  if (s?.reconnectTimer) clearTimeout(s.reconnectTimer);
  if (s?.sock) {
    try {
      await s.sock.logout();
    } catch {
      // logout can fail if already disconnected
    }
  }
  sessions.delete(gymId);
}

/**
 * Rehydrate sessions for gyms that have saved auth state on disk.
 * Baileys auto-reconnects using saved credentials — no new QR scan needed.
 */
export async function rehydrateSessionsFromDisk(): Promise<void> {
  if (!existsSync(SESSIONS_DIR)) return;
  const gymIds = readdirSync(SESSIONS_DIR).filter(name =>
    existsSync(path.join(SESSIONS_DIR, name, 'creds.json')),
  );
  if (gymIds.length === 0) return;
  logger.info({ count: gymIds.length }, 'Rehydrating WhatsApp sessions from disk');
  for (const gymId of gymIds) {
    try {
      await getOrCreateSession(gymId);
    } catch (err: unknown) {
      logger.error({ gymId, err }, 'Failed to rehydrate WhatsApp session');
    }
  }
}
