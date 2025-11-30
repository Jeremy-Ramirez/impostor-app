-- Create game_words table
create table if not exists game_words (
  id uuid default gen_random_uuid() primary key,
  category text not null,
  word text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add secret_word column to rooms if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'rooms' and column_name = 'secret_word') then
    alter table rooms add column secret_word text;
  end if;
end
$$;

-- Enable RLS on game_words
alter table game_words enable row level security;

-- Allow read access to game_words for everyone (needed for game logic)
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'game_words' and policyname = 'Enable select for everyone') then
    create policy "Enable select for everyone" on game_words for select using (true);
  end if;
end
$$;

-- Seed Data
insert into game_words (category, word) values
  -- Fútbol
  ('Fútbol', 'Lionel Messi'),
  ('Fútbol', 'Cristiano Ronaldo'),
  ('Fútbol', 'VAR'),
  ('Fútbol', 'Mundial'),
  ('Fútbol', 'Offside'),
  
  -- Celebridades
  ('Celebridades', 'Taylor Swift'),
  ('Celebridades', 'Elon Musk'),
  ('Celebridades', 'Shakira'),
  ('Celebridades', 'Tom Cruise'),
  ('Celebridades', 'Beyoncé'),

  -- Comidas
  ('Comidas', 'Pizza'),
  ('Comidas', 'Sushi'),
  ('Comidas', 'Tacos'),
  ('Comidas', 'Hamburguesa'),
  ('Comidas', 'Paella'),

  -- Lugares
  ('Lugares', 'Torre Eiffel'),
  ('Lugares', 'Machu Picchu'),
  ('Lugares', 'Estatua de la Libertad'),
  ('Lugares', 'Gran Muralla China'),
  ('Lugares', 'Coliseo Romano');
