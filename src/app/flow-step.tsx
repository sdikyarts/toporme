import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { advanceProgress } from "./progress-action";
import ProgressButton from "./progress-button";
import { getParticipantProgress, progressPath, type Progress } from "./progress";

type StepProps = {
  step: Exclude<Progress, `replay-${string}`>;
  title: string;
  children?: ReactNode | ((progress: Progress) => ReactNode);
};

async function CurrentStep({ step, title, children }: StepProps) {
  const progress = await getParticipantProgress();
  if (!progress) redirect("/");
  if (progressPath(progress) !== progressPath(step)) redirect(progressPath(progress));

  if (typeof children === "function") return children(progress);
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
    <Suspense fallback={
      <main className="login-container">
        <section className="login-card">
          <h1>{props.title}</h1>
          <p role="status">Memuat…</p>
        </section>
      </main>
    }>
      <CurrentStep {...props} />
    </Suspense>
  );
}
