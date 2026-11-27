import type { ReactNode } from "react";
import { advanceProgress } from "./progress-action";
import ProgressButton from "./progress-button";
import { questionnaireScales } from "./questionnaire-scale";
import { participantSessionId, progressDatabase } from "./progress";

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
  const ratings = questionnaireScales[idPrefix];
  const midpoint = Math.floor(ratings.length / 2);
  const id = await participantSessionId();
  const sql = progressDatabase();
  const [response] = await sql`
    SELECT CASE WHEN ${idPrefix} = 'sus' THEN sus_answers ELSE mls_answers END AS answers
    FROM participants WHERE id = ${id}
  `;
  const savedAnswers = response?.answers as number[] | null | undefined;

  return (
    <main className="consent-container sus-container" lang={lang}>
      <h1>{title}</h1>
      <form className="consent-form sus-form" key={savedAnswers?.join(",")}
        action={advanceProgress.bind(null, idPrefix === "sus" ? "sus-form" : "mls-form")}>
        <div className="consent-text-item">
          {introduction}
          <p>{instructions}</p>
        </div>
        <svg className="consent-divider" viewBox="0 0 966 2" aria-hidden="true">
          <path d="M1 1H965" />
        </svg>
        {statements.map((statement, index) => {
          const name = `${idPrefix}-${index + 1}`;
          const savedAnswer = savedAnswers?.[index];
          return (
            <fieldset className="sus-question" key={name}>
              <legend>{index + 1}. {statement}</legend>
              <div className="questionnaire-ratings" data-count={ratings.length}>
                {ratings.map((label, ratingIndex) => {
                  const value = ratingIndex + 1;
                  const tone = ratingIndex < midpoint ? "low" : ratingIndex > midpoint ? "high" : "middle";
                  return (
                    <label className="option option-item" key={value} data-tone={tone}>
                      <span>{value}</span>
                      <input type="radio" name={name} value={value} defaultChecked={savedAnswer === value} required />
                      <span className="questionnaire-rating-label">{label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
        {source && <a className="underline" href={source.href}>{source.label}</a>}
        <ProgressButton className="consent-form-button" lang="id">Lanjutkan</ProgressButton>
      </form>
    </main>
  );
}
