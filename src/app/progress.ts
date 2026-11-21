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

export function progressPath(progress: Progress) {
  return "/" + progress.replace(/^replay-/, "");
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

export async function getParticipantProgress() {
  const id = await participantSessionId();
  if (!id) return null;
  const sql = progressDatabase();
  const [participant] = await sql`SELECT progress FROM participants WHERE id = ${id}`;
  return (participant?.progress as Progress | undefined) ?? null;
}
