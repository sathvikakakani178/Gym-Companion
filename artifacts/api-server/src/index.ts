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
