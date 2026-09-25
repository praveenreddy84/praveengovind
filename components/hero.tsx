"use client"

import Image from "next/image"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { highlights, site, stats } from "@/lib/site"
import { Container, Eyebrow } from "./primitives"

export function Hero() {
  const reduce = useReducedMotion()
  const fade = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
  })

  return (
    <section id="top" className="relative overflow-hidden pt-32 md:pt-40">
      {/* Grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgb(var(--site-line)/0.5)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--site-line)/0.5)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-0 h-[28rem] w-[28rem] rounded-full bg-site-accent/15 blur-3xl"
      />

      <Container className="relative">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_auto]">
          <div>
            <motion.div {...fade(0)} className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-site-accent opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-site-accent" />
              </span>
              <Eyebrow className="[&>span]:hidden">
                {site.name} · {site.role}
              </Eyebrow>
            </motion.div>

            <motion.h1
              {...fade(0.1)}
              className="mt-6 max-w-4xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
            >
              I architect systems that <span className="font-serif font-normal italic text-site-accent">scale</span>{" "}
              — and keep them <span className="font-serif font-normal italic">simple</span>.
            </motion.h1>

            <motion.p {...fade(0.2)} className="mt-8 max-w-2xl text-lg leading-relaxed text-site-muted">
              {site.intro}
            </motion.p>

            <motion.div {...fade(0.3)} className="mt-10 flex flex-wrap gap-3">
              <a
                href="#work"
                className="group inline-flex items-center gap-2 rounded-lg bg-site-fg px-5 py-3 text-sm font-medium text-site-bg transition-opacity hover:opacity-85"
              >
                See selected work
                <ArrowDownRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
              </a>
              <a
                href="#contact"
                className="group inline-flex items-center gap-2 rounded-lg border border-site-line px-5 py-3 text-sm font-medium transition-colors hover:border-site-fg/40"
              >
                Say hi 👋
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </motion.div>
          </div>

          <motion.div {...fade(0.25)}>
            <div className="relative h-44 w-40 overflow-hidden lg:h-64 lg:w-56 rounded-2xl border border-site-line bg-site-panel">
              <Image src={site.photo} alt={site.name} fill sizes="(min-width: 1024px) 224px, 160px" className="object-cover grayscale-[20%]" priority />
            </div>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-site-muted">
              <span className="text-site-accent">●</span> Currently @ Toyota NA
            </p>
          </motion.div>
        </div>

        {/* Highlights */}
        <motion.ul {...fade(0.4)} className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-site-line bg-site-line md:grid-cols-3">
          {highlights.map((h, i) => (
            <li key={h} className="bg-site-bg p-6">
              <span className="font-mono text-xs text-site-accent">0{i + 1}</span>
              <p className="mt-3 text-sm leading-relaxed text-site-fg/90">{h}</p>
            </li>
          ))}
        </motion.ul>

        {/* Stats */}
        <motion.dl {...fade(0.5)} className="mt-px grid grid-cols-2 border-b border-site-line py-12 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="py-4 pr-4">
              <dt className="sr-only">{s.label}</dt>
              <dd className="text-4xl font-semibold tracking-tight md:text-5xl">{s.value}</dd>
              <dd className="mt-2 font-mono text-xs uppercase tracking-wider text-site-muted">{s.label}</dd>
            </div>
          ))}
        </motion.dl>
      </Container>
    </section>
  )
}
