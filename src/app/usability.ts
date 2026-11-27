import { progressDatabase, type Progress, type Step } from "./progress";

export type UsabilityChapter = "pengantar" | "tutorial" | "latihan";
export type AttemptOutcome = "completed" | "skipped";

export function isUsabilityChapter(value: unknown): value is UsabilityChapter {
  return value === "pengantar" || value === "tutorial" || value === "latihan";
}

export async function openFirstAttempt(participantId: string, chapter: UsabilityChapter) {
  const sql = progressDatabase();
  await sql`
    INSERT INTO chapter_first_attempts (participant_id, chapter)
    SELECT id, ${chapter} FROM participants
    WHERE id = ${participantId} AND research_consent IS TRUE AND progress = ${chapter}
    ON CONFLICT (participant_id, chapter) DO NOTHING
  `;
}

export async function moveAndFinishAttempt(
  participantId: string, chapter: UsabilityChapter, outcome: AttemptOutcome,
  current: Progress, next: Progress, lastVisited: Step,
) {
  const sql = progressDatabase();
  const [updated] = await sql`
    WITH moved AS (
      UPDATE participants SET progress = ${next}, last_visited_step = ${lastVisited}
      WHERE id = ${participantId} AND progress = ${current}
      RETURNING id, progress, research_consent
    ), finished AS (
      UPDATE chapter_first_attempts a
      SET finished_at = now(), outcome = ${outcome}
      FROM moved m
      WHERE a.participant_id = m.id AND m.research_consent IS TRUE
        AND a.chapter = ${chapter} AND a.finished_at IS NULL AND a.expires_at > now()
    )
    SELECT progress FROM moved
  `;
  return updated?.progress as Progress | undefined;
}
