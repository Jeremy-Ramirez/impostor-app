-- Create players table
create table if not exists players (
  id uuid default gen_random_uuid() primary key,
  room_code text not null references rooms(code) on delete cascade,
  name text not null,
  is_impostor boolean default false,
  is_host boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add index on room_code for faster lookups
create index if not exists players_room_code_idx on players (room_code);

-- Enable RLS
alter table players enable row level security;

-- Policies
-- Allow read access to everyone (needed for lobby)
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'players' and policyname = 'Enable select for everyone') then
    create policy "Enable select for everyone" on players for select using (true);
  end if;
end
$$;

-- Allow insert access to everyone (needed for joining)
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'players' and policyname = 'Enable insert for everyone') then
    create policy "Enable insert for everyone" on players for insert with check (true);
  end if;
end
$$;

-- Allow update access to everyone (needed for game logic updates via server actions/client if needed, though mostly server)
-- For MVP simplicity, we allow updates. In production, this should be stricter.
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'players' and policyname = 'Enable update for everyone') then
    create policy "Enable update for everyone" on players for update using (true);
  end if;
end
$$;

-- Enable Realtime for players table
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table rooms;
