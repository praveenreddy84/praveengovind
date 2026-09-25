import { site, stack } from "./site"

/**
 * Public URL of the site, used for canonical links, the sitemap and social cards.
 * Set NEXT_PUBLIC_SITE_URL once a custom domain is live; on Vercel it otherwise
 * falls back to the project's production domain.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  "http://localhost:3000"
).replace(/\/$/, "")

export const defaultTitle = `${site.name} — ${site.role}`

export const keywords = [
  site.name,
  "Applications Architect",
  "Software Architect",
  "Cloud Architect",
  "AWS",
  "Azure",
  "Serverless",
  "Microservices",
  "System Design",
]

/** schema.org Person, so search engines can connect the site to its owner. */
export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    jobTitle: site.role,
    description: site.tagline,
    url: siteUrl,
    image: `${siteUrl}${site.photo}`,
    worksFor: { "@type": "Organization", name: "Toyota Motors North America" },
    sameAs: site.socials.map((s) => s.href),
    knowsAbout: stack.flatMap((s) => s.items),
  }
}
