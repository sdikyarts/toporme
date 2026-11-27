"use client";

import { useEffect } from "react";
import { startChapterUsability } from "../progress-action";
import type { UsabilityChapter } from "../usability";
import { loadPostHog } from "./posthog-browser";

export function useChapterUsability(chapter: UsabilityChapter, replay: boolean) {
  useEffect(() => {
    if (replay) return;
    let cancelled = false;
    let stopCapture: (() => void) | undefined;
    let expiration: number | undefined;

    async function start() {
      const attempt = await startChapterUsability(chapter);
      if (cancelled || !attempt?.project) return;
      const deadline = performance.now() + attempt.remainingMs;
      const posthog = await loadPostHog(attempt.project.token, attempt.project.host);
      if (cancelled || performance.now() >= deadline || window.location.pathname !== `/${chapter}`) return;

      posthog.identify(attempt.distinctId);
      const properties = { chapter, attempt_id: attempt.id, attempt_number: 1 };
      posthog.register(properties);
      posthog.set_config({ capture_heatmaps: true });

      function captureFeature(event: MouseEvent) {
        if (window.location.pathname !== `/${chapter}` || performance.now() >= deadline) return;
        const feature = event.target instanceof Element
          ? event.target.closest<HTMLElement>("[data-usability-feature]")?.dataset.usabilityFeature
          : undefined;
        if (feature) posthog.capture("chapter_feature_used", { ...properties, feature });
      }
      window.addEventListener("click", captureFeature, true);
      stopCapture = () => {
        window.removeEventListener("click", captureFeature, true);
        stopCapture = undefined;
        try {
          // Disabling heatmaps clears the SDK buffer. Send it under this attempt's identity first.
          const heatmapData = posthog.heatmaps?.getAndClearBuffer?.();
          if (heatmapData && Object.keys(heatmapData).length > 0) {
            posthog.capture("$$heatmap", { ...properties, $heatmap_data: heatmapData }, { send_instantly: true });
          }
        } finally {
          posthog.set_config({ capture_heatmaps: false });
          posthog.reset();
        }
      };
      expiration = window.setTimeout(() => stopCapture?.(), Math.max(0, deadline - performance.now()));
    }

    void start().catch(() => console.error("Could not start chapter usability measurement"));
    return () => {
      cancelled = true;
      window.clearTimeout(expiration);
      stopCapture?.();
    };
  }, [chapter, replay]);
}
