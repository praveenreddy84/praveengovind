// Status colors are reserved for state and always paired with a symbol + label.
export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  critical: "#d03b3b",
} as const

export type StatusKey = keyof typeof STATUS

export function statusOf(util: number): { key: StatusKey; color: string; label: string; symbol: string } {
  if (util > 1) return { key: "critical", color: STATUS.critical, label: "Overloaded", symbol: "✕" }
  if (util > 0.8) return { key: "warning", color: STATUS.warning, label: "Busy", symbol: "▲" }
  return { key: "good", color: STATUS.good, label: "OK", symbol: "✓" }
}

export const formatRps = (v: number, short = false) =>
  `${v >= 10_000 ? `${(v / 1000).toFixed(0)}k` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v)} ${short ? "rps" : "req/s"}`

export const formatMs = (v: number) => `${Math.round(v)} ms`

export const formatPct = (v: number) => (v === 0 ? "0%" : v < 0.001 ? "<0.1%" : `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`)

export const formatCost = (v: number) => `$${Math.round(v).toLocaleString("en-US")}/mo`
