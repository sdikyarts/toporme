import { Suspense, type ReactNode } from "react";

export default function ChaptersLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
