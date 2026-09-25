"use client"

import { motion, useReducedMotion } from "framer-motion"
import { cn } from "@/lib/utils"
import { site } from "@/lib/site"

export function Logo({ className }: { className?: string }) {
  return (
    <span
      aria-label={site.name}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-site-accent/60 bg-site-panel font-mono text-sm font-bold tracking-tighter text-site-fg transition-colors group-hover:border-site-accent group-hover:bg-site-accent group-hover:text-site-bg",
        className,
      )}
    >
      {site.initials}
    </span>
  )
}

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-xs uppercase tracking-[0.2em] text-site-muted", className)}>
      <span className="text-site-accent">/</span> {children}
    </p>
  )
}

export function SectionHeader({
  number,
  label,
  title,
  description,
}: {
  number: string
  label: string
  title: React.ReactNode
  description?: string
}) {
  return (
    <Reveal className="mb-12 grid gap-6 md:mb-16 md:grid-cols-[12rem_1fr]">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-site-muted">
        <span className="text-site-accent">{number}</span> — {label}
      </p>
      <div>
        <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-5xl">{title}</h2>
        {description && <p className="mt-4 max-w-2xl text-site-muted md:text-lg">{description}</p>}
      </div>
    </Reveal>
  )
}

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>
}
