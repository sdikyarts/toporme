import type { ReactNode } from "react";
import { advanceProgress } from "./progress-action";
import ProgressButton from "./progress-button";

type QuestionnaireProps = {
  idPrefix: "sus" | "mls";
  lang: string;
  title: string;
  instructions: string;
  introduction?: ReactNode;
  statements: readonly string[];
  ratings: readonly string[];
  source?: { href: string; label: string };
};

export default function Questionnaire({ idPrefix, lang, title, instructions, introduction, statements, ratings, source }: QuestionnaireProps) {
  return (
    <main className="consent-container sus-container" lang={lang}>
      <h1>{title}</h1>
      <form className="consent-form sus-form" action={advanceProgress.bind(null, idPrefix === "sus" ? "sus-form" : "mls-form")}>
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
            <fieldset className="sus-question" key={name}>
              <legend>{index + 1}. {statement}</legend>
              <div className="options">
                {ratings.map((rating, ratingIndex) => {
                  const value = ratingIndex + 1;
                  const id = `${name}-${value}`;
                  return (
                    <div className="option" key={id}>
                      <div className="option-item">
                        <input type="radio" id={id} name={name} value={value} required />
                        <label htmlFor={id}>{value}. {rating}</label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
        {source && <a className="underline" href={source.href}>{source.label}</a>}
        <ProgressButton className="consent-form-button">
          {lang === "id" ? "Lanjutkan" : "Continue"}
        </ProgressButton>
      </form>
    </main>
  );
}
