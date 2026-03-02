-- Run this in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → paste → Run

create table if not exists game_scores (
  id           bigserial primary key,
  created_at   timestamptz default now(),
  initials     text not null,
  state        text,
  score        int not null,
  tier         text,
  day_number   int,
  game_date    date,
  emoji_string text
);

-- Allow anyone to insert (anon users posting scores)
alter table game_scores enable row level security;

create policy "Anyone can insert scores"
  on game_scores for insert
  to anon
  with check (true);

create policy "Anyone can read scores"
  on game_scores for select
  to anon
  using (true);
