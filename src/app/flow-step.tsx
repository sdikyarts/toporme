import { Suspense } from "react";
import { redirect } from "next/navigation";
import { advanceProgress } from "./progress-action";
import { getParticipantProgress, progressPath, type Progress } from "./progress";

type StepProps = {
  step: Exclude<Progress, `replay-${string}`>;
  title: string;
};

async function CurrentStep({ step, title }: StepProps) {
  const progress = await getParticipantProgress();
  if (!progress) redirect("/");
  if (progressPath(progress) !== progressPath(step)) redirect(progressPath(progress));

  if (step === "consent-form" || step === "sus-form" || step === "mls-form") return null;

  return (
    <main className="login-container">
      <section className="login-card">
        <h1>{title}</h1>
        <form className="login-form" action={advanceProgress.bind(null, progress)}>
          <button type="submit" className="login-button">
            {step === "thank-you" ? "Ulangi latihan" : "Lanjut"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function FlowStep(props: StepProps) {
  return <Suspense fallback={null}><CurrentStep {...props} /></Suspense>;
}
