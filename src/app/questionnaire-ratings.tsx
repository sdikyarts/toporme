"use client";

import { useState, type CSSProperties } from "react";

type QuestionnaireRatingsProps = {
  name: string;
  ratings: readonly string[];
  savedAnswer?: number;
};

export default function QuestionnaireRatings({ name, ratings, savedAnswer }: QuestionnaireRatingsProps) {
  const [answer, setAnswer] = useState(savedAnswer);
  const midpoint = Math.floor(ratings.length / 2);

  return (
    <div className="questionnaire-ratings" data-count={ratings.length}>
      {ratings.map((label, index) => {
        const value = index + 1;
        const checked = answer === value;
        const distance = (index - midpoint) / midpoint;
        const endpoint = distance < 0 ? "#b91c1c" : "#15803d";
        const accent = `color-mix(in oklab, ${endpoint} ${Math.abs(distance) * 100}%, var(--color-tailwind-slate-600))`;

        return (
          <label className="option option-item" key={value} style={{ "--rating-accent": accent } as CSSProperties}>
            <span>{value}</span>
            <input
              type="radio"
              name={name}
              value={value}
              checked={checked}
              onChange={() => setAnswer(value)}
              onClick={() => {
                if (checked) setAnswer(undefined);
              }}
              onKeyDown={(event) => {
                if (checked && event.key === " ") {
                  event.preventDefault();
                  setAnswer(undefined);
                }
              }}
              required
            />
            <span className="questionnaire-rating-label">{label}</span>
          </label>
        );
      })}
    </div>
  );
}
