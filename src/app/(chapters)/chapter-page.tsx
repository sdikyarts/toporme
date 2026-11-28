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
          {storageScope && clarityProjectId && /^[a-z0-9]+$/i.test(clarityProjectId) &&
            position.researchConsent && isUsabilityChapter(position.progress) && (
              <Script id="toporme-clarity" strategy="afterInteractive">{`
                (() => {
                  const projectId = ${JSON.stringify(clarityProjectId)};
                  const participantId = ${JSON.stringify(storageScope)};
                  const ownerKey = "toporme:clarity-owner:" + projectId;
                  function readOwner() {
                    try { return localStorage.getItem(ownerKey); } catch { return null; }
                  }

                  // Clarity reads these cookies at startup, before it processes identify calls.
                  if (readOwner() !== participantId) {
                    const domain = location.hostname.split(".");
                    for (const name of ["_clck", "_clsk"]) {
                      const expired = name + "=; Max-Age=0; Path=/";
                      document.cookie = expired;
                      for (let index = 0; index < domain.length - 1; index++) {
                        document.cookie = expired + "; Domain=" + domain.slice(index).join(".");
                      }
                    }
                    try { sessionStorage.removeItem("_cltk"); } catch {}
                    try { localStorage.setItem(ownerKey, participantId); } catch {}
                  }

                  let switchedParticipant = false;
                  function stopPreviousRecording() {
                    switchedParticipant = true;
                    window.clarity("stop");
                  }

                  window.clarity = window.clarity || function () {
                    (window.clarity.q = window.clarity.q || []).push(arguments);
                  };
                  window.addEventListener("storage", (event) => {
                    if (event.key === ownerKey && event.newValue !== participantId) stopPreviousRecording();
                  });
                  window.addEventListener("pageshow", (event) => {
                    const owner = readOwner();
                    if (event.persisted && owner && owner !== participantId) stopPreviousRecording();
                  });
                  window.clarity("metadata", () => {
                    if (!switchedParticipant) window.clarity("identify", participantId);
                  }, false, true);

                  const tag = document.createElement("script");
                  tag.async = true;
                  tag.src = "https://www.clarity.ms/tag/" + projectId;
                  document.head.append(tag);
                })();
              `}</Script>
            )}
          <ChapterFlow progress={progress} initialTutorialStage={initialTutorialStage}
            initialLatihanOpen={initialLatihanOpen} storageScope={storageScope} />
        </>
      )}
    </FlowStep>
  );
}
