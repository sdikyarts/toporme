"use server";

import { redirect } from "next/navigation";
import { getParticipantProgress, nextProgress, participantSessionId, progressDatabase, progressPath, type Progress } from "./progress";

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
