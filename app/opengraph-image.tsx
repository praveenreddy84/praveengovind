import { readFile } from "node:fs/promises"
import path from "node:path"
import { ImageResponse } from "next/og"
import { OG_SIZE, OgCard } from "@/components/og/card"
import { site } from "@/lib/site"

export const alt = `${site.name} — ${site.role}`
export const size = OG_SIZE
export const contentType = "image/png"

export default async function Image() {
  const photo = await readFile(path.join(process.cwd(), "public", site.photo))
  return new ImageResponse(
    (
      <OgCard
        eyebrow={site.role}
        title={site.name}
        subtitle={site.tagline}
        photo={`data:image/jpeg;base64,${photo.toString("base64")}`}
      />
    ),
    size,
  )
}
