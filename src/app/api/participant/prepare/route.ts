import { neon } from "@neondatabase/serverless";

let nextWarmupAt = 0;

export async function POST() {
  const url = process.env.DATABASE_URL;
  if (url && Date.now() >= nextWarmupAt) {
    nextWarmupAt = Date.now() + 60_000;
    try {
      const sql = neon(url, { fetchOptions: { signal: AbortSignal.timeout(5_000) } });
      await sql`SELECT 1`;
    } catch {
      // The submission can still connect to Neon directly.
    }
  }

  return new Response(null, { status: 204 });
}
