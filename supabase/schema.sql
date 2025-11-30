-- Create the rooms table
create table rooms (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  theme text not null,
  impostor_count int not null,
  status text not null default 'waiting', -- waiting, playing, finished
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add an index on the code for faster lookups
create index rooms_code_idx on rooms (code);

-- Enable Row Level Security (RLS)
alter table rooms enable row level security;

-- Create a policy that allows anyone to create a room (for now, or restrict as needed)
create policy "Enable insert for everyone" on rooms for insert with check (true);

-- Create a policy that allows anyone to read a room (needed for joining)
create policy "Enable select for everyone" on rooms for select using (true);
