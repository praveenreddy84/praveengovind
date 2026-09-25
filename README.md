# praveengovind

Personal website of Praveen Govind — Next.js 15, Tailwind CSS and Framer Motion.

## Editing content

All copy (intro, highlights, stats, selected work, experience, stack, contact links) lives in
[`lib/site.ts`](lib/site.ts). Update that file and the page picks it up; no component changes needed.

- Logo: the `PG` monogram (`Logo` in `components/primitives.tsx`) and favicon (`app/icon.svg`).
- Colors: the `--site-*` variables in `app/globals.css` (light and dark themes).

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

## Deployment

Hosted on [Vercel](https://vercel.com). Pushes to `main` deploy to production; other branches get preview URLs.
`.npmrc` sets `legacy-peer-deps` so installs work without extra flags.

The site can also run on AWS (S3 + CloudFront + a serverless contact API), defined in CDK under
[`infra/`](infra/README.md). `STATIC_EXPORT=1 npm run build` produces the static files it deploys.
