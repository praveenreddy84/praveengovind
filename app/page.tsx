import { Nav } from "@/components/nav"
import { Hero } from "@/components/hero"
import { Work } from "@/components/work"
import { Experience } from "@/components/experience"
import { Stack } from "@/components/stack"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"
import { personJsonLd } from "@/lib/seo"

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        // Escape "<" so no value can close the script tag early.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()).replace(/</g, "\\u003c") }}
      />
      <Nav />
      <main>
        <Hero />
        <Work />
        <Experience />
        <Stack />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
