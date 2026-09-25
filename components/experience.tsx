"use client"

import { experience, yearsOfExperience } from "@/lib/site"
import { Container, Reveal, SectionHeader } from "./primitives"

export function Experience() {
  return (
    <section id="experience" className="border-t border-site-line py-24 md:py-32">
      <Container>
        <SectionHeader
          number="02"
          label="Experience"
          title={
            <>
              {yearsOfExperience}+ years, <span className="font-serif font-normal italic">three</span> chapters.
            </>
          }
          description="From co-founding a company to leading delivery teams to architecting enterprise platforms."
        />

        <ol className="border-t border-site-line">
          {experience.map((e, i) => (
            <Reveal key={e.company} delay={i * 0.05}>
              <li className="group grid gap-4 border-b border-site-line py-10 md:grid-cols-[12rem_1fr_auto] md:gap-8">
                <p className="font-mono text-sm text-site-muted">{e.period}</p>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight md:text-2xl">
                    {e.role}
                    <span className="text-site-muted"> · </span>
                    <span className="text-site-accent">{e.company}</span>
                  </h3>
                  <p className="mt-3 max-w-3xl leading-relaxed text-site-muted">{e.description}</p>
                </div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-site-muted md:text-right">
                  {e.location}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  )
}
