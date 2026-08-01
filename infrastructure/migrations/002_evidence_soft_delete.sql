-- Migration: Evidence lifecycle — soft delete support
-- Adds status column, deleted_at/deleted_by columns, and makes sha256_hash nullable.
-- Existing rows get status='active' and sha256_hash stays as-is (empty strings become NULL).

BEGIN;

-- 1. Make sha256_hash nullable (was NOT NULL, but metadata-only items have no hash)
ALTER TABLE items
  ALTER COLUMN sha256_hash DROP NOT NULL;

-- 2. Convert empty-string hashes to NULL
UPDATE items
SET sha256_hash = NULL
WHERE sha256_hash = '';

-- 3. Add status column with default 'active'
ALTER TABLE items
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active';

-- 4. Add soft-delete columns
ALTER TABLE items
  ADD COLUMN deleted_at TIMESTAMPTZ,
  ADD COLUMN deleted_by UUID;

-- 5. Add CHECK constraint for status
ALTER TABLE items
  ADD CONSTRAINT items_status_check
  CHECK (status IN ('active', 'archived', 'superseded'));

-- 6. Add index on status for filtering
CREATE INDEX idx_items_status ON items (status);

COMMIT;
