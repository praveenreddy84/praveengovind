"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Pause, Play, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  CHALLENGES,
  DATABASE,
  LIMITS,
  SERVER,
  STARTER,
  diagnose,
  initialState,
  judge,
  step,
  type Challenge,
  type Config,
  type Pattern,
  type Size,
  type Tick,
} from "@/lib/simulator/engine"
import { Diagram } from "./diagram"
import { STATUS, formatCost, formatMs, formatPct, formatRps } from "./format"
import { Sparkline } from "./sparkline"

const HISTORY = 60 // seconds of history kept for the charts
const WINDOW = 30 // seconds a design must hold the goals

type Mode = "sandbox" | Challenge["id"]

export function Simulator() {
  const [mode, setMode] = useState<Mode>(CHALLENGES[0].id)
  const challenge = CHALLENGES.find((c) => c.id === mode)
  const [config, setConfig] = useState<Config>({ ...STARTER, ...CHALLENGES[0].traffic })
  const [running, setRunning] = useState(true)
  const [speed, setSpeed] = useState<1 | 4>(1)
  const [ticks, setTicks] = useState<Tick[]>([])
  const [sinceChange, setSinceChange] = useState(0)
  const [solved, setSolved] = useState<Record<string, boolean>>({})

  const sim = useRef(initialState(config))
  const configRef = useRef(config)
  configRef.current = config

  // Remember solved challenges per visitor (a convenience; the page works without it).
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sds-solved")
      if (saved) setSolved(JSON.parse(saved))
    } catch {}
  }, [])

  const restart = useCallback((next: Config) => {
    sim.current = initialState(next)
    setTicks([])
    setSinceChange(0)
  }, [])

  const selectMode = (next: Mode) => {
    setMode(next)
    const ch = CHALLENGES.find((c) => c.id === next)
    const nextConfig = ch ? { ...STARTER, ...ch.traffic } : { ...STARTER, rps: 1000 }
    setConfig(nextConfig)
    restart(nextConfig)
    setRunning(true)
  }

  const update = (patch: Partial<Config>) => {
    setConfig((c) => {
      const next = { ...c, ...patch }
      if (patch.servers !== undefined || patch.autoscale !== undefined || patch.loadBalancer !== undefined) {
        sim.current = { ...sim.current, servers: next.servers }
      }
      return next
    })
    setSinceChange(0)
  }

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const { state, tick } = step(configRef.current, sim.current)
      sim.current = state
      setTicks((prev) => [...prev.slice(-(HISTORY - 1)), tick])
      setSinceChange((n) => n + 1)
    }, 1000 / speed)
    return () => clearInterval(id)
  }, [running, speed])

  const tick = ticks[ticks.length - 1]
  const judged = useMemo(() => {
    if (!challenge) return null
    return judge(challenge, ticks.slice(-Math.min(sinceChange, ticks.length)), WINDOW)
  }, [challenge, ticks, sinceChange])

  useEffect(() => {
    if (challenge && judged?.passed && !solved[challenge.id]) {
      const next = { ...solved, [challenge.id]: true }
      setSolved(next)
      try {
        localStorage.setItem("sds-solved", JSON.stringify(next))
      } catch {}
    }
  }, [challenge, judged, solved])

  const diagnosis = tick ? diagnose(config, tick) : null
  const series = (key: "incoming" | "p95" | "errorRate" | "cost") => ticks.map((k) => k[key])

  return (
    <div className="space-y-6">
      {/* Mode picker */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Challenges">
        {[...CHALLENGES.map((c) => ({ id: c.id, label: c.title })), { id: "sandbox", label: "Sandbox" }].map((m, i) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => selectMode(m.id)}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm transition-colors",
              mode === m.id
                ? "border-site-fg bg-site-fg text-site-bg"
                : "border-site-line text-site-muted hover:border-site-fg/40 hover:text-site-fg",
            )}
          >
            {m.id !== "sandbox" && <span className="mr-2 font-mono text-xs opacity-60">0{i + 1}</span>}
            {m.label}
            {solved[m.id] && <span className="ml-2" aria-label="solved">✓</span>}
          </button>
        ))}
      </div>

      {/* Brief + goals */}
      <div className="grid gap-4 rounded-2xl border border-site-line bg-site-panel/60 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6">
        <div>
          <p className="text-lg font-medium">
            {challenge ? challenge.brief : "Free play: set any traffic and design whatever you like."}
          </p>
          <p className="mt-1 text-sm text-site-muted">
            {challenge
              ? `Hold every goal for ${WINDOW} seconds straight. Changing the design restarts the clock.`
              : "Tip: watch which tier turns red first, then fix that one."}
          </p>
        </div>
        {challenge && (
          <ul className="flex flex-wrap gap-2 md:justify-end">
            <Goal label={`p95 ≤ ${challenge.goals.maxP95} ms`} ok={judged?.p95} />
            <Goal label={`errors ≤ ${formatPct(challenge.goals.maxErrorRate)}`} ok={judged?.errors} />
            <Goal label={`cost ≤ ${formatCost(challenge.goals.maxCost)}`} ok={judged?.cost} />
          </ul>
        )}
        {challenge && (
          <div className="md:col-span-2">
            {judged?.passed ? (
              <p className="rounded-lg border border-site-accent/40 bg-site-accent/10 px-4 py-2 text-sm">
                <span className="font-semibold">Challenge complete.</span> Your design held every goal for {WINDOW}{" "}
                seconds.{" "}
                {CHALLENGES.findIndex((c) => c.id === challenge.id) < CHALLENGES.length - 1
                  ? "Ready for the next one?"
                  : "That's all of them. Try the sandbox."}
              </p>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-site-line">
                  <div
                    className="h-full rounded-full bg-site-accent transition-[width] duration-500"
                    style={{ width: `${Math.min(100, (Math.min(sinceChange, ticks.length) / WINDOW) * 100)}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] text-site-muted">
                  {Math.min(sinceChange, ticks.length) < WINDOW
                    ? `measuring ${Math.min(sinceChange, ticks.length)}/${WINDOW}s`
                    : "goals not met: keep tuning"}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          {/* Diagram */}
          <div className="rounded-2xl border border-site-line bg-site-bg">
            <div className="flex items-center justify-between gap-3 border-b border-site-line px-4 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-site-muted">
                Live · t = {tick?.t ?? 0}s
              </p>
              <div className="flex items-center gap-2">
                <IconButton label={running ? "Pause" : "Play"} onClick={() => setRunning((r) => !r)}>
                  {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </IconButton>
                <button
                  onClick={() => setSpeed((s) => (s === 1 ? 4 : 1))}
                  className="h-8 rounded-md border border-site-line px-2 font-mono text-xs text-site-muted hover:text-site-fg"
                  aria-label="Toggle simulation speed"
                >
                  {speed}×
                </button>
                <IconButton label="Restart traffic" onClick={() => restart(config)}>
                  <RotateCcw className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
            <p className="px-4 pt-3 font-mono text-[11px] text-site-muted md:hidden">Scroll sideways to see the whole system →</p>
            <div className="overflow-x-auto p-2">
              <Diagram
                config={config}
                tick={tick}
                onToggle={(id) =>
                  update(
                    id === "lb"
                      ? { loadBalancer: true }
                      : id === "cdn"
                        ? { cdn: true }
                        : id === "cache"
                          ? { cache: true }
                          : { queue: true },
                  )
                }
              />
            </div>
            {diagnosis && (
              <div className="flex items-start gap-3 border-t border-site-line px-4 py-3 text-sm" aria-live="polite">
                <span
                  className="mt-0.5 inline-flex h-5 shrink-0 items-center rounded px-1.5 font-mono text-[11px] font-semibold text-black"
                  style={{ background: STATUS[diagnosis.severity === "ok" ? "good" : diagnosis.severity] }}
                >
                  {diagnosis.severity === "ok" ? "✓ OK" : diagnosis.severity === "warning" ? "▲ Busy" : "✕ Overloaded"}
                </span>
                <p className="text-site-fg/90">{diagnosis.message}</p>
              </div>
            )}
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-site-line bg-site-line xl:grid-cols-4">
            <Stat label="Traffic in" value={tick ? formatRps(tick.incoming) : "–"}>
              <Sparkline values={series("incoming")} format={(v) => formatRps(v)} label="Traffic in" />
            </Stat>
            <Stat label="p95 latency" value={tick ? formatMs(tick.p95) : "–"}>
              <Sparkline values={series("p95")} goal={challenge?.goals.maxP95} format={formatMs} label="p95 latency" />
            </Stat>
            <Stat label="Error rate" value={tick ? formatPct(tick.errorRate) : "–"}>
              <Sparkline
                values={series("errorRate")}
                goal={challenge?.goals.maxErrorRate}
                format={formatPct}
                label="Error rate"
              />
            </Stat>
            <Stat label="Monthly cost" value={tick ? formatCost(tick.cost) : "–"}>
              <Sparkline values={series("cost")} goal={challenge?.goals.maxCost} format={formatCost} label="Monthly cost" />
            </Stat>
          </div>
          <p className="-mt-3 font-mono text-[11px] text-site-muted">
            Last {HISTORY}s. Dashed line = challenge goal. Hover a chart for exact values.
          </p>
        </div>

        {/* Controls */}
        <aside className="space-y-5 rounded-2xl border border-site-line bg-site-panel/60 p-5" aria-label="Design controls">
          {!challenge && (
            <Section title="Traffic">
              <Slider
                label="Requests / second"
                value={Math.round(Math.log10(config.rps) * 100)}
                min={100}
                max={Math.round(Math.log10(LIMITS.maxRps) * 100)}
                display={formatRps(config.rps)}
                onChange={(v) => update({ rps: Math.round(10 ** (v / 100) / 10) * 10 })}
              />
              <Slider
                label="Reads vs writes"
                value={Math.round(config.readRatio * 100)}
                min={10}
                max={95}
                display={`${Math.round(config.readRatio * 100)}% reads`}
                onChange={(v) => update({ readRatio: v / 100 })}
              />
              <Segmented<Pattern>
                label="Pattern"
                value={config.pattern}
                options={[
                  ["steady", "Steady"],
                  ["spiky", "Spiky"],
                  ["ramp", "Ramp"],
                ]}
                onChange={(pattern) => {
                  const next = { ...config, pattern }
                  setConfig(next)
                  restart(next)
                }}
              />
            </Section>
          )}

          <Section title="Edge">
            <Toggle
              label="CDN"
              hint="Serves static files (40% of requests) near users"
              checked={config.cdn}
              onChange={(cdn) => update({ cdn })}
            />
            <Toggle
              label="Load balancer"
              hint="Lets more than one server take traffic"
              checked={config.loadBalancer}
              onChange={(loadBalancer) => update({ loadBalancer })}
            />
          </Section>

          <Section title="Compute">
            <Stepper
              label="App servers"
              value={config.servers}
              min={1}
              max={LIMITS.maxServers}
              disabled={!config.loadBalancer}
              hint={config.loadBalancer ? undefined : "Needs a load balancer"}
              onChange={(servers) => update({ servers })}
            />
            <Segmented<Size>
              label="Server size"
              value={config.serverSize}
              options={(["s", "m", "l"] as const).map((s) => [s, `${SERVER[s].label} · ${SERVER[s].rps}`])}
              onChange={(serverSize) => update({ serverSize })}
            />
            <Toggle
              label="Autoscaling"
              hint="Adds a server every 3s when busy (up to 30)"
              checked={config.autoscale}
              disabled={!config.loadBalancer}
              onChange={(autoscale) => update({ autoscale })}
            />
          </Section>

          <Section title="Data">
            <Toggle
              label="Cache"
              hint="Answers repeat reads from memory"
              checked={config.cache}
              onChange={(cache) => update({ cache })}
            />
            {config.cache && (
              <Slider
                label="Cache hit rate"
                value={Math.round(config.cacheHitRate * 100)}
                min={50}
                max={95}
                display={`${Math.round(config.cacheHitRate * 100)}%`}
                onChange={(v) => update({ cacheHitRate: v / 100 })}
              />
            )}
            <Segmented<Size>
              label="Database size"
              value={config.dbSize}
              options={(["s", "m", "l"] as const).map((s) => [s, `${DATABASE[s].label} · ${DATABASE[s].qps}`])}
              onChange={(dbSize) => update({ dbSize })}
            />
            <Stepper
              label="Read replicas"
              value={config.replicas}
              min={0}
              max={LIMITS.maxReplicas}
              onChange={(replicas) => update({ replicas })}
            />
            <Toggle
              label="Write queue"
              hint="Buffers writes so bursts don't fail"
              checked={config.queue}
              onChange={(queue) => update({ queue })}
            />
          </Section>

          <button
            onClick={() => {
              const next = { ...STARTER, ...(challenge?.traffic ?? { rps: config.rps, readRatio: config.readRatio, pattern: config.pattern }) }
              setConfig(next)
              restart(next)
            }}
            className="w-full rounded-lg border border-site-line px-3 py-2 text-sm text-site-muted transition-colors hover:border-site-fg/40 hover:text-site-fg"
          >
            Reset design
          </button>
        </aside>
      </div>
    </div>
  )
}

function Goal({ label, ok }: { label: string; ok: boolean | undefined }) {
  const state = ok === undefined ? "pending" : ok ? "met" : "missed"
  return (
    <li
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs",
        state === "pending" && "border-site-line text-site-muted",
        state !== "pending" && "border-site-line text-site-fg",
      )}
    >
      <span
        aria-hidden
        className="inline-block h-2 w-2 rounded-full"
        style={{
          background: state === "met" ? STATUS.good : state === "missed" ? STATUS.critical : "rgb(var(--site-line))",
        }}
      />
      {label}
      <span className="text-site-muted">{state === "met" ? "✓ met" : state === "missed" ? "✕ missed" : "…"}</span>
    </li>
  )
}

function Stat({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="bg-site-bg p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-site-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-site-accent">{title}</legend>
      {children}
    </fieldset>
  )
}

function Toggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  disabled?: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className={cn("flex items-start justify-between gap-3", disabled && "opacity-50")}>
      <span>
        <span className="block text-sm">{label}</span>
        {hint && <span className="block text-xs text-site-muted">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors",
          checked ? "border-site-accent bg-site-accent" : "border-site-line bg-site-bg",
        )}
      >
        <span
          className={cn(
            "inline-block h-3.5 w-3.5 rounded-full transition-transform",
            checked ? "translate-x-[18px] bg-black" : "translate-x-[2px] bg-site-muted",
          )}
        />
      </button>
    </label>
  )
}

function Stepper({
  label,
  value,
  min,
  max,
  disabled,
  hint,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  disabled?: boolean
  hint?: string
  onChange: (v: number) => void
}) {
  const btn =
    "h-7 w-7 rounded-md border border-site-line text-sm transition-colors hover:border-site-fg/40 disabled:opacity-40"
  return (
    <div className={cn("flex items-center justify-between gap-3", disabled && "opacity-50")}>
      <span>
        <span className="block text-sm">{label}</span>
        {hint && <span className="block text-xs text-site-muted">{hint}</span>}
      </span>
      <span className="flex items-center gap-2">
        <button className={btn} disabled={disabled || value <= min} onClick={() => onChange(value - 1)} aria-label={`Fewer ${label.toLowerCase()}`}>
          −
        </button>
        <span className="w-6 text-center font-mono text-sm tabular-nums">{value}</span>
        <button className={btn} disabled={disabled || value >= max} onClick={() => onChange(value + 1)} aria-label={`More ${label.toLowerCase()}`}>
          +
        </button>
      </span>
    </div>
  )
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: [T, string][]
  onChange: (v: T) => void
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm">{label}</span>
      <div className="grid grid-flow-col gap-1 rounded-lg border border-site-line p-1" role="radiogroup" aria-label={label}>
        {options.map(([v, text]) => (
          <button
            key={v}
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] transition-colors",
              value === v ? "bg-site-fg text-site-bg" : "text-site-muted hover:text-site-fg",
            )}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  display,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  display: string
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 flex justify-between text-sm">
        {label}
        <span className="font-mono text-xs text-site-muted">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[rgb(var(--site-accent))]"
      />
    </label>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-site-line text-site-muted transition-colors hover:text-site-fg"
    >
      {children}
    </button>
  )
}
