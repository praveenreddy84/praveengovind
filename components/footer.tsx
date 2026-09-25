import { site } from "@/lib/site"
import { Container, Logo } from "./primitives"

export function Footer() {
  return (
    <footer className="border-t border-site-line py-10">
      <Container className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <a href="#top" className="group flex items-center gap-3">
          <Logo className="h-8 w-8 text-xs" />
          <span className="text-sm text-site-muted">
            © {new Date().getFullYear()} {site.name}
          </span>
        </a>
        <p className="font-mono text-xs text-site-muted">Designed &amp; built by {site.initials} with Next.js</p>
      </Container>
    </footer>
  )
}
