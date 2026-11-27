CREATE TABLE IF NOT EXISTS chapter_first_attempts (
  participant_id uuid NOT NULL REFERENCES participants (id) ON DELETE CASCADE,
  chapter text NOT NULL CHECK (chapter IN ('pengantar', 'tutorial', 'latihan')),
  attempt_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  finished_at timestamptz,
  outcome text CHECK (outcome IN ('completed', 'skipped')),
  PRIMARY KEY (participant_id, chapter),
  CHECK ((finished_at IS NULL) = (outcome IS NULL))
);
