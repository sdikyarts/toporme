import Script from "next/script";
import "./utilities.tailwind.css";
import "./globals.css";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
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
            async function revealPage() {
              if (document.fonts) {
                await Promise.allSettled(${JSON.stringify(roundedFonts.map(({ weight }) => weight))}.map(weight =>
                  document.fonts.load(weight + ' 16px "SF Pro Rounded"')
                ));
              }
              document.documentElement.classList.remove('font-loading');
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
