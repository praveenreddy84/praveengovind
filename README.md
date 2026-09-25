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
`.npmrc` sets `legacy-peer-deps` so installs work without extra flags. GitHub Actions runs the tests and a build check.

### Environment variables (Vercel → Settings → Environment Variables)

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | API key from [Resend](https://resend.com); the contact form sends email through it. |
| `CONTACT_TO_EMAIL` | Inbox that receives contact form messages. Kept out of the code on purpose. |
| `CONTACT_FROM_EMAIL` | Optional sender. Defaults to Resend's test sender, which can only deliver to the Resend account's own email. |
| `NEXT_PUBLIC_SITE_URL` | Optional canonical URL (e.g. `https://yourdomain.com`) for SEO once a custom domain is live. Defaults to the Vercel production domain. |
