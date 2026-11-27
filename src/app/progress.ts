import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";

export const nextProgress = {
  "consent-form": "pengantar",
  pengantar: "tutorial",
  tutorial: "latihan",
  latihan: "sus-form",
  "sus-form": "mls-form",
  "mls-form": "thank-you",
  "thank-you": "replay-pengantar",
  "replay-pengantar": "replay-tutorial",
  "replay-tutorial": "replay-latihan",
  "replay-latihan": "thank-you",
} as const;

export type Progress = keyof typeof nextProgress;
export type Step = Exclude<Progress, `replay-${string}`>;

const steps = ["consent-form", "pengantar", "tutorial", "latihan", "sus-form", "mls-form", "thank-you"] as const;

export function progressStep(progress: Progress): Step {
  return progress.replace(/^replay-/, "") as Step;
}

export function unlockedProgress(progress: Progress, step: Step): Progress | null {
  const index = steps.indexOf(step);
  if (index === -1) return null;

  if (!progress.startsWith("replay-")) {
    return index <= steps.indexOf(progressStep(progress)) ? step : null;
  }

  const replay = `replay-${step}`;
  if (Object.hasOwn(nextProgress, replay) && index <= steps.indexOf(progressStep(progress))) {
    return replay as Progress;
  }
  return step;
}

export function progressPath(progress: Progress) {
  return "/" + progressStep(progress);
}

export async function participantSessionId() {
  const id = (await cookies()).get("toporme_participant")?.value;
  return id && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id) ? id : null;
}

export function progressDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is missing");
  return neon(url);
}

export async function getParticipantPosition() {
  const id = await participantSessionId();
  if (!id) return null;
  const sql = progressDatabase();
  const [participant] = await sql`
    SELECT progress, COALESCE(last_visited_step, progress) AS last_visited
    FROM participants WHERE id = ${id}
  `;
  if (!participant) return null;
  return { progress: participant.progress as Progress, lastVisited: participant.last_visited as Progress };
}

export async function getParticipantProgress() {
  return (await getParticipantPosition())?.lastVisited ?? null;
}
