-- Matcha Logger Schema
-- Run this in Supabase SQL Editor (supabase.com → your project → SQL Editor)

-- Drop existing tables if re-running
drop table if exists matcha_logs;
drop table if exists matcha_collection;

-- Matcha collection: the matchas you own
create table matcha_collection (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  grade text check (grade in ('ceremonial', 'culinary', 'premium', 'other')),
  is_default boolean default false,
  created_at timestamptz default now()
);

-- Matcha logs: every time you drink matcha
create table matcha_logs (
  id uuid primary key default gen_random_uuid(),
  matcha_id uuid references matcha_collection(id) on delete set null,
  grams numeric(4,1) not null check (grams > 0),
  notes text,
  logged_at timestamptz default now()
);

-- Index for fast date-range queries (streak chart needs this)
create index matcha_logs_logged_at_idx on matcha_logs (logged_at desc);

-- Seed with a sample matcha so the UI isn't empty on first open
insert into matcha_collection (name, brand, grade, is_default)
values ('My Matcha', 'Your Brand', 'ceremonial', true);
