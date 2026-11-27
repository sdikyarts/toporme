import ChapterTitle from "../pengantar/chapter-title";
import TutorialStep, { type TutorialStepProps } from "./tutorial-step";
import { tutorialPanelName } from "./tutorial-flow";

export const tutorialTitle = "Tutorial Topological Sort";

type TutorialProps = TutorialStepProps & {
    activePage: number;
};

export default function Tutorial({ activePage, ...stepProps }: TutorialProps) {
    return (
        <>
            <div className="chapter-panel" inert={activePage !== 0}>
                <ChapterTitle section="Bagian 2" title={tutorialTitle} />
            </div>
            <section id={tutorialPanelName} className="chapter-panel" aria-label="Tutorial step" inert={activePage !== 1}>
                <TutorialStep {...stepProps} />
            </section>
        </>
    );
}
