ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS sus_answers jsonb
    CHECK (sus_answers IS NULL OR CASE WHEN jsonb_typeof(sus_answers) = 'array' THEN
      jsonb_array_length(sus_answers) = 10 AND sus_answers <@ '[1,2,3,4,5,6,7]'::jsonb
    ELSE false END),
  ADD COLUMN IF NOT EXISTS mls_answers jsonb
    CHECK (mls_answers IS NULL OR CASE WHEN jsonb_typeof(mls_answers) = 'array' THEN
      jsonb_array_length(mls_answers) = 6 AND mls_answers <@ '[1,2,3,4,5]'::jsonb
    ELSE false END);
