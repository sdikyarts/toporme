"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { recordStepVisit } from "./progress-action";
import type { Step } from "./progress";

export default function StepVisit({ step, participantId }: { step: Step; participantId: string }) {
  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN &&
      process.env.NEXT_PUBLIC_POSTHOG_HOST &&
      posthog.get_distinct_id() !== participantId
    ) {
      posthog.identify(participantId);
    }

    void recordStepVisit(step).catch(() => {
      console.error("Could not save the visited step");
    });
  }, [participantId, step]);

  return null;
}
