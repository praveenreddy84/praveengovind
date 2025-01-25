import { Hero } from "@/components/hero"
import { Skills } from "@/components/skills"
import { Experience } from "@/components/experience"
import { Contact } from "@/components/contact"

export default function Page() {
  return (
    <main className="bg-black">
      <Hero />
      <Skills />
      <Experience />
      <Contact />
    </main>
  )
}

