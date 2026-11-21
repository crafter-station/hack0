-- Workshop testimonials: one per signed-in account and workshop, shown only after an admin approves it.
create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  workshop_id text not null,
  user_id text not null,
  body text not null,
  name text not null,
  role text,
  link text,
  avatar_url text,
  email text,
  verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workshop_id, user_id)
);--> statement-breakpoint
create index if not exists testimonials_workshop_status on testimonials (workshop_id, status, created_at desc);
