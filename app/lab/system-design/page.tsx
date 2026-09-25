import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Footer } from "@/components/footer"
import { Nav } from "@/components/nav"
import { Container, Eyebrow } from "@/components/primitives"
import { Simulator } from "@/components/simulator/simulator"

const description =
  "Design a web architecture, send it real traffic, and watch where it breaks. Interactive challenges on caching, scaling, queues and cost."

export const metadata: Metadata = {
  title: "System Design Simulator",
  description,
  alternates: { canonical: "/lab/system-design" },
  openGraph: { url: "/lab/system-design", title: "System Design Simulator", description },
  twitter: { title: "System Design Simulator", description },
}

export default function SystemDesignPage() {
  return (
    <>
      <Nav />
      <main className="pb-24 pt-28 md:pt-32">
        <Container>
          <Link
            href="/#work"
            className="inline-flex items-center gap-2 font-mono text-xs text-site-muted transition-colors hover:text-site-fg"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to portfolio
          </Link>

          <header className="mb-10 mt-6 max-w-3xl">
            <Eyebrow>Lab · Interactive</Eyebrow>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight md:text-6xl">
              System Design <span className="font-serif font-normal italic text-site-accent">Simulator</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-site-muted">
              Every architecture works on a whiteboard. Build one here, send it real traffic, and watch where it breaks.
              Then fix it without blowing the budget.
            </p>
          </header>

          <Simulator />

          <details className="group mt-12 rounded-2xl border border-site-line p-5 md:p-6">
            <summary className="cursor-pointer list-none font-medium">
              <span className="mr-2 inline-block text-site-accent transition-transform group-open:rotate-90">›</span>
              How the model works
            </summary>
            <div className="mt-4 grid gap-4 text-sm leading-relaxed text-site-muted md:grid-cols-2">
              <p>
                Each tier has a capacity in requests per second. Latency grows with utilization the way a single queue
                does (base time ÷ (1 − utilization)), so a tier at 90% is ten times slower than an idle one. Anything
                beyond 100% is rejected and counts as errors.
              </p>
              <p>
                A CDN serves the 40% of requests that are static files. A cache answers the chosen share of reads.
                Replicas split reads with the primary database, but every write lands on the primary. A queue accepts
                writes instantly and drains them into the database's spare capacity.
              </p>
              <p>
                Autoscaling adds one server every 3 seconds when servers pass 60% busy and removes them slowly, so it
                lags behind sudden spikes, just like the real thing.
              </p>
              <p>
                Prices are rounded, illustrative on-demand list prices per month. The model is deliberately simple: the
                point is the trade-offs, not a quote.{" "}
                <a
                  href="https://github.com/praveenreddy84/praveengovind/blob/main/lib/simulator/engine.ts"
                  className="text-site-fg underline decoration-site-line underline-offset-4 hover:decoration-site-accent"
                >
                  Read the engine
                </a>
                .
              </p>
            </div>
          </details>
        </Container>
      </main>
      <Footer />
    </>
  )
}
