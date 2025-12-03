-- Refactor Voting System

-- 1. Add columns to players
ALTER TABLE players
ADD COLUMN voted_for_id UUID REFERENCES players(id),
ADD COLUMN is_eliminated BOOLEAN DEFAULT false;

-- 2. Migrate existing is_alive data to is_eliminated (inverse logic)
UPDATE players SET is_eliminated = NOT is_alive;

-- 3. Drop old columns/tables
-- We can keep is_alive for now or drop it. Let's drop it to be clean as per user request.
ALTER TABLE players DROP COLUMN is_alive;

-- Drop votes table as we are moving to players.voted_for_id
DROP TABLE IF EXISTS votes;

-- 4. Ensure winner column exists in rooms (it should, but just in case)
-- ALTER TABLE rooms ADD COLUMN IF NOT EXISTS winner TEXT;
