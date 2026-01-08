-- Migration: Add storage_committed, storage_used, and network columns to snapshots table
-- Run this in your Supabase SQL editor

-- Add new columns
ALTER TABLE snapshots 
ADD COLUMN IF NOT EXISTS storage_committed BIGINT,
ADD COLUMN IF NOT EXISTS network TEXT DEFAULT 'devnet';

-- Copy existing storage_used to storage_committed (one-time migration)
-- This assumes old data was using storage_committed values in the storage_used column
UPDATE snapshots 
SET storage_committed = storage_used 
WHERE storage_committed IS NULL AND storage_used IS NOT NULL;

-- Set storage_used to null or 0 for old records (they didn't track actual usage)
-- Uncomment the line below if you want to reset storage_used
-- UPDATE snapshots SET storage_used = 0 WHERE storage_used IS NOT NULL;

-- Add index for network filtering
CREATE INDEX IF NOT EXISTS idx_snapshots_network ON snapshots(network);

-- Verify the migration
SELECT 
  COUNT(*) as total_snapshots,
  COUNT(storage_committed) as has_committed,
  COUNT(storage_used) as has_used,
  COUNT(DISTINCT network) as networks
FROM snapshots;
