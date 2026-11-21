import { Suspense } from "react";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";
import { getParticipantProgress, progressPath } from "./progress";

async function ResumeOrLogin() {
  const progress = await getParticipantProgress();
  if (progress) redirect(progressPath(progress));
  return <LoginForm />;
}

export default function Home() {
  return <Suspense fallback={null}><ResumeOrLogin /></Suspense>;
}
