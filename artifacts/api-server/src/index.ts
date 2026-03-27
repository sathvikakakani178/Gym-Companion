import app from "./app";
import { logger } from "./lib/logger";
import { startMessageProcessor } from "./lib/messageProcessor";
import { rehydrateSessionsFromDisk } from "./lib/whatsapp";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Validate Supabase env var mapping on startup to surface misconfiguration early.
// In this project the env var names are intentionally swapped:
//   EXPO_PUBLIC_SUPABASE_ANON_KEY = Supabase project URL (https://...)
//   EXPO_PUBLIC_SUPABASE_URL      = Supabase anon/service key (eyJ...)
const _supabaseUrl = process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] ?? '';
const _supabaseKey = process.env['EXPO_PUBLIC_SUPABASE_URL'] ?? '';
if (!_supabaseUrl.startsWith('http')) {
  logger.warn('EXPO_PUBLIC_SUPABASE_ANON_KEY does not look like a URL — Supabase auth may fail');
}
if (!_supabaseKey.startsWith('eyJ')) {
  logger.warn('EXPO_PUBLIC_SUPABASE_URL does not look like a JWT key — Supabase auth may fail');
}
if (process.env['SUPABASE_SERVICE_ROLE_KEY']) {
  logger.info('Supabase service role key present — backend queries bypass RLS');
} else {
  logger.warn(
    'SUPABASE_SERVICE_ROLE_KEY is not set — the message processor and admin routes will use the anon key. ' +
    'This requires permissive RLS policies on whatsapp_logs and members tables. ' +
    'Set this key in production to ensure reliable query access.',
  );
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  startMessageProcessor();

  // Rehydrate WhatsApp sessions for gyms that have saved auth state on disk.
  // This ensures message delivery resumes after a restart without requiring
  // gym owners to scan a new QR code.
  rehydrateSessionsFromDisk().catch(err =>
    logger.error({ err }, "Failed to rehydrate WhatsApp sessions"),
  );
});
