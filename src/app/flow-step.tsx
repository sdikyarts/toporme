import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import ChapterLayout, { chapterProgressForm } from "./chapter-layout";
import ChapterNavigation from "./chapter-navigation";
import ChapterTitle from "./pengantar/chapter-title";
import { advanceProgress, returnToPreviousChapter } from "./progress-action";
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

  if (step === "latihan") {
    return (
      <ChapterLayout
        progress={progress}
        percent={0}
        navigation={
          <>
            <form id="previous-chapter" action={returnToPreviousChapter.bind(null, progress)} hidden />
            <ChapterNavigation
              isFirstPage={false}
              prevForm="previous-chapter"
              nextForm={chapterProgressForm}
            />
          </>
        }
      >
        <div className="chapter-panel">
          <ChapterTitle />
        </div>
      </ChapterLayout>
    );
  }

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
  if (props.step === "pengantar" || props.step === "tutorial" || props.step === "latihan") {
    return <CurrentStep {...props} />;
  }

  return (
    <Suspense fallback={null}>
      <CurrentStep {...props} />
    </Suspense>
  );
}
