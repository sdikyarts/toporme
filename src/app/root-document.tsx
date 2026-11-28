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
            const supportsWindowMeasurement = navigator.userAgent.includes('Chrome/');
            let displayKey;
            let displayScale;

            function measureWindowZoom() {
              if (!supportsWindowMeasurement) return null;
              try {
                const { outerWidth, innerWidth } = window.top;
                if (outerWidth > 0 && innerWidth > 0 && outerWidth !== innerWidth) {
                  // Round the browser window ratio to account for its borders.
                  return Math.round(outerWidth / innerWidth * 20) / 20;
                }
              } catch {
                // A cross-origin preview cannot read its host's viewport.
              }
              return null;
            }

            function estimateDisplayScale(pixelRatio) {
              // In an isolated preview, DPR includes both display scaling and page zoom.
              const zoomSteps = [1, 0.95, 0.9, 0.85, 0.8];
              for (const zoom of zoomSteps) {
                const density = pixelRatio / zoom;
                const nearestQuarter = Math.round(density * 4) / 4;
                if (nearestQuarter >= 1 && Math.abs(nearestQuarter - density) < 0.005) {
                  return nearestQuarter;
                }
              }
              return Math.max(1, Math.round(pixelRatio * 4) / 4);
            }

            function matchDesktopLayout() {
              const isTouchOnly = navigator.maxTouchPoints > 0 && touchOnly.matches;
              if (isTouchOnly) {
                root.style.removeProperty('--layout-scale');
                return;
              }

              const pixelRatio = window.devicePixelRatio || 1;
              const key = 'toporme:display-scale:' + screen.width + 'x' + screen.height + ':' + screen.availLeft + ',' + screen.availTop;
              if (key !== displayKey) {
                displayKey = key;
                const measuredZoom = measureWindowZoom();
                const windowScale = measuredZoom ? pixelRatio / measuredZoom : 0;
                const measuredScale = windowScale >= 0.95 ? windowScale : null;
                displayScale = measuredScale ?? estimateDisplayScale(pixelRatio);
                try {
                  const storedScale = Number(sessionStorage.getItem(key));
                  if (measuredScale === null && storedScale > 0) {
                    displayScale = storedScale;
                  }
                  sessionStorage.setItem(key, String(displayScale));
                } catch {
                  // Sandboxed previews can disable storage.
                }
              }

              const pageZoom = pixelRatio / displayScale;
              const layoutScale = 0.8 / Math.min(1, Math.max(0.8, pageZoom));
              root.style.setProperty('--layout-scale', layoutScale);
            }

            function watchResolution() {
              window.matchMedia('(resolution: ' + (window.devicePixelRatio || 1) + 'dppx)')
                .addEventListener('change', watchResolution, { once: true });
              matchDesktopLayout();
            }

            watchResolution();
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
