// System design simulator: a deliberately simple, deterministic model of a web stack.
// Each tier has a capacity (requests/second). Latency grows with utilization like a
// single-server queue (base / (1 - ρ)), and load beyond capacity is rejected as errors.
// Prices are illustrative on-demand list prices, rounded, per month.

export type Size = "s" | "m" | "l"
export type Pattern = "steady" | "spiky" | "ramp"

export interface Config {
  rps: number // baseline incoming requests per second
  readRatio: number // share of dynamic requests that are reads (0..1)
  pattern: Pattern
  cdn: boolean
  loadBalancer: boolean
  servers: number
  serverSize: Size
  autoscale: boolean
  cache: boolean
  cacheHitRate: number // 0..1
  dbSize: Size
  replicas: number
  queue: boolean
}

export const SERVER = {
  s: { label: "Small", rps: 250, cost: 30 },
  m: { label: "Medium", rps: 600, cost: 70 },
  l: { label: "Large", rps: 1500, cost: 150 },
} as const

export const DATABASE = {
  s: { label: "Small", qps: 800, cost: 60 },
  m: { label: "Medium", qps: 2500, cost: 200 },
  l: { label: "Large", qps: 8000, cost: 700 },
} as const

export const LIMITS = { maxServers: 30, maxReplicas: 5, maxRps: 50_000, maxBacklog: 2_000_000 }

const STATIC_SHARE = 0.4 // share of requests that are static assets a CDN can serve
const SECONDS_PER_MONTH = 2_592_000
const PRICE = {
  loadBalancer: 25,
  cache: 50,
  cdnPerMillion: 0.02,
  queuePerMillion: 0.05, // batched sends
}
const BASE_MS = { edge: 15, lb: 1, app: 20, cache: 1, dbRead: 6, dbWrite: 10, enqueue: 3 }
const TAIL = 1.8 // p95 ≈ 1.8 × mean service time for a lightly loaded tier
const AUTOSCALE = { targetUtil: 0.6, upEvery: 3, downEvery: 10 }

export type NodeId = "cdn" | "lb" | "app" | "cache" | "db" | "replicas" | "queue"

export interface NodeState {
  enabled: boolean
  util: number // 0..∞ (>1 = overloaded)
  load: number // requests/second arriving at this tier
}

export interface Tick {
  t: number
  incoming: number
  served: number
  errorRate: number // 0..1
  p95: number // ms, successful requests only
  cost: number // $/month at the current footprint
  servers: number // servers currently running (autoscaling may change it)
  backlog: number // queued writes waiting for the database
  nodes: Record<NodeId, NodeState>
}

export interface SimState {
  t: number
  servers: number
  backlog: number
  lastScale: number
}

export function initialState(config: Config): SimState {
  return { t: 0, servers: config.servers, backlog: 0, lastScale: 0 }
}

/** Traffic multiplier at second `t` for a pattern. Deterministic so runs are reproducible. */
export function trafficFactor(pattern: Pattern, t: number): number {
  const wobble = 1 + 0.04 * Math.sin(t * 1.7) + 0.03 * Math.sin(t * 0.61)
  switch (pattern) {
    case "steady":
      return wobble
    case "spiky":
      // 6-second bursts at 3× every 20 seconds
      return (t % 20 < 6 ? 3 : 1) * wobble
    case "ramp":
      // launch day: climbs from 10% to 100% over 60 s, then holds
      return (0.1 + 0.9 * Math.min(1, t / 60)) * wobble
  }
}

const queueLatency = (base: number, util: number) => base / (1 - Math.min(util, 0.95))

/** Advance the simulation by one second. */
export function step(config: Config, state: SimState): { state: SimState; tick: Tick } {
  const t = state.t
  const incoming = config.rps * trafficFactor(config.pattern, t)

  // Edge: a CDN absorbs static assets.
  const edgeServed = config.cdn ? incoming * STATIC_SHARE : 0
  const dynamic = incoming - edgeServed

  // Compute: without a load balancer only one server can receive traffic.
  const canScale = config.loadBalancer && config.autoscale
  let servers = config.loadBalancer ? state.servers : 1
  const serverCap = SERVER[config.serverSize].rps
  let lastScale = state.lastScale
  if (canScale) {
    const desired = Math.min(
      LIMITS.maxServers,
      Math.max(config.servers, Math.ceil(dynamic / (serverCap * AUTOSCALE.targetUtil))),
    )
    // New servers take a few seconds to boot; scale-in is slower still.
    if (desired > servers && t - lastScale >= AUTOSCALE.upEvery) {
      servers += 1
      lastScale = t
    } else if (desired < servers && t - lastScale >= AUTOSCALE.downEvery) {
      servers -= 1
      lastScale = t
    }
  } else {
    servers = config.loadBalancer ? config.servers : 1
  }

  const appCap = servers * serverCap
  const appUtil = dynamic / appCap
  const appServed = Math.min(dynamic, appCap)
  const appRejected = dynamic - appServed

  // Data: reads may hit the cache; misses and writes go to the database.
  const reads = appServed * config.readRatio
  const writes = appServed - reads
  const cacheHits = config.cache ? reads * config.cacheHitRate : 0
  const dbReads = reads - cacheHits

  const dbCap = DATABASE[config.dbSize].qps
  const readersCount = 1 + config.replicas
  const readsPerNode = dbReads / readersCount
  const replicaUtil = config.replicas > 0 ? readsPerNode / dbCap : 0

  // Writes go straight to the primary, or through a queue that drains into spare capacity.
  let backlog = state.backlog
  let writesToDb = writes
  let queueDropped = 0
  if (config.queue) {
    const spare = Math.max(0, dbCap * 0.9 - readsPerNode)
    const pending = backlog + writes
    writesToDb = Math.min(pending, spare)
    backlog = pending - writesToDb
    if (backlog > LIMITS.maxBacklog) {
      queueDropped = backlog - LIMITS.maxBacklog
      backlog = LIMITS.maxBacklog
    }
  }

  const primaryLoad = readsPerNode + writesToDb
  const primaryUtil = primaryLoad / dbCap
  // Overloaded database: the excess share of reads (and synchronous writes) fails.
  const dbOk = Math.min(1, 1 / Math.max(primaryUtil, replicaUtil, 1e-9))
  const readFail = dbReads * (1 - dbOk)
  const writeFail = config.queue ? queueDropped : writes * (1 - Math.min(1, 1 / Math.max(primaryUtil, 1e-9)))

  const failed = appRejected + readFail + writeFail
  const served = Math.max(0, incoming - failed)
  const errorRate = incoming > 0 ? failed / incoming : 0

  // Latency of each successful path, weighted by how much traffic takes it.
  const lb = config.loadBalancer ? BASE_MS.lb : 0
  const app = lb + queueLatency(BASE_MS.app, appUtil)
  const dbReadMs = queueLatency(BASE_MS.dbRead, Math.max(primaryUtil, replicaUtil))
  const paths: [number, number][] = [
    [edgeServed, BASE_MS.edge],
    [cacheHits, app + BASE_MS.cache],
    [dbReads - readFail, app + (config.cache ? BASE_MS.cache : 0) + dbReadMs],
    [
      writes - writeFail,
      app + (config.queue ? BASE_MS.enqueue : queueLatency(BASE_MS.dbWrite, primaryUtil)),
    ],
  ]
  const p95 = weightedPercentile(paths, 0.95) * TAIL

  const cost =
    servers * SERVER[config.serverSize].cost +
    (config.loadBalancer ? PRICE.loadBalancer : 0) +
    (config.cache ? PRICE.cache : 0) +
    readersCount * DATABASE[config.dbSize].cost +
    (config.cdn ? ((edgeServed * SECONDS_PER_MONTH) / 1e6) * PRICE.cdnPerMillion : 0) +
    (config.queue ? ((writes * SECONDS_PER_MONTH) / 1e6) * PRICE.queuePerMillion : 0)

  const tick: Tick = {
    t,
    incoming,
    served,
    errorRate,
    p95,
    cost,
    servers,
    backlog,
    nodes: {
      cdn: { enabled: config.cdn, util: 0, load: edgeServed },
      lb: { enabled: config.loadBalancer, util: 0, load: dynamic },
      app: { enabled: true, util: appUtil, load: dynamic },
      cache: { enabled: config.cache, util: 0, load: config.cache ? reads : 0 },
      db: { enabled: true, util: primaryUtil, load: primaryLoad },
      replicas: { enabled: config.replicas > 0, util: replicaUtil, load: readsPerNode * config.replicas },
      queue: { enabled: config.queue, util: 0, load: config.queue ? writes : 0 },
    },
  }

  return { state: { t: t + 1, servers: canScale ? servers : config.servers, backlog, lastScale }, tick }
}

function weightedPercentile(paths: [number, number][], p: number): number {
  const live = paths.filter(([w]) => w > 1e-9).sort((a, b) => a[1] - b[1])
  const total = live.reduce((s, [w]) => s + w, 0)
  if (total === 0) return 0
  let acc = 0
  for (const [w, ms] of live) {
    acc += w
    if (acc / total >= p) return ms
  }
  return live[live.length - 1][1]
}

/** Run `seconds` of simulation from a fresh state. */
export function run(config: Config, seconds: number): Tick[] {
  let state = initialState(config)
  const ticks: Tick[] = []
  for (let i = 0; i < seconds; i++) {
    const r = step(config, state)
    state = r.state
    ticks.push(r.tick)
  }
  return ticks
}

// --- Diagnosis -------------------------------------------------------------

export interface Diagnosis {
  node: NodeId | null
  severity: "ok" | "warning" | "critical"
  message: string
}

export function diagnose(config: Config, tick: Tick): Diagnosis {
  const { nodes } = tick
  if (nodes.app.util > 1) {
    return {
      node: "app",
      severity: "critical",
      message: !config.loadBalancer
        ? `One server is taking ${pct(nodes.app.util)} of what it can handle. Add a load balancer so more servers can share the traffic.`
        : `App servers are at ${pct(nodes.app.util)} of capacity. Add servers, pick a bigger size, turn on autoscaling, or put a CDN in front for static files.`,
    }
  }
  if (nodes.db.util > 1 || nodes.replicas.util > 1) {
    const readHeavy = config.readRatio >= 0.6
    return {
      node: "db",
      severity: "critical",
      message: readHeavy
        ? `The database is at ${pct(Math.max(nodes.db.util, nodes.replicas.util))}. Reads dominate: add a cache${config.cache ? " with a higher hit rate" : ""} or read replicas.`
        : `The database is at ${pct(nodes.db.util)}. Writes dominate: a bigger database helps, and a queue can absorb bursts.`,
    }
  }
  if (config.queue && tick.backlog > 1000) {
    return {
      node: "queue",
      severity: "warning",
      message: `${Math.round(tick.backlog).toLocaleString()} writes are waiting in the queue. Nothing is lost yet, but the database can't keep up; give it more headroom.`,
    }
  }
  const busiest = (["app", "db", "replicas"] as const).reduce((a, b) => (nodes[a].util >= nodes[b].util ? a : b))
  if (nodes[busiest].util > 0.8) {
    return {
      node: busiest,
      severity: "warning",
      message: `${busiest === "app" ? "App servers are" : "The database is"} running hot at ${pct(nodes[busiest].util)}; latency climbs steeply above 80%.`,
    }
  }
  return { node: null, severity: "ok", message: "Healthy: every tier has headroom." }
}

const pct = (u: number) => `${Math.round(u * 100)}%`

// --- Challenges --------------------------------------------------------------

export interface Challenge {
  id: string
  title: string
  brief: string
  traffic: Pick<Config, "rps" | "readRatio" | "pattern">
  goals: { maxP95: number; maxErrorRate: number; maxCost: number }
}

export const CHALLENGES: Challenge[] = [
  {
    id: "viral",
    title: "Going viral",
    brief: "A post took off. Keep up with 2,000 requests/second on a startup budget.",
    traffic: { rps: 2000, readRatio: 0.8, pattern: "steady" },
    goals: { maxP95: 150, maxErrorRate: 0.01, maxCost: 500 },
  },
  {
    id: "flash-sale",
    title: "Flash sale",
    brief: "Traffic triples in sudden bursts, and a third of requests are orders (writes).",
    traffic: { rps: 3000, readRatio: 0.65, pattern: "spiky" },
    goals: { maxP95: 200, maxErrorRate: 0.01, maxCost: 1600 },
  },
  {
    id: "launch",
    title: "Launch day",
    brief: "Traffic climbs to 20,000 requests/second within a minute. Stay fast without overspending.",
    traffic: { rps: 20000, readRatio: 0.9, pattern: "ramp" },
    goals: { maxP95: 150, maxErrorRate: 0.005, maxCost: 3200 },
  },
]

export const STARTER: Config = {
  rps: 300,
  readRatio: 0.8,
  pattern: "steady",
  cdn: false,
  loadBalancer: false,
  servers: 1,
  serverSize: "s",
  autoscale: false,
  cache: false,
  cacheHitRate: 0.8,
  dbSize: "s",
  replicas: 0,
  queue: false,
}

export interface GoalResult {
  p95: boolean
  errors: boolean
  cost: boolean
  passed: boolean
}

/** Goals are judged on the worst values of a window of ticks (default: the last 30 s). */
export function judge(challenge: Challenge, ticks: Tick[], window = 30): GoalResult | null {
  if (ticks.length < window) return null
  const recent = ticks.slice(-window)
  const worstP95 = Math.max(...recent.map((k) => k.p95))
  const worstErr = Math.max(...recent.map((k) => k.errorRate))
  const worstCost = Math.max(...recent.map((k) => k.cost))
  const p95 = worstP95 <= challenge.goals.maxP95
  const errors = worstErr <= challenge.goals.maxErrorRate
  const cost = worstCost <= challenge.goals.maxCost
  return { p95, errors, cost, passed: p95 && errors && cost }
}
