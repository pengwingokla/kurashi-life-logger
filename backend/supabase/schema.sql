-- M1: Job Intelligence schema
-- Run this in your Supabase SQL editor to set up all tables.

-- ---------------------------------------------------------------------------
-- resume_profile
-- ---------------------------------------------------------------------------
create table if not exists resume_profile (
  id                uuid primary key,
  titles            text[],
  seniority         text[],
  years_experience  int,
  remote_preference text,
  skills            jsonb,
  strengths         text[],
  updated_at        timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- jobs
-- ---------------------------------------------------------------------------
create table if not exists jobs (
  id             uuid primary key default gen_random_uuid(),
  greenhouse_id  text unique not null,
  title          text,
  company        text,
  location       text,
  is_remote      bool,
  url            text,
  raw_jd_text    text,
  requirements   text[],
  salary_range   text,
  fetched_at     timestamptz,
  seen           bool default false
);

create index if not exists jobs_seen_idx       on jobs (seen);
create index if not exists jobs_fetched_at_idx on jobs (fetched_at desc);

-- ---------------------------------------------------------------------------
-- digests
-- ---------------------------------------------------------------------------
create table if not exists digests (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz default now(),
  market_summary text
);

-- ---------------------------------------------------------------------------
-- digest_jobs  (M2 will populate fit_score / matched_skills / gaps / notes)
-- ---------------------------------------------------------------------------
create table if not exists digest_jobs (
  digest_id      uuid references digests(id) on delete cascade,
  job_id         uuid references jobs(id)    on delete cascade,
  fit_score      int,
  matched_skills text[],
  gaps           text[],
  notes          text,
  primary key (digest_id, job_id)
);
