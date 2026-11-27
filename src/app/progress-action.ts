"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { questionnaireScales } from "./questionnaire-scale";
import { isUsabilityChapter, moveAndFinishAttempt, openFirstAttempt, postHogProject, type AttemptOutcome, type UsabilityChapter } from "./usability";
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

async function moveParticipant(
  expected: Progress, destination: Progress,
  { answers, consent, outcome }: { answers?: number[]; consent?: boolean; outcome?: AttemptOutcome } = {},
) {
  const id = await participantSessionId();
  if (!id) return null;

  const position = await getParticipantPosition();
  if (!position || unlockedProgress(position.progress, progressStep(expected)) !== expected) return null;

  const advances = position.progress === expected && nextProgress[expected] === destination;
  if (!advances && !unlockedProgress(position.progress, progressStep(destination))) return null;

  const sql = progressDatabase();
  const next = advances ? destination : position.progress;
  const lastVisited = progressStep(destination);
  if (outcome && advances && isUsabilityChapter(expected)) {
    const progress = await moveAndFinishAttempt(id, expected, outcome, position.progress, next, lastVisited);
    return progress ? unlockedProgress(progress, lastVisited) : null;
  }
  if (consent !== undefined) {
    const [updated] = await sql`
      UPDATE participants
      SET progress = ${next}, last_visited_step = ${lastVisited},
          research_consent = ${consent}
      WHERE id = ${id} AND progress = ${position.progress}
      RETURNING progress
    `;
    return updated ? unlockedProgress(updated.progress as Progress, lastVisited) : null;
  }
  if (answers) {
    const response = JSON.stringify(answers);
    const [updated] = await sql`
      UPDATE participants
      SET progress = ${next},
          last_visited_step = ${lastVisited},
          sus_response_scale = CASE
            WHEN ${expected === "sus-form"} AND sus_answers IS NULL THEN ${questionnaireScales.sus.length}
            ELSE sus_response_scale
          END,
          sus_answers = COALESCE(sus_answers, ${expected === "sus-form" ? response : null}::jsonb),
          mls_answers = COALESCE(mls_answers, ${expected === "mls-form" ? response : null}::jsonb)
      WHERE id = ${id} AND progress = ${position.progress}
      RETURNING progress
    `;
    return updated ? unlockedProgress(updated.progress as Progress, lastVisited) : null;
  }
  const [updated] = await sql`
    UPDATE participants
    SET progress = ${next},
        last_visited_step = ${lastVisited}
    WHERE id = ${id} AND progress = ${position.progress}
    RETURNING progress
  `;
  return updated ? unlockedProgress(updated.progress as Progress, lastVisited) : null;
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

export async function startChapterUsability(chapter: UsabilityChapter) {
  if (!isUsabilityChapter(chapter)) return null;
  const id = await participantSessionId();
  const attempt = id ? await openFirstAttempt(id, chapter) : null;
  return attempt ? { ...attempt, project: postHogProject() } : null;
}

export async function switchChapter(expected: Progress, forwardFromTutorial = false, outcome: AttemptOutcome = "completed") {
  const attemptOutcome = outcome === "skipped" ? "skipped" : "completed";
  if (expected === "pengantar" || expected === "replay-pengantar") {
    return moveParticipant(expected, nextProgress[expected], { outcome: attemptOutcome });
  }
  if (expected === "tutorial" || expected === "replay-tutorial") {
    return forwardFromTutorial
      ? moveParticipant(expected, nextProgress[expected], { outcome: attemptOutcome })
      : moveParticipant(expected, previousProgress[expected]);
  }
  if (expected === "latihan" || expected === "replay-latihan") {
    return moveParticipant(expected, previousProgress[expected]);
  }
  return null;
}

export async function advanceProgress(expected: Progress, formData: FormData) {
  if (!Object.hasOwn(nextProgress, expected)) redirect("/");
  if (expected === "consent-form") {
    const consent = formData.get("consent");
    if (consent !== "yes" && consent !== "no") redirect("/consent-form");
    const progress = await moveParticipant(expected, nextProgress[expected], { consent: consent === "yes" })
      ?? await getParticipantProgress();
    redirect(progress ? progressPath(progress) : "/");
  }
  if (expected === "sus-form" || expected === "mls-form") {
    const [prefix, count] = expected === "sus-form" ? (["sus", 10] as const) : (["mls", 6] as const);
    const responses: number[] = [];
    for (let index = 1; index <= count; index++) {
      const answers = formData.getAll(`${prefix}-${index}`);
      const answer = answers[0];
      if (answers.length !== 1 || typeof answer !== "string" || !/^[1-7]$/.test(answer)
          || Number(answer) > questionnaireScales[prefix].length) {
        redirect(progressPath(expected));
      }
      responses.push(Number(answer));
    }
    const destination = await moveParticipant(expected, nextProgress[expected], { answers: responses });
    if (destination) {
      revalidatePath(progressPath(expected));
      redirect(progressPath(destination));
    }
    const current = await getParticipantProgress();
    redirect(current ? progressPath(current) : "/");
  }

  const progress = await moveParticipant(expected, nextProgress[expected], { outcome: expected === "latihan" ? "completed" : undefined })
    ?? await getParticipantProgress();
  redirect(progress ? progressPath(progress) : "/");
}
