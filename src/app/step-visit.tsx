"use client";

import { useEffect } from "react";
import { recordStepVisit } from "./progress-action";
import type { Step } from "./progress";

export default function StepVisit({ step }: { step: Step }) {
  useEffect(() => {
    void recordStepVisit(step).catch(() => {
      console.error("Could not save the visited step");
    });
  }, [step]);

  return null;
}
