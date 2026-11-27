import { neon } from "@neondatabase/serverless";
import { after } from "next/server";
import { flushPostHogLogs, getPostHogLogger, SeverityNumber } from "../../../../../instrumentation";

let nextWarmupAt = 0;
const logger = getPostHogLogger();

export async function POST() {
  logger?.emit({
    body: "Participant database warm-up requested",
    severityNumber: SeverityNumber.INFO,
    attributes: { endpoint: "/api/participant/prepare" },
  });

  const url = process.env.DATABASE_URL;
  if (url && Date.now() >= nextWarmupAt) {
    nextWarmupAt = Date.now() + 60_000;
    try {
      const sql = neon(url, { fetchOptions: { signal: AbortSignal.timeout(5_000) } });
      await sql`SELECT 1`;
      logger?.emit({
        body: "Participant database warm-up completed",
        severityNumber: SeverityNumber.INFO,
        attributes: { endpoint: "/api/participant/prepare" },
      });
    } catch {
      logger?.emit({
        body: "Participant database warm-up failed",
        severityNumber: SeverityNumber.WARN,
        attributes: { endpoint: "/api/participant/prepare" },
      });
      // The submission can still connect to Neon directly.
    }
  }

  after(async () => {
    await flushPostHogLogs();
  });

  return new Response(null, { status: 204 });
}
