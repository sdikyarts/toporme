import { createHash } from "node:crypto";
import { after } from "next/server";
import { progressDatabase, type Progress, type Step } from "./progress";

export type UsabilityChapter = "pengantar" | "tutorial" | "latihan";
export type AttemptOutcome = "completed" | "skipped";
export type ActiveAttempt = { id: string; distinctId: string; remainingMs: number };

export function isUsabilityChapter(value: unknown): value is UsabilityChapter {
  return value === "pengantar" || value === "tutorial" || value === "latihan";
}

export function postHogProject() {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || process.env.POSTHOG_PROJECT_API_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || process.env.POSTHOG_HOST;
  return token && host ? { token, host } : null;
}

function analyticsId(participantId: string) {
  return createHash("sha256").update(`toporme-usability:${participantId}`).digest("hex");
}

export function captureChapterEvent(
  participantId: string, chapter: UsabilityChapter, attemptId: string,
  event: "chapter_started" | "chapter_completed" | "chapter_skipped",
  timestamp: string, durationMs?: number,
) {
  const project = postHogProject();
  if (!project) return;
  const { token, host } = project;

  after(async () => {
    try {
      const response = await fetch(new URL("/i/v0/e/", host), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: token, event, timestamp,
          properties: {
            distinct_id: analyticsId(participantId),
            $geoip_disable: true,
            chapter, attempt_id: attemptId, attempt_number: 1, duration_ms: durationMs,
          },
        }),
        signal: AbortSignal.timeout(4000),
      });
      if (!response.ok) console.error("PostHog chapter capture failed", response.status);
    } catch {
      console.error("PostHog chapter capture failed");
    }
  });
}

export async function openFirstAttempt(participantId: string, chapter: UsabilityChapter): Promise<ActiveAttempt | null> {
  const sql = progressDatabase();
  const [inserted] = await sql`
    INSERT INTO chapter_first_attempts (participant_id, chapter)
    SELECT id, ${chapter} FROM participants
    WHERE id = ${participantId} AND research_consent IS TRUE AND progress = ${chapter}
    ON CONFLICT (participant_id, chapter) DO NOTHING
    RETURNING attempt_id, started_at, EXTRACT(EPOCH FROM (expires_at - now())) * 1000 AS remaining_ms
  `;
  const attempt = inserted ?? (await sql`
    SELECT attempt_id, EXTRACT(EPOCH FROM (expires_at - now())) * 1000 AS remaining_ms
    FROM chapter_first_attempts a JOIN participants p ON p.id = a.participant_id
    WHERE p.id = ${participantId} AND a.chapter = ${chapter} AND p.progress = ${chapter}
      AND p.research_consent IS TRUE AND a.finished_at IS NULL AND a.expires_at > now()
  `)[0];
  if (!attempt) return null;
  if (inserted) captureChapterEvent(participantId, chapter, inserted.attempt_id, "chapter_started", inserted.started_at);
  return { id: attempt.attempt_id, distinctId: analyticsId(participantId), remainingMs: Number(attempt.remaining_ms) };
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
      RETURNING a.attempt_id, a.finished_at, EXTRACT(EPOCH FROM (a.finished_at - a.started_at)) * 1000 AS duration_ms
    )
    SELECT moved.progress, finished.attempt_id, finished.finished_at, finished.duration_ms
    FROM moved LEFT JOIN finished ON true
  `;
  if (updated?.attempt_id) {
    captureChapterEvent(participantId, chapter, updated.attempt_id, outcome === "completed" ? "chapter_completed" : "chapter_skipped",
      updated.finished_at, Math.round(Number(updated.duration_ms)));
  }
  return updated?.progress as Progress | undefined;
}
