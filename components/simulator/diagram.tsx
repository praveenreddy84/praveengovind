"use client"

import { useReducedMotion } from "framer-motion"
import { DATABASE, SERVER, type Config, type NodeId, type Tick } from "@/lib/simulator/engine"
import { STATUS, formatRps, statusOf } from "./format"

type Toggleable = "cdn" | "lb" | "cache" | "queue"

const W = 164
const H = 84
const POS = {
  users: { x: 70, y: 165 },
  cdn: { x: 235, y: 55 },
  lb: { x: 235, y: 165 },
  app: { x: 430, y: 165 },
  cache: { x: 630, y: 60 },
  queue: { x: 630, y: 270 },
  db: { x: 830, y: 165 },
} as const
type Pos = keyof typeof POS

const APP_H = 136
const DB_H = 116
const heightOf = (id: Pos) => (id === "app" ? APP_H : id === "db" ? DB_H : id === "users" ? 56 : H)
const widthOf = (id: Pos) => (id === "users" ? 92 : W)

function edgePath(from: Pos, to: Pos) {
  const a = POS[from]
  const b = POS[to]
  const x1 = a.x + widthOf(from) / 2
  const x2 = b.x - widthOf(to) / 2
  const mx = (x1 + x2) / 2
  return `M${x1},${a.y} C${mx},${a.y} ${mx},${b.y} ${x2},${b.y}`
}

function Flow({
  from,
  to,
  load,
  overload,
  animate,
}: {
  from: Pos
  to: Pos
  load: number
  overload: number // target utilization; >1 means some requests fail
  animate: boolean
}) {
  const d = edgePath(from, to)
  const dots = load <= 0.5 ? 0 : Math.min(7, Math.max(1, Math.ceil(Math.log10(load + 1) * 1.6)))
  const failing = overload > 1 ? Math.round(dots * (1 - 1 / overload)) : 0
  return (
    <g>
      <path d={d} fill="none" stroke="rgb(var(--site-line))" strokeWidth={2} />
      {animate &&
        Array.from({ length: dots }, (_, i) => (
          <circle key={`${dots}-${i}`} r={3.5} fill={i < failing ? STATUS.critical : "rgb(var(--site-accent))"}>
            <animateMotion dur="1.6s" repeatCount="indefinite" begin={`${(-i * 1.6) / dots}s`} path={d} />
          </circle>
        ))}
    </g>
  )
}

function Box({
  id,
  title,
  lines,
  util,
  enabled = true,
  onAdd,
  children,
}: {
  id: Pos
  title: string
  lines: string[]
  util?: number
  enabled?: boolean
  onAdd?: () => void
  children?: React.ReactNode
}) {
  const { x, y } = POS[id]
  const w = widthOf(id)
  const h = heightOf(id)
  const status = util === undefined ? null : statusOf(util)
  const top = y - h / 2

  if (!enabled) {
    return (
      <g
        role="button"
        tabIndex={0}
        aria-label={`Add ${title}`}
        className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-[rgb(var(--site-accent))] [&:hover>rect]:stroke-[rgb(var(--site-accent))]"
        onClick={onAdd}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onAdd?.())}
      >
        <rect
          x={x - w / 2}
          y={top}
          width={w}
          height={h}
          rx={12}
          fill="rgb(var(--site-bg))"
          stroke="rgb(var(--site-muted))"
          strokeOpacity={0.6}
          strokeDasharray="5 4"
          strokeWidth={1.5}
        />
        <text x={x} y={y - 4} textAnchor="middle" className="fill-[rgb(var(--site-muted))] text-[15px] font-medium">
          + {title}
        </text>
        <text x={x} y={y + 16} textAnchor="middle" className="fill-[rgb(var(--site-muted))] font-mono text-[12px]">
          click to add
        </text>
      </g>
    )
  }

  return (
    <g>
      <rect
        x={x - w / 2}
        y={top}
        width={w}
        height={h}
        rx={12}
        fill="rgb(var(--site-panel))"
        stroke={status && status.key !== "good" ? status.color : "rgb(var(--site-line))"}
        strokeWidth={status && status.key === "critical" ? 2 : 1.5}
      />
      <text x={x} y={top + 22} textAnchor="middle" className="fill-[rgb(var(--site-fg))] text-[15px] font-semibold">
        {title}
      </text>
      {lines.map((line, i) => (
        <text
          key={i}
          x={x}
          y={top + 40 + i * 16}
          textAnchor="middle"
          className="fill-[rgb(var(--site-muted))] font-mono text-[12px]"
        >
          {line}
        </text>
      ))}
      {children}
      {status && (
        <g>
          <rect x={x - 56} y={top + h - 14} width={112} height={4} rx={2} fill="rgb(var(--site-line))" />
          <rect
            x={x - 56}
            y={top + h - 14}
            width={112 * Math.min(1, util!)}
            height={4}
            rx={2}
            fill={status.color}
          />
        </g>
      )}
    </g>
  )
}

export function Diagram({
  config,
  tick,
  onToggle,
}: {
  config: Config
  tick: Tick | undefined
  onToggle: (id: Toggleable) => void
}) {
  const reduce = useReducedMotion()
  const animate = !reduce && !!tick
  const n = tick?.nodes
  const util = (id: NodeId) => n?.[id].util ?? 0
  const load = (id: NodeId) => n?.[id].load ?? 0

  // Split app traffic into reads and writes to draw the data-tier flows.
  const appServed = load("app") / Math.max(1, util("app"))
  const reads = appServed * config.readRatio
  const writes = appServed - reads
  const misses = config.cache ? reads * (1 - config.cacheHitRate) : reads
  const directToDb = misses + (config.queue ? 0 : writes)
  const dbUtil = Math.max(util("db"), util("replicas"))
  const servers = tick?.servers ?? (config.loadBalancer ? config.servers : 1)

  const serverSquares = Array.from({ length: 30 }, (_, i) => i)
  const appStatus = statusOf(util("app"))

  const statusLine = (u: number) => {
    const s = statusOf(u)
    return `${s.symbol} ${s.label} · ${Math.round(u * 100)}%`
  }

  return (
    <svg
      viewBox="0 0 920 335"
      className="h-auto w-full min-w-[720px]"
      role="img"
      aria-label="Live architecture diagram showing traffic flowing from users through each tier"
    >
      {/* Flows */}
      {config.cdn && <Flow from="users" to="cdn" load={load("cdn")} overload={0} animate={animate} />}
      {config.loadBalancer ? (
        <>
          <Flow from="users" to="lb" load={load("lb")} overload={0} animate={animate} />
          <Flow from="lb" to="app" load={load("app")} overload={util("app")} animate={animate} />
        </>
      ) : (
        <Flow from="users" to="app" load={load("app")} overload={util("app")} animate={animate} />
      )}
      {config.cache && <Flow from="app" to="cache" load={reads} overload={0} animate={animate} />}
      {config.cache && <Flow from="cache" to="db" load={misses} overload={dbUtil} animate={animate} />}
      {directToDb > 0 && (!config.cache || !config.queue) && (
        <Flow from="app" to="db" load={config.cache ? writes : directToDb} overload={dbUtil} animate={animate} />
      )}
      {config.queue && (
        <>
          <Flow from="app" to="queue" load={writes} overload={0} animate={animate} />
          <Flow from="queue" to="db" load={Math.min(writes, load("db"))} overload={dbUtil} animate={animate} />
        </>
      )}

      {/* Nodes */}
      <Box id="users" title="Users" lines={[formatRps(tick?.incoming ?? config.rps, true)]} />
      <Box
        id="cdn"
        title="CDN"
        enabled={config.cdn}
        onAdd={() => onToggle("cdn")}
        lines={["static files", formatRps(load("cdn"), true)]}
      />
      <Box
        id="lb"
        title="Load balancer"
        enabled={config.loadBalancer}
        onAdd={() => onToggle("lb")}
        lines={[`spreads across ${servers}`, formatRps(load("lb"), true)]}
      />
      <Box
        id="app"
        title={`App servers × ${servers}`}
        lines={[`${SERVER[config.serverSize].label} · ${formatRps(load("app"), true)}`, statusLine(util("app"))]}
        util={util("app")}
      >
        {serverSquares.map((i) => {
          const col = i % 10
          const row = Math.floor(i / 10)
          const on = i < servers
          return (
            <rect
              key={i}
              x={POS.app.x - 54 + col * 11}
              y={POS.app.y + 6 + row * 11}
              width={8}
              height={8}
              rx={1.5}
              fill={on ? appStatus.color : "transparent"}
              stroke={on ? "none" : "rgb(var(--site-line))"}
              strokeWidth={1}
            />
          )
        })}
      </Box>
      <Box
        id="cache"
        title="Cache"
        enabled={config.cache}
        onAdd={() => onToggle("cache")}
        lines={[`${Math.round(config.cacheHitRate * 100)}% hit rate`, `${formatRps(reads * config.cacheHitRate, true)} served`]}
      />
      <Box
        id="queue"
        title="Queue"
        enabled={config.queue}
        onAdd={() => onToggle("queue")}
        lines={[
          `${formatRps(writes, true)} writes`,
          `backlog ${Math.round(tick?.backlog ?? 0).toLocaleString()}`,
        ]}
      />
      <Box
        id="db"
        title="Database"
        util={dbUtil}
        lines={[
          `${DATABASE[config.dbSize].label} · ${formatRps(load("db") + load("replicas"), true)}`,
          statusLine(dbUtil),
          config.replicas ? `+ ${config.replicas} read replica${config.replicas > 1 ? "s" : ""}` : "primary only",
        ]}
      />
    </svg>
  )
}
