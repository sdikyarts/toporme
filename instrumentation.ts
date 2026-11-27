import { SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

export const loggerProvider = projectToken && posthogHost
  ? new LoggerProvider({
      resource: resourceFromAttributes({ "service.name": "toporme" }),
      processors: [
        new BatchLogRecordProcessor({
          exporter: new OTLPLogExporter({
            url: `${posthogHost.replace(/\/$/, "")}/i/v1/logs`,
            headers: {
              Authorization: `Bearer ${projectToken}`,
              "Content-Type": "application/json",
            },
          }),
        }),
      ],
    })
  : undefined;

if (!projectToken && process.env.NODE_ENV !== "production") {
  console.warn("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured");
}

if (!posthogHost && process.env.NODE_ENV !== "production") {
  console.warn("NEXT_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_HOST is configured");
}

export function register() {
  // The exporter only runs in the Node.js server runtime.
}

export function getPostHogLogger() {
  return loggerProvider?.getLogger("toporme.posthog");
}

export async function flushPostHogLogs() {
  await loggerProvider?.forceFlush().catch(() => {});
}

export { SeverityNumber };
