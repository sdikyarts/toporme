import type { ReactNode } from "react";
import Link from "next/link";
import { advanceProgress } from "./progress-action";
import ProgressButton from "./progress-button";
import QuestionnaireRatings from "./questionnaire-ratings";
import { legacySusRatings, questionnaireScales } from "./questionnaire-scale";
import { nextProgress, participantSessionId, progressDatabase, progressPath } from "./progress";

type QuestionnaireProps = {
  idPrefix: "sus" | "mls";
  lang: string;
  title: string;
  instructions: string;
  introduction?: ReactNode;
  statements: readonly string[];
  source?: { href: string; label: string };
};

export default async function Questionnaire({ idPrefix, lang, title, instructions, introduction, statements, source }: QuestionnaireProps) {
  const step = idPrefix === "sus" ? "sus-form" : "mls-form";
  const id = await participantSessionId();
  const sql = progressDatabase();
  const [response] = await sql`
    SELECT CASE WHEN ${idPrefix} = 'sus' THEN sus_answers ELSE mls_answers END AS answers, sus_response_scale
    FROM participants WHERE id = ${id}
  `;
  const savedAnswers = response?.answers as number[] | null | undefined;
  const ratings = idPrefix === "sus" && savedAnswers && response?.sus_response_scale === 7
    ? legacySusRatings : questionnaireScales[idPrefix];

  return (
    <main className="consent-container sus-container" lang={lang}>
      <h1>{title}</h1>
      <form className="consent-form sus-form" key={savedAnswers?.join(",")}
        action={advanceProgress.bind(null, step)}>
        <div className="consent-text-item">
          {introduction}
          <p>{instructions}</p>
        </div>
        <svg className="consent-divider" viewBox="0 0 966 2" aria-hidden="true">
          <path d="M1 1H965" />
        </svg>
        {statements.map((statement, index) => {
          const name = `${idPrefix}-${index + 1}`;
          return (
            <fieldset className="sus-question" key={name} disabled={Boolean(savedAnswers)}>
              <legend>{index + 1}. {statement}</legend>
              <QuestionnaireRatings name={name} ratings={ratings} savedAnswer={savedAnswers?.[index]} />
            </fieldset>
          );
        })}
        {source && <a className="underline" href={source.href}>{source.label}</a>}
        {savedAnswers ? (
          <Link className="underline" href={progressPath(nextProgress[step])} lang="id" prefetch={false}>Lanjutkan</Link>
        ) : <ProgressButton className="consent-form-button" lang="en">Submit Form</ProgressButton>}
      </form>
    </main>
  );
}
