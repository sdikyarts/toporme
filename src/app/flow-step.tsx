import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { advanceProgress } from "./progress-action";
import ProgressButton from "./progress-button";
import { getParticipantPosition, progressPath, unlockedProgress, type ParticipantPosition, type Progress, type Step } from "./progress";
import StepVisit from "./step-visit";

type StepProps = {
  step: Step;
  title: string;
  children?: ReactNode | ((progress: Progress, position: ParticipantPosition) => ReactNode);
};

async function CurrentStep({ step, title, children }: StepProps) {
  const position = await getParticipantPosition();
  if (!position) redirect("/");
  const progress = unlockedProgress(position.progress, step);
  if (!progress) redirect(progressPath(position.lastVisited));

  return (
    <>
      <StepVisit step={step} />
      <StepContent step={step} title={title} progress={progress} position={position}>{children}</StepContent>
    </>
  );
}

function StepContent({ step, title, children, progress, position }: StepProps & {
  progress: Progress;
  position: ParticipantPosition;
}) {
  if (typeof children === "function") return children(progress, position);
  if (children !== undefined) return children;

  if (step === "consent-form" || step === "sus-form" || step === "mls-form") return null;

  return (
    <main className="login-container">
      <section className="login-card">
        <h1>{title}</h1>
        <form className="login-form" action={advanceProgress.bind(null, progress)}>
          <ProgressButton className="login-button">
            {step === "thank-you" ? "Ulangi latihan" : "Lanjut"}
          </ProgressButton>
        </form>
      </section>
    </main>
  );
}

export default function FlowStep(props: StepProps) {
  return (
    <Suspense fallback={null}>
      <CurrentStep {...props} />
    </Suspense>
  );
}
