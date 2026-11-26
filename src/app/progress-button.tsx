"use client";

import { useFormStatus } from "react-dom";

type ProgressButtonProps = {
  className: string;
  children: string;
  disabled?: boolean;
};

export default function ProgressButton({ className, children, disabled }: ProgressButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={className} disabled={disabled || pending}>
      {children}
    </button>
  );
}
