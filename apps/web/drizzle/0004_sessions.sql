-- Recorded Claude Code sessions (asciicast, gzipped). Paid material: served only through the gated route.
create table if not exists sessions (
  workshop_id text not null,
  slug text not null,
  title text not null,
  duration_s integer not null,
  cast_gz bytea not null,
  created_at timestamptz not null default now(),
  primary key (workshop_id, slug)
);--> statement-breakpoint
