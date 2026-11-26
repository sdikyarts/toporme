"use server";

import { redirect } from "next/navigation";
import { getParticipantProgress, nextProgress, participantSessionId, progressDatabase, progressPath, type Progress } from "./progress";

const previousProgress = {
  tutorial: "pengantar",
  latihan: "tutorial",
  "replay-tutorial": "replay-pengantar",
  "replay-latihan": "replay-tutorial",
} as const;

export async function switchChapter(expected: Progress) {
  const destinations = {
    pengantar: "tutorial",
    tutorial: "pengantar",
    "replay-pengantar": "replay-tutorial",
    "replay-tutorial": "replay-pengantar",
  } as const;
  if (!Object.hasOwn(destinations, expected)) return null;
  const id = await participantSessionId();
  if (!id) return null;

  const destination = destinations[expected as keyof typeof destinations];
  const sql = progressDatabase();
  const [updated] = await sql`
    UPDATE participants SET progress = ${destination}
    WHERE id = ${id} AND progress = ${expected}
    RETURNING progress
  `;
  if (updated || await getParticipantProgress() === destination) return destination;
  return null;
}

export async function previousChapterDestination(expected: Progress) {
  const id = await participantSessionId();
  if (!id) return "/";

  const current = await getParticipantProgress();
  if (!current) return "/";
  if (current !== expected || !Object.hasOwn(previousProgress, current)) {
    return progressPath(current);
  }

  const previous = previousProgress[current as keyof typeof previousProgress];
  const sql = progressDatabase();
  const [updated] = await sql`
    UPDATE participants SET progress = ${previous}
    WHERE id = ${id} AND progress = ${current}
    RETURNING progress
  `;
  if (updated) return previous.endsWith("pengantar") ? "/pengantar?panel=langkah" : progressPath(previous);

  const progress = await getParticipantProgress();
  return progress ? progressPath(progress) : "/";
}

export async function returnToPreviousChapter(expected: Progress) {
  redirect(await previousChapterDestination(expected));
}

export async function advanceProgress(expected: Progress, formData: FormData) {
  const id = await participantSessionId();
  if (!id) redirect("/");
  if (!Object.hasOwn(nextProgress, expected)) redirect("/");
  if (expected === "consent-form") {
    const consent = formData.get("consent");
    if (consent !== "yes" && consent !== "no") redirect("/consent-form");
  }
  if (expected === "sus-form" || expected === "mls-form") {
    // Connect survey storage here before enabling these transitions.
    redirect("/");
  }

  const sql = progressDatabase();
  const next = nextProgress[expected];
  const [updated] = await sql`
    UPDATE participants SET progress = ${next}
    WHERE id = ${id} AND progress = ${expected}
    RETURNING progress
  `;
  const progress = updated ? next : await getParticipantProgress();
  redirect(progress ? progressPath(progress) : "/");
}
