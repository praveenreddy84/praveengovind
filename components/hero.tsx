"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Terminal } from "./terminal"
import Image from "next/image"

export function Hero() {
  const scrollToContact = () => {
    const contactSection = document.getElementById("contact")
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-black">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-gray-950">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      <div className="container px-4 mx-auto relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative w-40 h-40 md:w-48 md:h-48 mb-8 rounded-full overflow-hidden border-2 border-gray-800"
          >
            <Image
              src="/placeholder.svg"
              alt="Praveen Govind"
              layout="fill"
              objectFit="cover"
              className="rounded-full"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
              Praveen Govind
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6"
          >
            <p className="text-lg md:text-xl text-gray-400 max-w-6xl">
            I thrive on architecting scalable and high-performance solutions, yet simplicity is my superpower. Programming is my passion, but life is my greatest teacher. While there isn’t a Wikipedia page about me (yet!), this space is here to share my journey—both in code and beyond.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8"
          >
            <Button
              size="lg"
              className="bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-300"
              onClick={scrollToContact}
            >
              Say Hi 👋
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="w-full mt-12"
          >
            <Terminal />
          </motion.div>
        </div>
      </div>

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl opacity-20" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl opacity-20" />
    </section>
  )
}

