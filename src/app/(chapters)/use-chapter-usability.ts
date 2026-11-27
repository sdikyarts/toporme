"use client";

import { useEffect } from "react";
import { startChapterUsability } from "../progress-action";
import type { UsabilityChapter } from "../usability";

export function useChapterUsability(chapter: UsabilityChapter, replay: boolean) {
  useEffect(() => {
    if (replay) return;
    void startChapterUsability(chapter).catch(() => console.error("Could not start chapter usability measurement"));
  }, [chapter, replay]);
}
