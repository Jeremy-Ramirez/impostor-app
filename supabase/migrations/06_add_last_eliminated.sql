-- Add last_eliminated_id to rooms table
ALTER TABLE rooms
ADD COLUMN last_eliminated_id UUID REFERENCES players(id);
