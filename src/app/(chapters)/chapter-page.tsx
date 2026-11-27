import { createHash } from "node:crypto";
import Script from "next/script";
import FlowStep from "../flow-step";
import { participantSessionId } from "../progress";
import { isUsabilityChapter } from "../usability";
import ChapterFlow from "./chapter-flow";

export default async function ChapterPage({
  step, initialTutorialStage, initialLatihanOpen,
}: { step: "pengantar" | "tutorial" | "latihan"; initialTutorialStage?: number; initialLatihanOpen?: boolean }) {
  const participant = await participantSessionId();
  const storageScope = participant ? createHash("sha256").update(participant).digest("hex") : null;
  const clarityProjectId = process.env.CLARITY_PROJECT_ID;

  return (
    <FlowStep step={step} title={step}>
      {(progress, position) => (
        <>
          {clarityProjectId && /^[a-z0-9]+$/i.test(clarityProjectId) &&
            position.researchConsent && isUsabilityChapter(position.progress) && (
              <Script id="toporme-clarity" strategy="afterInteractive">{`
                (function(c,l,a,r,i,t,y){
                    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", ${JSON.stringify(clarityProjectId)});
              `}</Script>
            )}
          <ChapterFlow progress={progress} initialTutorialStage={initialTutorialStage}
            initialLatihanOpen={initialLatihanOpen} storageScope={storageScope} />
        </>
      )}
    </FlowStep>
  );
}
