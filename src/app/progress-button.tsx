"use client";

import { useFormStatus } from "react-dom";

type ProgressButtonProps = {
  className: string;
  children: string;
  disabled?: boolean;
  lang?: string;
};

export default function ProgressButton({ className, children, disabled, lang }: ProgressButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={className} disabled={disabled || pending} lang={lang}>
      {children}
    </button>
  );
}
