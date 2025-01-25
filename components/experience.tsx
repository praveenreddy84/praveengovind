"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"

const experiences = [
  {
    years: "2018 - Present",
    duration: "5+ years",
    role: "Lead Software Architect",
    company: "Tech Innovations Inc.",
    description:
      "Leading architecture design for enterprise-scale applications, focusing on cloud-native solutions and microservices architecture.",
  },
  {
    years: "2012 - 2018",
    duration: "6 years",
    role: "Senior Software Engineer",
    company: "Global Systems Ltd.",
    description:
      "Developed and maintained large-scale distributed systems, implemented CI/CD pipelines, and mentored junior developers.",
  },
  {
    years: "2007 - 2012",
    duration: "5 years",
    role: "Software Developer",
    company: "StartUp Dynamics",
    description:
      "Worked on various projects involving web and mobile application development, database design, and system integration.",
  },
]

const currentYear = new Date().getFullYear()
const startYear = 2006

const StreamingLine = () => (
  <motion.div
    className="absolute left-1/2 top-0 w-px h-full bg-blue-500/50 overflow-hidden"
    initial={{ scaleY: 0 }}
    animate={{ scaleY: 1 }}
    transition={{ duration: 1 }}
  >
    <motion.div
      className="w-full h-full bg-gradient-to-b from-blue-500/0 via-blue-500 to-blue-500/0"
      animate={{
        y: ["-100%", "100%"],
      }}
      transition={{
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "loop",
        duration: 2,
        ease: "linear",
      }}
    />
  </motion.div>
)

const YearMarker = ({ year, position }: { year: number; position: "top" | "bottom" }) => (
  <div className={`absolute left-1/2 transform -translate-x-1/2 ${position === "top" ? "top-0" : "bottom-0"}`}>
    <div className="px-4 py-1 rounded-full bg-gray-800/50 border border-gray-700 backdrop-blur-sm">
      <span className="text-sm text-gray-400">{year}</span>
    </div>
  </div>
)

export function Experience() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            Professional Journey
          </h2>
          <p className="mt-4 text-gray-400">
            Over {currentYear - startYear} years of experience in software development and architecture
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Main timeline line with streaming effect */}
          <div className="absolute left-1/2 top-0 w-px h-full bg-gray-800" />
          <StreamingLine />

          {/* Year markers */}
          <YearMarker year={currentYear} position="top" />
          <YearMarker year={startYear} position="bottom" />

          {/* Fade effect for timeline ends */}
          <div className="absolute left-1/2 top-0 w-px h-24 bg-gradient-to-b from-black to-transparent" />
          <div className="absolute left-1/2 bottom-0 w-px h-24 bg-gradient-to-t from-black to-transparent" />

          {experiences.map((exp, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              viewport={{ once: true }}
              className={`relative flex items-center mb-12 ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
            >
              {/* Year marker */}
              <div className="absolute left-[50%] transform -translate-x-1/2 flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-blue-500 relative">
                  <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-25" />
                </div>
                <div className="mt-2 px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
                  <span className="text-sm text-blue-400">{exp.duration}</span>
                </div>
              </div>

              {/* Experience card */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
                className={`w-[calc(50%-40px)] ${index % 2 === 0 ? "mr-auto" : "ml-auto"}`}
              >
                <Card className="bg-black/50 border-gray-800 backdrop-blur-sm overflow-hidden transition-colors duration-300 hover:bg-black/70">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-1">{exp.role}</h3>
                    <p className="text-blue-400 mb-2">{exp.company}</p>
                    <p className="text-gray-400 text-sm">{exp.description}</p>
                    <div className="mt-4 text-sm text-gray-500">{exp.years}</div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Background gradients */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl opacity-20" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl opacity-20" />
    </section>
  )
}

