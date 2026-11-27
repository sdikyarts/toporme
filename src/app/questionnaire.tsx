"use client";

import type { ReactNode } from "react";
import posthog from "posthog-js";
import { advanceProgress } from "./progress-action";
import ProgressButton from "./progress-button";
import { questionnaireScales } from "./questionnaire-scale";

type QuestionnaireProps = {
  idPrefix: "sus" | "mls";
  lang: string;
  title: string;
  instructions: string;
  introduction?: ReactNode;
  statements: readonly string[];
  source?: { href: string; label: string };
};

export default function Questionnaire({ idPrefix, lang, title, instructions, introduction, statements, source }: QuestionnaireProps) {
  const { max, start, end } = questionnaireScales[idPrefix];
  const ratings = Array.from({ length: max }, (_, index) => index + 1);

  return (
    <main className="consent-container sus-container" lang={lang}>
      <h1>{title}</h1>
      <form
        className="consent-form sus-form"
        action={advanceProgress.bind(null, idPrefix === "sus" ? "sus-form" : "mls-form")}
        onSubmit={() => {
          if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST) {
            posthog.capture("questionnaire_submitted", {
              questionnaire: idPrefix,
              question_count: statements.length,
            });
          }
        }}
      >
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
            <fieldset className="sus-question" key={name} aria-describedby={`${name}-scale`}>
              <legend>{index + 1}. {statement}</legend>
              <div className="questionnaire-ratings" data-count={max}>
                {ratings.map((value) => (
                  <label className="option option-item" key={value}>
                    <span>{value}</span>
                    <input type="radio" name={name} value={value} required />
                  </label>
                ))}
              </div>
              <div className="questionnaire-scale" id={`${name}-scale`}>
                <span>1 = {start}</span>
                <span>{max} = {end}</span>
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
