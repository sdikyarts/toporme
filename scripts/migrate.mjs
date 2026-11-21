import { readdir, readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

try {
  const url = process.env.DATABASE_URL_UNPOOLED;
  if (!url) throw new Error("DATABASE_URL_UNPOOLED is missing");

  const sql = neon(url);
  const directory = new URL("../migrations/", import.meta.url);
  const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
  for (const file of files) {
    await sql.query(await readFile(new URL(file, directory), "utf8"));
    console.log("Applied", file);
  }
} catch (error) {
  console.error("Participants migration failed", error.code ?? error.name);
  process.exitCode = 1;
}
