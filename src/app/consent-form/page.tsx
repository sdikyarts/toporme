import FlowStep from "../flow-step";
import ConsentForm from "./consent-form";

export default function Page() {
  return (
    <FlowStep step="consent-form" title="Consent Form">
      <ConsentForm />
    </FlowStep>
  );
}
