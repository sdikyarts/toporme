import FlowStep from "../../flow-step";
import ChapterFlow from "../chapter-flow";
import { tutorialPanelName, tutorialStageFromParam } from "./tutorial-flow";

export default async function Page({ searchParams }: PageProps<"/tutorial">) {
  const { panel, stage } = await searchParams;
  const openWorksheet = panel === tutorialPanelName;
  const initialTutorialStage = openWorksheet && typeof stage === "string" ? tutorialStageFromParam(stage) : 0;

  return <FlowStep step="tutorial" title="Tutorial">
    {(progress) => <ChapterFlow key={openWorksheet ? `tutorial-${initialTutorialStage}` : "tutorial-title"} progress={progress}
      initialTutorialStage={openWorksheet ? initialTutorialStage : undefined} />}
  </FlowStep>;
}
