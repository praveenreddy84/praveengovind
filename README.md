# praveengovind

Personal website of Praveen Govind — Next.js 15, Tailwind CSS and Framer Motion.

## Editing content

All copy (intro, highlights, stats, selected work, experience, stack, contact links) lives in
[`lib/site.ts`](lib/site.ts). Update that file and the page picks it up; no component changes needed.

- Logo: the `PG` monogram (`Logo` in `components/primitives.tsx`) and favicon (`app/icon.svg`).
- Colors: the `--site-*` variables in `app/globals.css` (light and dark themes).

## Development

```bash
npm install --legacy-peer-deps
npm run dev     # http://localhost:3000
npm run build
```
