"use client"

import { useState } from "react"
import { ArrowUpRight, Check, Copy } from "lucide-react"
import { site } from "@/lib/site"
import { Container, Reveal, SectionHeader } from "./primitives"

const inputClass =
  "w-full rounded-lg border border-site-line bg-site-panel px-4 py-3 text-sm text-site-fg placeholder:text-site-muted/70 outline-none transition-colors focus:border-site-accent"

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" })
  const [copied, setCopied] = useState(false)

  const update = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  // No backend: compose the message in the visitor's mail client.
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const subject = `Hello from ${form.name}`
    const body = `${form.message}\n\n— ${form.name} (${form.email})`
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(site.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.location.href = `mailto:${site.email}`
    }
  }

  return (
    <section id="contact" className="border-t border-site-line py-24 md:py-32">
      <Container>
        <SectionHeader
          number="04"
          label="Contact"
          title={
            <>
              Let&apos;s build something <span className="font-serif font-normal italic text-site-accent">together</span>.
            </>
          }
          description="Have an idea, an architecture question, or just want to chat? Drop me a line."
        />

        <div className="grid gap-12 md:grid-cols-[12rem_1fr] md:gap-8">
          <div aria-hidden className="hidden md:block" />
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
            <Reveal className="space-y-8">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-site-muted">Email</p>
                <button
                  type="button"
                  onClick={copyEmail}
                  className="group mt-2 inline-flex items-center gap-3 text-left text-xl font-medium break-all transition-colors hover:text-site-accent md:text-2xl"
                >
                  {site.email}
                  {copied ? (
                    <Check className="h-5 w-5 shrink-0 text-site-accent" />
                  ) : (
                    <Copy className="h-5 w-5 shrink-0 text-site-muted group-hover:text-site-accent" />
                  )}
                </button>
                <p className="mt-1 h-4 font-mono text-xs text-site-accent" aria-live="polite">
                  {copied ? "Copied to clipboard" : ""}
                </p>
              </div>

              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-site-muted">Elsewhere</p>
                <ul className="mt-3 space-y-2">
                  {site.socials.map((s) => (
                    <li key={s.label}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex items-center gap-2 text-lg transition-colors hover:text-site-accent"
                      >
                        {s.label}
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="sr-only">Your name</span>
                    <input name="name" required value={form.name} onChange={update} placeholder="Your name" className={inputClass} />
                  </label>
                  <label className="block">
                    <span className="sr-only">Your email</span>
                    <input
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={update}
                      placeholder="Your email"
                      className={inputClass}
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="sr-only">Message</span>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={update}
                    placeholder="What's on your mind?"
                    className={`${inputClass} resize-none`}
                  />
                </label>
                <button
                  type="submit"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-site-accent px-5 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90"
                >
                  Send message
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </button>
                <p className="text-center font-mono text-[11px] text-site-muted">Opens your email app with the message ready to send.</p>
              </form>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  )
}
