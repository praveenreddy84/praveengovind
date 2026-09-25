"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Menu, Moon, Sun, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { site } from "@/lib/site"
import { Container, Logo } from "./primitives"

const links = [
  { href: "#work", label: "Work" },
  { href: "#experience", label: "Experience" },
  { href: "#stack", label: "Stack" },
  { href: "#contact", label: "Contact" },
]

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = !mounted || resolvedTheme === "dark"
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-site-line text-site-muted transition-colors hover:border-site-fg/40 hover:text-site-fg"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
        scrolled || open ? "border-site-line bg-site-bg/80 backdrop-blur-md" : "border-transparent",
      )}
    >
      <Container className="flex h-16 items-center justify-between">
        <a href="#top" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
          <Logo />
          <span className="hidden text-sm font-medium sm:inline">{site.name}</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-site-muted transition-colors hover:text-site-fg">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="#contact"
            className="hidden rounded-lg bg-site-fg px-4 py-2 text-sm font-medium text-site-bg transition-opacity hover:opacity-85 md:inline-block"
          >
            Say hi
          </a>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-site-line md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </Container>

      {open && (
        <nav className="border-t border-site-line md:hidden" aria-label="Mobile">
          <Container className="flex flex-col py-2">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-site-line/60 py-3 font-mono text-sm uppercase tracking-widest text-site-muted last:border-0 hover:text-site-fg"
              >
                {l.label}
              </a>
            ))}
          </Container>
        </nav>
      )}
    </header>
  )
}
