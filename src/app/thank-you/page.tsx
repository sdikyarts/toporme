import FlowStep from "../flow-step";
import { logoutParticipant } from "../participant-action";
import ProgressButton from "../progress-button";

export default function Page() {
  return (
    <FlowStep step="thank-you" title="Terima kasih">
      <main className="login-container">
        <section className="login-card thank-you-card">
          <div>
            <h1 className="thank-you-heading" lang="en">
              <span>Thank</span>{" "}<span>You!</span>
            </h1>
            <p lang="id">Terima kasih telah menggunakan TopORME!</p>
          </div>
          <form className="login-form" action={logoutParticipant}>
            <ProgressButton className="consent-form-button">Logout</ProgressButton>
          </form>
        </section>
      </main>
    </FlowStep>
  );
}
