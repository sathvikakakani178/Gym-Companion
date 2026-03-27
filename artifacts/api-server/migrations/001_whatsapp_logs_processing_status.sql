-- Migration: add 'processing' to whatsapp_logs status values
--
-- The message processor atomically transitions rows from 'pending' → 'processing'
-- before delivering them, preventing duplicate delivery across multiple API instances.
-- If the whatsapp_logs.status column has a CHECK constraint limiting allowed values,
-- run this migration against your Supabase project to add 'processing' support.
--
-- Safe to run multiple times (constraint rename is idempotent via DROP IF EXISTS).
--
-- Apply via Supabase SQL Editor or psql:
--   psql <connection_string> -f 001_whatsapp_logs_processing_status.sql

-- Step 1: Drop any existing CHECK constraint on the status column (adjust name if different)
ALTER TABLE whatsapp_logs DROP CONSTRAINT IF EXISTS whatsapp_logs_status_check;

-- Step 2: Add a new CHECK constraint that includes 'processing'
ALTER TABLE whatsapp_logs
  ADD CONSTRAINT whatsapp_logs_status_check
  CHECK (status IN ('pending', 'processing', 'sent', 'delivered', 'failed'));

-- Step 3: Add an index to speed up the processor's pending-row poll
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status_pending
  ON whatsapp_logs (status)
  WHERE status IN ('pending', 'processing');
