import FlowStep from "../../flow-step";
import ConsentForm from "../../consent-form/consent-form";

export const metadata = { title: "Consent Form" };

export default function Page() {
  return (
    <FlowStep step="consent-form" title="Consent Form">
      <ConsentForm />
    </FlowStep>
  );
}
