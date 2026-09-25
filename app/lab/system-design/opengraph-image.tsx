import { ImageResponse } from "next/og"
import { OG_SIZE, OgCard } from "@/components/og/card"
import { site } from "@/lib/site"

export const alt = "System Design Simulator"
export const size = OG_SIZE
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        eyebrow={`Interactive lab · ${site.name}`}
        title="System Design Simulator"
        subtitle="Build an architecture, send it traffic, and watch where it breaks. Then fix it within budget."
      />
    ),
    size,
  )
}
