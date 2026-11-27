import ChapterPage from "../chapter-page";
import { chapterTabTitles } from "../chapter-titles";
import { tutorialPanelName, tutorialStageFromParam } from "./tutorial-flow";

export const metadata = { title: chapterTabTitles.tutorial };

export default async function Page({ searchParams }: PageProps<"/tutorial">) {
  const { panel, stage } = await searchParams;
  const openWorksheet = panel === tutorialPanelName;
  const initialTutorialStage = openWorksheet && typeof stage === "string" ? tutorialStageFromParam(stage) : 0;

  return <ChapterPage step="tutorial" initialTutorialStage={openWorksheet ? initialTutorialStage : undefined} />;
}
