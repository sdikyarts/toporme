import FlowStep from "../flow-step";
import Pengantar from "./pengantar";

export default function Page() {
  return <FlowStep step="pengantar" title="Pengantar">
    {(progress) => <Pengantar progress={progress} />}
  </FlowStep>;
}
