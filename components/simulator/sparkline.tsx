"use client"

import { useId, useState } from "react"

/**
 * Single-series trend line with a hover crosshair. An optional dashed goal line
 * marks the challenge threshold on the same (single) axis.
 */
export function Sparkline({
  values,
  goal,
  format,
  label,
  height = 44,
}: {
  values: number[]
  goal?: number
  format: (v: number) => string
  label: string
  height?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const gradientId = useId()
  const width = 200
  const pad = 3

  const max = Math.max(...values, goal ?? 0, 1e-9) * 1.1
  const x = (i: number) => (values.length <= 1 ? width : (i / (values.length - 1)) * width)
  const y = (v: number) => height - pad - (Math.max(0, v) / max) * (height - pad * 2)
  const line = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("")
  const area = values.length ? `${line}L${width},${height}L0,${height}Z` : ""

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const i = Math.round(((e.clientX - rect.left) / rect.width) * (values.length - 1))
    setHover(Math.max(0, Math.min(values.length - 1, i)))
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block h-11 w-full touch-none overflow-visible"
        role="img"
        aria-label={`${label} over the last ${values.length} seconds`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--site-accent))" stopOpacity="0.22" />
            <stop offset="100%" stopColor="rgb(var(--site-accent))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {goal !== undefined && (
          <line
            x1={0}
            x2={width}
            y1={y(goal)}
            y2={y(goal)}
            stroke="rgb(var(--site-muted))"
            strokeWidth={1}
            strokeDasharray="4 3"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="rgb(var(--site-accent))"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {hover !== null && values[hover] !== undefined && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={0}
            y2={height}
            stroke="rgb(var(--site-fg))"
            strokeOpacity={0.35}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {hover !== null && values[hover] !== undefined && (
        <div
          className="pointer-events-none absolute -top-8 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-site-line bg-site-panel px-2 py-1 font-mono text-[11px] text-site-fg shadow-sm"
          style={{ left: `${Math.min(82, Math.max(18, (x(hover) / width) * 100))}%` }}
        >
          {format(values[hover])} · {values.length - 1 - hover}s ago
        </div>
      )}
    </div>
  )
}
