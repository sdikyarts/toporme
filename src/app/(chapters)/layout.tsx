import { Suspense, type ReactNode } from "react";

export const instant = false;

export default function ChaptersLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
