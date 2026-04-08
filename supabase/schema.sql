-- ─── PROTOCOLS ────────────────────────────────────────────────────────────────
-- The canonical published directory. Only admin can insert/update/delete.
-- Public users can read status='published' rows.

create table if not exists protocols (
  id            text primary key,               -- e.g. 'cetus', 'scallop'
  name          text not null,
  tagline       text not null default '',
  description   text not null default '',
  category      text not null default 'DeFi',
  color         text not null default '#6fbcf0',
  color_to      text not null default '#3b82f6',
  emoji         text not null default '🔷',
  website       text,
  github        text,
  twitter       text,
  packages      jsonb not null default '[]',    -- [{id, label, description}]
  key_objects   jsonb not null default '[]',    -- [{id, label, description}]
  tags          jsonb not null default '[]',
  featured      boolean not null default false,
  status        text not null default 'published' check (status in ('published','hidden')),
  source        text not null default 'manual' check (source in ('manual','defilamma','coingecko','rpc','submission')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── SCAN RESULTS ─────────────────────────────────────────────────────────────
-- Auto-discovered protocols awaiting admin review (publish/hide).

create table if not exists scan_results (
  id            uuid primary key default gen_random_uuid(),
  source        text not null check (source in ('defilamma','coingecko','rpc')),
  external_id   text,                           -- DeFiLlama slug, CoinGecko id, or package id
  raw_data      jsonb not null default '{}',    -- full raw response for reference
  suggested     jsonb not null default '{}',    -- our parsed suggestion {name, category, website, ...}
  status        text not null default 'pending' check (status in ('pending','approved','rejected','duplicate')),
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- ─── SUBMISSIONS ──────────────────────────────────────────────────────────────
-- Protocol teams claiming/submitting their project.

create table if not exists submissions (
  id              uuid primary key default gen_random_uuid(),
  protocol_id     text references protocols(id) on delete set null, -- if claiming existing
  wallet_address  text not null,
  name            text not null,
  tagline         text,
  description     text,
  category        text,
  website         text,
  github          text,
  twitter         text,
  packages        jsonb default '[]',
  contact_email   text,
  message         text,                         -- applicant's note to admin
  status          text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now()
);

-- ─── PROTOCOL OWNERS ──────────────────────────────────────────────────────────
-- Maps wallet addresses to protocols they own (set by admin after approval).

create table if not exists protocol_owners (
  id              uuid primary key default gen_random_uuid(),
  protocol_id     text not null references protocols(id) on delete cascade,
  wallet_address  text not null,
  granted_at      timestamptz not null default now(),
  unique (protocol_id, wallet_address)
);

-- ─── RLS POLICIES ─────────────────────────────────────────────────────────────

alter table protocols       enable row level security;
alter table scan_results    enable row level security;
alter table submissions     enable row level security;
alter table protocol_owners enable row level security;

-- Public: read published protocols only
create policy "public_read_published" on protocols
  for select using (status = 'published');

-- Service role: full access (used by API routes with service key)
-- (service role bypasses RLS by default in Supabase)

-- Public: anyone can insert a submission
create policy "public_insert_submissions" on submissions
  for insert with check (true);

-- Public: read own submissions by wallet
create policy "public_read_own_submissions" on submissions
  for select using (true);  -- filtered in API

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger protocols_updated_at
  before update on protocols
  for each row execute function set_updated_at();

-- ─── SEED: migrate existing hardcoded protocols ────────────────────────────────
-- Run this once to populate from the existing static data.
-- (The app will also do this via the /api/admin/seed endpoint)
