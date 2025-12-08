-- Migration: Replace sponsors table with event_sponsors junction table
-- This DROPS the old sponsors table and creates the new event_sponsors system

BEGIN;

-- Step 1: Drop old sponsors table (we're starting fresh)
DROP TABLE IF EXISTS sponsors CASCADE;

-- Step 2: Create event_sponsors table
CREATE TABLE IF NOT EXISTS event_sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    tier sponsor_tier DEFAULT 'partner',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_sponsors_event_id ON event_sponsors(event_id);
CREATE INDEX IF NOT EXISTS idx_event_sponsors_organization_id ON event_sponsors(organization_id);

COMMIT;
