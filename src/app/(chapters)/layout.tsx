import { Suspense, type ReactNode } from "react";
import RootDocument, { metadata as siteMetadata } from "../root-document";

export const instant = false;
export const metadata = siteMetadata;

export default function ChaptersLayout({ children }: { children: ReactNode }) {
  return (
    <RootDocument>
      <Suspense fallback={null}>{children}</Suspense>
    </RootDocument>
  );
}
