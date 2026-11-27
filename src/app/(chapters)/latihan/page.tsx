import { createHash } from "node:crypto";
import FlowStep from "../../flow-step";
import { participantSessionId } from "../../progress";
import Latihan from "./latihan";
import { latihanPanelName } from "./latihan-state";

export default async function Page({ searchParams }: PageProps<"/latihan">) {
  const [{ panel }, participant] = await Promise.all([searchParams, participantSessionId()]);
  const storageScope = participant ? createHash("sha256").update(participant).digest("hex") : null;

  return <FlowStep step="latihan" title="Latihan">
    {(progress) => <Latihan key={`${storageScope}:${progress}`} progress={progress} initialOpen={panel === latihanPanelName}
      storageKey={storageScope ? `toporme:latihan:v1:${storageScope}:${progress}` : null} />}
  </FlowStep>;
}
