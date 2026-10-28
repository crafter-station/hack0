create table if not exists buyers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  key_hash text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists entitlements (
  buyer_id uuid not null references buyers(id) on delete cascade,
  workshop_id text not null,
  source text not null check (source in ('luma', 'grant')),
  ref text,
  granted_at timestamptz not null default now(),
  primary key (buyer_id, workshop_id)
);

create table if not exists editions (
  event_id text primary key,
  workshop_id text not null,
  label text
);

create table if not exists packages (
  id text not null,
  version text not null,
  title text not null,
  free boolean not null default false,
  bundle jsonb not null,
  published_at timestamptz not null default now(),
  primary key (id, version)
);

create table if not exists webhook_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  context jsonb not null default '{}',
  created_at timestamptz not null default now()
);
