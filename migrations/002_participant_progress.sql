ALTER TABLE participants ADD COLUMN IF NOT EXISTS progress text NOT NULL DEFAULT 'consent-form'
  CHECK (progress IN (
    'consent-form', 'pengantar', 'tutorial', 'latihan', 'sus-form', 'mls-form', 'thank-you',
    'replay-pengantar', 'replay-tutorial', 'replay-latihan'
  ));
