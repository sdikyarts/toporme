import FlowStep from "../../flow-step";
import ChapterFlow from "../chapter-flow";

export default function Page() {
  return <FlowStep step="pengantar" title="Pengantar">
    {(progress) => <ChapterFlow progress={progress} />}
  </FlowStep>;
}
