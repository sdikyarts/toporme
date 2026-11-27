"use client";

import posthog from "posthog-js";
import { useFormStatus } from "react-dom";

type ProgressButtonProps = {
  className: string;
  children: string;
  disabled?: boolean;
  lang?: string;
  resetPostHog?: boolean;
};

export default function ProgressButton({ className, children, disabled, lang, resetPostHog }: ProgressButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className}
      disabled={disabled || pending}
      lang={lang}
      onClick={() => {
        if (
          resetPostHog &&
          process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN &&
          process.env.NEXT_PUBLIC_POSTHOG_HOST
        ) {
          posthog.reset();
        }
      }}
    >
      {children}
    </button>
  );
}
