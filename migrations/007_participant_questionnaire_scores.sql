ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS sus_score numeric GENERATED ALWAYS AS (
    (
      -- For each 1–7 pair, (odd - 1) + (7 - even) = 6 + odd - even.
      30
      + (sus_answers ->> 0)::numeric - (sus_answers ->> 1)::numeric
      + (sus_answers ->> 2)::numeric - (sus_answers ->> 3)::numeric
      + (sus_answers ->> 4)::numeric - (sus_answers ->> 5)::numeric
      + (sus_answers ->> 6)::numeric - (sus_answers ->> 7)::numeric
      + (sus_answers ->> 8)::numeric - (sus_answers ->> 9)::numeric
    ) * 100 / 60
  ) STORED,
  ADD COLUMN IF NOT EXISTS mls_score numeric GENERATED ALWAYS AS (
    (
      (mls_answers ->> 0)::numeric + (mls_answers ->> 1)::numeric
      + (mls_answers ->> 2)::numeric + (mls_answers ->> 3)::numeric
      + (mls_answers ->> 4)::numeric + (mls_answers ->> 5)::numeric
    ) / 6
  ) STORED;
