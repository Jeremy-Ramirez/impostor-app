-- Add is_alive to players
ALTER TABLE players
ADD COLUMN is_alive BOOLEAN DEFAULT true;

-- Add winner to rooms
ALTER TABLE rooms
ADD COLUMN winner TEXT DEFAULT NULL;

-- Create votes table
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES players(id) ON DELETE CASCADE, -- Nullable for Skip Vote
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(room_code, voter_id) -- One vote per player per round (we'll need to clear votes after each round)
);

-- RLS for votes
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON votes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON votes
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON votes
  FOR DELETE USING (true);
