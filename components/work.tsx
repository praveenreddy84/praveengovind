"use client"

import { ArrowUpRight } from "lucide-react"
import { projects } from "@/lib/site"
import { Container, Reveal, SectionHeader } from "./primitives"

const isExternal = (href: string) => /^https?:\/\//.test(href)

export function Work() {
  return (
    <section id="work" className="py-24 md:py-32">
      <Container>
        <SectionHeader
          number="01"
          label="Selected work"
          title={
            <>
              Systems I&apos;ve designed, <span className="font-serif font-normal italic">shipped</span> and run.
            </>
          }
          description="A few representative engagements — the problem, what was built, and what changed because of it."
        />

        <div className="space-y-6">
          {projects.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.05}>
              <article className="group relative overflow-hidden rounded-2xl border border-site-line bg-site-panel/60 p-6 transition-colors hover:border-site-accent/50 md:p-10">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-site-accent/0 blur-3xl transition-colors duration-500 group-hover:bg-site-accent/10"
                />
                <div className="relative grid gap-8 md:grid-cols-[12rem_1fr]">
                  <div>
                    <span className="font-mono text-5xl font-semibold text-site-line transition-colors group-hover:text-site-accent md:text-6xl">
                      {p.index}
                    </span>
                    <p className="mt-3 font-mono text-xs uppercase tracking-[0.18em] text-site-muted">{p.kicker}</p>
                  </div>

                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">{p.title}</h3>
                      {p.href && (
                        <a
                          href={p.href}
                          {...(isExternal(p.href) && { target: "_blank", rel: "noreferrer" })}
                          aria-label={`Open ${p.title}`}
                          className="rounded-lg border border-site-line p-2 text-site-muted transition-colors hover:border-site-accent hover:text-site-accent"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    <p className="mt-3 text-lg text-site-muted">{p.summary}</p>

                    <dl className="mt-8 grid gap-6 border-t border-site-line pt-6 md:grid-cols-3">
                      {[
                        ["Problem", p.problem],
                        ["Build", p.build],
                        ["Outcome", p.outcome],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-site-accent">{k}</dt>
                          <dd className="mt-2 text-sm leading-relaxed text-site-fg/85">{v}</dd>
                        </div>
                      ))}
                    </dl>

                    {p.href && !isExternal(p.href) && (
                      <a
                        href={p.href}
                        className="group/cta mt-8 inline-flex items-center gap-2 rounded-lg bg-site-accent px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
                      >
                        Try it live
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5" />
                      </a>
                    )}

                    <ul className="mt-8 flex flex-wrap gap-2">
                      {p.tags.map((t) => (
                        <li
                          key={t}
                          className="rounded-full border border-site-line px-3 py-1 font-mono text-xs text-site-muted"
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
