// Creates tables via Supabase pg REST endpoint
const SUPABASE_URL = 'https://tzbbeleucvwgexfrwyrh.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6YmJlbGV1Y3Z3Z2V4ZnJ3eXJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY0MzY1MiwiZXhwIjoyMDkxMjE5NjUyfQ.Cm6k4xZrKEMaAOwEfs5X-C1J_2KExi62obd3u8d80aY'

const statements = [
`create table if not exists protocols (
  id text primary key,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  category text not null default 'DeFi',
  color text not null default '#6fbcf0',
  color_to text not null default '#3b82f6',
  emoji text not null default '🔷',
  website text,
  github text,
  twitter text,
  packages jsonb not null default '[]',
  key_objects jsonb not null default '[]',
  tags jsonb not null default '[]',
  featured boolean not null default false,
  status text not null default 'published' check (status in ('published','hidden')),
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)`,
`create table if not exists scan_results (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_id text,
  raw_data jsonb not null default '{}',
  suggested jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending','approved','rejected','duplicate')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
)`,
`create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  protocol_id text references protocols(id) on delete set null,
  wallet_address text not null,
  name text not null,
  tagline text,
  description text,
  category text,
  website text,
  github text,
  twitter text,
  packages jsonb default '[]',
  contact_email text,
  message text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
)`,
`create table if not exists protocol_owners (
  id uuid primary key default gen_random_uuid(),
  protocol_id text not null references protocols(id) on delete cascade,
  wallet_address text not null,
  granted_at timestamptz not null default now(),
  unique (protocol_id, wallet_address)
)`,
`alter table protocols enable row level security`,
`alter table scan_results enable row level security`,
`alter table submissions enable row level security`,
`alter table protocol_owners enable row level security`,
`do $$ begin
  if not exists (select 1 from pg_policies where tablename='protocols' and policyname='public_read_published') then
    create policy "public_read_published" on protocols for select using (status = 'published');
  end if;
end $$`,
`do $$ begin
  if not exists (select 1 from pg_policies where tablename='submissions' and policyname='public_insert_submissions') then
    create policy "public_insert_submissions" on submissions for insert with check (true);
  end if;
end $$`,
`create or replace function set_updated_at() returns trigger language plpgsql as $fn$
begin new.updated_at = now(); return new; end; $fn$`,
`do $$ begin
  if not exists (select 1 from pg_trigger where tgname='protocols_updated_at') then
    create trigger protocols_updated_at before update on protocols for each row execute function set_updated_at();
  end if;
end $$`,
]

for (const sql of statements) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_ddl`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
  })
  const text = await res.text()
  if (!res.ok) {
    console.error('Failed:', sql.slice(0, 60), '->', text)
  } else {
    console.log('✓', sql.slice(0, 60))
  }
}
