DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'participants'
      AND column_name = 'sus_response_scale'
  ) THEN
    ALTER TABLE participants
      ADD COLUMN sus_response_scale integer NOT NULL DEFAULT 7,
      ADD CONSTRAINT participants_sus_response_scale_check CHECK (
        sus_response_scale = 7 OR (
          sus_response_scale = 5 AND sus_answers <@ '[1,2,3,4,5]'::jsonb
        )
      ),
      DROP COLUMN sus_score;

    ALTER TABLE participants
      ADD COLUMN sus_score numeric GENERATED ALWAYS AS (
        (
          5 * (sus_response_scale - 1)
          + (sus_answers ->> 0)::numeric - (sus_answers ->> 1)::numeric
          + (sus_answers ->> 2)::numeric - (sus_answers ->> 3)::numeric
          + (sus_answers ->> 4)::numeric - (sus_answers ->> 5)::numeric
          + (sus_answers ->> 6)::numeric - (sus_answers ->> 7)::numeric
          + (sus_answers ->> 8)::numeric - (sus_answers ->> 9)::numeric
        ) * 100 / (10 * (sus_response_scale - 1))
      ) STORED;
  END IF;
END
$$;
