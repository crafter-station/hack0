-- Rows that share a fingerprint are one event a race inserted twice: keep the oldest, move its sightings and curation over.
WITH ranked AS (
	SELECT id, first_value(id) OVER (PARTITION BY identity_fingerprint ORDER BY created_at, id) AS keep
	FROM canonical_events
)
UPDATE event_sources s SET canonical_event_id = r.keep FROM ranked r WHERE s.canonical_event_id = r.id AND r.id <> r.keep;--> statement-breakpoint
WITH ranked AS (
	SELECT id, curated, first_value(id) OVER (PARTITION BY identity_fingerprint ORDER BY created_at, id) AS keep
	FROM canonical_events
)
UPDATE canonical_events c SET curated = true FROM ranked r WHERE c.id = r.keep AND r.id <> r.keep AND r.curated;--> statement-breakpoint
WITH ranked AS (
	SELECT id, first_value(id) OVER (PARTITION BY identity_fingerprint ORDER BY created_at, id) AS keep
	FROM canonical_events
)
DELETE FROM canonical_events c USING ranked r WHERE c.id = r.id AND r.id <> r.keep;--> statement-breakpoint
DROP INDEX "canonical_events_fingerprint_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "canonical_events_fingerprint_key" ON "canonical_events" USING btree ("identity_fingerprint");--> statement-breakpoint
CREATE SEQUENCE "canonical_events_change_seq";--> statement-breakpoint
ALTER TABLE "canonical_events" ADD COLUMN "change_seq" bigint DEFAULT nextval('canonical_events_change_seq') NOT NULL;--> statement-breakpoint
CREATE INDEX "canonical_events_change_seq_idx" ON "canonical_events" USING btree ("change_seq");--> statement-breakpoint
-- A write that changes nothing but timestamps (a resync of the same data) keeps its place in the changes feed.
CREATE FUNCTION canonical_events_bump_change_seq() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
	IF (to_jsonb(NEW) - '{updated_at,enriched_at,change_seq}'::text[]) IS DISTINCT FROM (to_jsonb(OLD) - '{updated_at,enriched_at,change_seq}'::text[]) THEN
		NEW.change_seq := nextval('canonical_events_change_seq');
	END IF;
	RETURN NEW;
END $$;--> statement-breakpoint
CREATE TRIGGER canonical_events_change_seq BEFORE UPDATE ON canonical_events FOR EACH ROW EXECUTE FUNCTION canonical_events_bump_change_seq();
