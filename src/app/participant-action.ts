"use server";

import { neon } from "@neondatabase/serverless";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { progressPath, type Progress } from "./progress";

export type ParticipantState = {
  status: "idle" | "error";
  message: string;
  fields?: { namaLengkap: string; npm: string; email: string };
};

export async function saveParticipant(
  _previousState: ParticipantState,
  formData: FormData,
): Promise<ParticipantState> {
  const readField = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value.trim() : "";
  };
  const fields = {
    namaLengkap: readField("namaLengkap"),
    npm: readField("npm"),
    email: readField("email"),
  };
  const { namaLengkap, npm, email } = fields;

  if (!namaLengkap || namaLengkap.length > 200 || !npm || npm.length > 50 ||
      email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      status: "error",
      message: "Periksa nama lengkap, NPM, dan alamat email Anda.",
      fields,
    };
  }

  let participantId: string | undefined;
  let progress: Progress = "consent-form";
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL is missing");
    const sql = neon(databaseUrl);
    const [, participants] = await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${npm}, 0))`,
      sql`
        WITH existing AS (
          SELECT id, email, progress
          FROM participants
          WHERE student_number = ${npm}
        ), registered AS (
          INSERT INTO participants (full_name, student_number, email)
          SELECT ${namaLengkap}, ${npm}, ${email}
          WHERE NOT EXISTS (SELECT 1 FROM existing)
          RETURNING id, progress
        )
        SELECT id, progress FROM existing WHERE LOWER(BTRIM(email)) = LOWER(${email})
        UNION ALL
        SELECT id, progress FROM registered
        ORDER BY id
        LIMIT 1
      `,
    ]);
    participantId = participants[0]?.id;
    progress = participants[0]?.progress ?? progress;
  } catch {
    console.error("Failed to save participant to Postgres");
    return {
      status: "error",
      message: "Data belum tersimpan. Silakan coba lagi.",
      fields,
    };
  }

  if (!participantId) {
    return {
      status: "error",
      message: "Periksa kembali NPM dan alamat email Anda.",
      fields,
    };
  }

  (await cookies()).set("toporme_participant", participantId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  redirect(progressPath(progress));
}
