This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Chapter usability in PostHog

1. Apply the Neon migrations with `npm run db:migrate`.
2. For the Vercel Marketplace integration, confirm that `POSTHOG_PROJECT_API_KEY` and `POSTHOG_HOST` are available in Production. For manual setup, set `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` instead. Redeploy if you changed any settings. Use your PostHog ingestion host, such as `https://us.i.posthog.com` or `https://eu.i.posthog.com`.
3. Build a funnel from `chapter_started` to `chapter_completed` for each chapter. Filter both steps by `chapter` and `attempt_number = 1` and use a 30-minute conversion window. Chart the median of `duration_ms` on `chapter_completed` and count `chapter_skipped` separately.
4. In PostHog Heatmap settings, add the three production chapter URL patterns, such as `https://toporme.vercel.app/tutorial*`. Use the wildcard to include worksheet query parameters. Compare phone and desktop viewports separately. If the in-app preview shows the login screen, open PostHog's browser extension while signed into TopORME. Use `chapter_feature_used` for exact counts of Hint, Baca Materi, and Periksa clicks.

Each chapter's window starts when the participant first enters that chapter, including its title screen. A refresh resumes the same window. Skips, completions, and expired windows cannot be replaced. Elapsed time includes time away from the tab. Only participants with saved research consent are included. Session replay is disabled. Neon retains outcomes in `chapter_first_attempts` even if PostHog delivery fails.
