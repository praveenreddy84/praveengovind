import { strict as assert } from "node:assert"
import { describe, it } from "node:test"
import { CHALLENGES, STARTER, diagnose, judge, run, type Config } from "../lib/simulator/engine.ts"

const last = <T,>(xs: T[]) => xs[xs.length - 1]
const withTraffic = (id: string, patch: Partial<Config> = {}): Config => {
  const ch = CHALLENGES.find((c) => c.id === id)!
  return { ...STARTER, ...ch.traffic, ...patch }
}

// A known-good design for each challenge (found by searching the design space).
const SOLUTIONS: Record<string, Partial<Config>> = {
  viral: { loadBalancer: true, servers: 8, serverSize: "s", cache: true, cacheHitRate: 0.9, cdn: true },
  "flash-sale": { loadBalancer: true, servers: 5, serverSize: "l", cache: true, cacheHitRate: 0.9, cdn: true, queue: true },
  launch: { loadBalancer: true, servers: 12, serverSize: "l", cache: true, cacheHitRate: 0.95, cdn: true, queue: true },
}

describe("challenges", () => {
  for (const ch of CHALLENGES) {
    it(`${ch.title}: the starter setup fails`, () => {
      assert.equal(judge(ch, run(withTraffic(ch.id), 120))?.passed, false)
    })

    it(`${ch.title}: a sensible design passes`, () => {
      const result = judge(ch, run(withTraffic(ch.id, SOLUTIONS[ch.id]), 120))
      assert.deepEqual(result, { p95: true, errors: true, cost: true, passed: true })
    })

    it(`${ch.title}: maxing everything out busts the budget`, () => {
      const maxed = withTraffic(ch.id, {
        cdn: true, loadBalancer: true, servers: 30, serverSize: "l", cache: true, cacheHitRate: 0.95,
        dbSize: "l", replicas: 5, queue: true,
      })
      const result = judge(ch, run(maxed, 120))!
      assert.equal(result.cost, false)
      assert.equal(result.errors, true)
    })
  }

  it("needs a full window of data before judging", () => {
    assert.equal(judge(CHALLENGES[0], run(STARTER, 10)), null)
  })
})

describe("engine", () => {
  it("is deterministic", () => {
    assert.deepEqual(run(withTraffic("flash-sale"), 60), run(withTraffic("flash-sale"), 60))
  })

  it("uses only one server without a load balancer", () => {
    const tick = last(run({ ...STARTER, servers: 10, loadBalancer: false }, 5))
    assert.equal(tick.servers, 1)
  })

  it("rejects load beyond server capacity as errors", () => {
    const tick = last(run({ ...STARTER, rps: 1000 }, 5)) // 1 small server = 250 rps
    assert.ok(tick.errorRate > 0.7, `errorRate ${tick.errorRate}`)
    assert.ok(tick.nodes.app.util > 3)
  })

  it("a cache takes read load off the database", () => {
    const base: Config = { ...STARTER, rps: 1500, loadBalancer: true, servers: 5, serverSize: "m" }
    const without = last(run(base, 5))
    const withCache = last(run({ ...base, cache: true, cacheHitRate: 0.9 }, 5))
    assert.ok(without.nodes.db.util > 1)
    assert.ok(withCache.nodes.db.util < without.nodes.db.util / 2)
    assert.ok(withCache.errorRate < without.errorRate)
  })

  it("a queue turns write overload into backlog instead of errors", () => {
    const base: Config = { ...STARTER, rps: 3000, readRatio: 0.2, loadBalancer: true, servers: 10, serverSize: "m", cache: true }
    const direct = last(run(base, 30))
    const queued = last(run({ ...base, queue: true }, 30))
    assert.ok(direct.errorRate > 0.3)
    assert.ok(queued.errorRate < 0.01)
    assert.ok(queued.backlog > 0)
  })

  it("autoscaling adds servers gradually, never above the limit", () => {
    const ticks = run({ ...STARTER, rps: 50_000, loadBalancer: true, autoscale: true, serverSize: "l" }, 200)
    for (let i = 1; i < ticks.length; i++) assert.ok(ticks[i].servers - ticks[i - 1].servers <= 1)
    assert.equal(last(ticks).servers, 30)
    assert.equal(ticks[5].servers < 5, true)
  })

  it("a CDN offloads static requests from the servers", () => {
    const base: Config = { ...STARTER, rps: 200 }
    assert.ok(last(run({ ...base, cdn: true }, 5)).nodes.app.load < last(run(base, 5)).nodes.app.load * 0.7)
  })
})

describe("diagnose", () => {
  it("points at the missing load balancer first", () => {
    const cfg = { ...STARTER, rps: 1000, servers: 4 }
    const d = diagnose(cfg, last(run(cfg, 5)))
    assert.equal(d.node, "app")
    assert.equal(d.severity, "critical")
    assert.match(d.message, /load balancer/)
  })

  it("suggests a cache or replicas for a read-heavy database bottleneck", () => {
    const cfg: Config = { ...STARTER, rps: 1500, loadBalancer: true, servers: 5, serverSize: "m" }
    const d = diagnose(cfg, last(run(cfg, 5)))
    assert.equal(d.node, "db")
    assert.match(d.message, /cache|replicas/)
  })

  it("reports healthy when every tier has headroom", () => {
    const d = diagnose(STARTER, last(run({ ...STARTER, rps: 50 }, 5)))
    assert.equal(d.severity, "ok")
  })
})
