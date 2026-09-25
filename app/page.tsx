import { Nav } from "@/components/nav"
import { Hero } from "@/components/hero"
import { Work } from "@/components/work"
import { Experience } from "@/components/experience"
import { Stack } from "@/components/stack"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"

export default function Page() {
  return (
    <>
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
