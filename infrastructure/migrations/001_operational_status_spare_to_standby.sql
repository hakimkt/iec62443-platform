-- Migration: operational_status 'spare' → 'standby'
-- Aligns database CHECK constraint with Zod schema and shared-types.
-- The IEC 62443 standard uses "standby" terminology.

BEGIN;

-- 1. Update existing data
UPDATE assets
SET operational_status = 'standby'
WHERE operational_status = 'spare';

-- 2. Drop and recreate the CHECK constraint with the corrected value
ALTER TABLE assets
  DROP CONSTRAINT assets_operational_status_check;

ALTER TABLE assets
  ADD CONSTRAINT assets_operational_status_check
  CHECK (operational_status IN ('operational', 'decommissioned', 'maintenance', 'standby'));

COMMIT;
