// Shared layout for generated social preview images (1200×630), rendered by next/og.

export const OG_SIZE = { width: 1200, height: 630 }

const COLORS = { bg: "#0a0a0b", panel: "#131315", fg: "#edece8", muted: "#96968f", line: "#28282b", accent: "#ff8a4c" }

export function OgCard({
  eyebrow,
  title,
  subtitle,
  photo,
}: {
  eyebrow: string
  title: string
  subtitle: string
  photo?: string
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: COLORS.bg,
        backgroundImage: `radial-gradient(circle at 90% 0%, rgba(255,138,76,0.22), transparent 45%)`,
        color: COLORS.fg,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 84,
            height: 84,
            borderRadius: 18,
            border: `3px solid ${COLORS.accent}`,
            background: COLORS.panel,
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: -2,
          }}
        >
          PG
        </div>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            width={150}
            height={150}
            style={{ borderRadius: 24, border: `2px solid ${COLORS.line}`, objectFit: "cover" }}
            alt=""
          />
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 26, color: COLORS.accent, letterSpacing: 4, textTransform: "uppercase" }}>
          {eyebrow}
        </div>
        <div style={{ marginTop: 18, fontSize: 84, fontWeight: 700, letterSpacing: -3, lineHeight: 1.02 }}>{title}</div>
        <div style={{ marginTop: 22, fontSize: 32, color: COLORS.muted, maxWidth: 980, lineHeight: 1.3 }}>
          {subtitle}
        </div>
      </div>
    </div>
  )
}
