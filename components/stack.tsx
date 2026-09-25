"use client"

import { stack } from "@/lib/site"
import { Container, Reveal, SectionHeader } from "./primitives"

export function Stack() {
  return (
    <section id="stack" className="border-t border-site-line py-24 md:py-32">
      <Container>
        <SectionHeader
          number="03"
          label="Stack"
          title={
            <>
              Tools I reach for, <span className="font-serif font-normal italic">and why</span> they earn it.
            </>
          }
          description="Specialized in building scalable and resilient systems — picked for the problem, not the hype."
        />

        <div className="grid gap-px overflow-hidden rounded-2xl border border-site-line bg-site-line sm:grid-cols-2 lg:grid-cols-3">
          {stack.map((s, i) => (
            <Reveal key={s.group} delay={i * 0.04} className="bg-site-bg p-6 md:p-8">
              <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-site-accent">{s.group}</h3>
              <ul className="mt-5 flex flex-wrap gap-2">
                {s.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-site-line bg-site-panel px-3 py-1.5 text-sm text-site-fg/90 transition-colors hover:border-site-accent/60"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
          <Reveal className="flex flex-col justify-between bg-site-bg p-6 md:p-8">
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-site-accent">Soft spot</h3>
            <p className="mt-5 font-serif text-3xl italic leading-tight">A lasting love for PHP.</p>
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
