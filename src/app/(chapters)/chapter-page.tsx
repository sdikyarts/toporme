import { createHash } from "node:crypto";
import FlowStep from "../flow-step";
import { participantSessionId } from "../progress";
import ChapterFlow from "./chapter-flow";

export default async function ChapterPage({
  step, initialTutorialStage, initialLatihanOpen,
}: { step: "pengantar" | "tutorial" | "latihan"; initialTutorialStage?: number; initialLatihanOpen?: boolean }) {
  const participant = await participantSessionId();
  const storageScope = participant ? createHash("sha256").update(participant).digest("hex") : null;

  return (
    <FlowStep step={step} title={step}>
      {(progress) => (
        <ChapterFlow progress={progress} initialTutorialStage={initialTutorialStage}
          initialLatihanOpen={initialLatihanOpen} storageScope={storageScope} />
      )}
    </FlowStep>
  );
}
