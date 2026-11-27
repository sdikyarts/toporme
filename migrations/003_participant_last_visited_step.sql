ALTER TABLE participants ADD COLUMN IF NOT EXISTS last_visited_step text
  CHECK (last_visited_step IN (
    'consent-form', 'pengantar', 'tutorial', 'latihan', 'sus-form', 'mls-form', 'thank-you'
  ));
