-- Add turn system columns to rooms table

ALTER TABLE rooms 
ADD COLUMN current_turn_index INTEGER DEFAULT 0,
ADD COLUMN round_state TEXT DEFAULT 'TURN_LOOP';

-- Add check constraint for round_state
ALTER TABLE rooms
ADD CONSTRAINT check_round_state CHECK (round_state IN ('TURN_LOOP', 'ROUND_FINISHED', 'VOTING'));
