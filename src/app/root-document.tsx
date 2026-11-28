import Script from "next/script";
import type { ReactNode } from "react";
import "./utilities.tailwind.css";
import "./globals.css";

export const metadata = {
  title: { default: "TopORME", template: "%s - TopORME" },
};

const roundedFonts = [
  { weight: 600, url: "/fonts/SF-Pro-Rounded-Semibold.woff2" },
  { weight: 700, url: "/fonts/SF-Pro-Rounded-Bold.woff2" },
  { weight: 800, url: "/fonts/SF-Pro-Rounded-Heavy.woff2" },
];

const initialFontStyles = roundedFonts.map(({ weight, url }) => `
  @font-face {
    font-family: "SF Pro Rounded";
    src: url("${url}") format("woff2");
    font-weight: ${weight};
    font-display: block;
  }
`).join("") + '.font-loading body { visibility: hidden; }';

export default function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="font-loading" suppressHydrationWarning>
      <head>
        {roundedFonts.map(({ url }) => (
          <link key={url} rel="preload" href={url} as="font" type="font/woff2" crossOrigin="anonymous" />
        ))}
        <style>{initialFontStyles}</style>
        <noscript><style>{".font-loading body { visibility: visible; }"}</style></noscript>
      </head>
      <body suppressHydrationWarning>
        <Script id="load-rounded-font" strategy="beforeInteractive">{`
          (function () {
            const root = document.documentElement;
            const touchOnly = window.matchMedia('(pointer: coarse) and (hover: none)');

            function matchDesktopLayout() {
              const isTouchOnly = navigator.maxTouchPoints > 0 && touchOnly.matches;
              if (isTouchOnly || window !== window.top || !window.outerWidth || !window.innerWidth) {
                root.style.removeProperty('--layout-scale');
                return;
              }

              // Round the viewport ratio to account for window borders.
              const pageZoom = Math.round(window.outerWidth / window.innerWidth * 20) / 20;
              const layoutScale = 0.8 / Math.min(1, Math.max(0.8, pageZoom));
              root.style.setProperty('--layout-scale', layoutScale);
            }

            matchDesktopLayout();
            window.addEventListener('resize', matchDesktopLayout);
            touchOnly.addEventListener('change', matchDesktopLayout);

            async function revealPage() {
              if (document.fonts) {
                await Promise.allSettled(${JSON.stringify(roundedFonts.map(({ weight }) => weight))}.map(weight =>
                  document.fonts.load(weight + ' 16px "SF Pro Rounded"')
                ));
              }
              root.classList.remove('font-loading');
            }
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', revealPage, { once: true });
            } else {
              revealPage();
            }
          })();
        `}</Script>
        {children}
      </body>
    </html>
  );
}
