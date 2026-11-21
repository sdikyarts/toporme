import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

try {
  const url = process.env.DATABASE_URL_UNPOOLED;
  if (!url) throw new Error("DATABASE_URL_UNPOOLED is missing");

  const sql = neon(url);
  const migration = await readFile(new URL("../migrations/001_participants.sql", import.meta.url), "utf8");
  await sql.query(migration);
  console.log("Applied 001_participants.sql");
} catch (error) {
  console.error("Participants migration failed", error.code ?? error.name);
  process.exitCode = 1;
}
