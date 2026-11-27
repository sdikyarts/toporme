"use server";

import { redirect } from "next/navigation";
import { tutorialCompletionPath } from "./(chapters)/tutorial/tutorial-flow";
import {
  getParticipantPosition, getParticipantProgress, nextProgress, participantSessionId,
  progressDatabase, progressPath, progressStep, unlockedProgress, type Progress, type Step,
} from "./progress";

const previousProgress = {
  tutorial: "pengantar",
  latihan: "tutorial",
  "replay-tutorial": "replay-pengantar",
  "replay-latihan": "replay-tutorial",
} as const;

async function moveParticipant(expected: Progress, destination: Progress) {
  const id = await participantSessionId();
  if (!id) return null;

  const position = await getParticipantPosition();
  if (!position || unlockedProgress(position.progress, progressStep(expected)) !== expected) return null;

  const advances = position.progress === expected && nextProgress[expected] === destination;
  if (!advances && !unlockedProgress(position.progress, progressStep(destination))) return null;

  const sql = progressDatabase();
  const [updated] = await sql`
    UPDATE participants
    SET progress = ${advances ? destination : position.progress},
        last_visited_step = ${progressStep(destination)}
    WHERE id = ${id} AND progress = ${position.progress}
    RETURNING progress
  `;
  return updated ? unlockedProgress(updated.progress as Progress, progressStep(destination)) : null;
}

export async function recordStepVisit(step: Step) {
  const id = await participantSessionId();
  if (!id) return null;

  const position = await getParticipantPosition();
  if (!position) return null;

  const progress = unlockedProgress(position.progress, step);
  if (!progress || progressStep(position.lastVisited) === step) return progress;

  const sql = progressDatabase();
  const [updated] = await sql`
    UPDATE participants SET last_visited_step = ${step}
    WHERE id = ${id} AND progress = ${position.progress}
    RETURNING progress
  `;
  return updated ? progress : null;
}

export async function switchChapter(expected: Progress) {
  if (expected === "pengantar" || expected === "replay-pengantar") {
    return moveParticipant(expected, nextProgress[expected]);
  }
  if (expected === "tutorial" || expected === "replay-tutorial") {
    return moveParticipant(expected, previousProgress[expected]);
  }
  return null;
}

export async function returnToPreviousChapter(expected: Progress) {
  if (Object.hasOwn(previousProgress, expected)) {
    const previous = await moveParticipant(expected, previousProgress[expected as keyof typeof previousProgress]);
    if (previous) {
      if (progressStep(previous) === "tutorial") redirect(tutorialCompletionPath);
      redirect(previous.endsWith("pengantar") ? "/pengantar?panel=langkah" : progressPath(previous));
    }
  }

  const progress = await getParticipantProgress();
  redirect(progress ? progressPath(progress) : "/");
}

export async function advanceProgress(expected: Progress, formData: FormData) {
  if (!Object.hasOwn(nextProgress, expected)) redirect("/");
  if (expected === "consent-form") {
    const consent = formData.get("consent");
    if (consent !== "yes" && consent !== "no") redirect("/consent-form");
  }
  if (expected === "sus-form" || expected === "mls-form") {
    // Connect survey storage here before enabling these transitions.
    redirect("/");
  }

  const progress = await moveParticipant(expected, nextProgress[expected]) ?? await getParticipantProgress();
  redirect(progress ? progressPath(progress) : "/");
}
