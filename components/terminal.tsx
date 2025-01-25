"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

const sequence = [
  { type: "command", text: "Who is Praveen?" },
  { type: "output", text: "Software Architect | Innovator | Problem-Solver" },
  { type: "command", text: "Show skills --verbose" },
  {
    type: "output",
    text: "🛠️ Expertise: Scalable systems, cloud architecture, app development\n🚀 Passion: Building innovative solutions",
  },
  { type: "command", text: "What's next?" },
  { type: "output", text: "Let's build something amazing together." },
  { type: "command", text: "Fun fact --about-me" },
  { type: "output", text: "Praveen's work has powered millions of users globally." },
  { type: "command", text: "cat goals.txt" },
  {
    type: "output",
    text: "Delivering high-performance applications.\nExploring cutting-edge technologies.\nEmpowering teams to create impact.",
  },
]

export function Terminal() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [typed, setTyped] = useState("")
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    const current = sequence[currentIndex]
    if (typed.length < current.text.length) {
      const timeout = setTimeout(
        () => {
          setTyped(current.text.slice(0, typed.length + 1))
        },
        current.type === "command" ? 100 : 20,
      )
      return () => clearTimeout(timeout)
    } else {
      const timeout = setTimeout(
        () => {
          setTyped("")
          setCurrentIndex((prevIndex) => (prevIndex + 1) % sequence.length)
        },
        current.type === "command" ? 1000 : 3000,
      )
      return () => clearTimeout(timeout)
    }
  }, [typed, currentIndex])

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl border border-gray-800">
      <div className="flex items-center gap-2 px-4 py-3 bg-black/50 border-b border-gray-800">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
      </div>
      <div className="p-4 font-mono text-sm">
        {sequence.slice(0, currentIndex + 1).map((item, index) => (
          <div key={index} className="mb-2">
            {item.type === "command" && (
              <div className="flex items-center gap-2">
                <span className="text-green-500">$</span>
                <span className="text-white">{index === currentIndex ? typed : item.text}</span>
                {index === currentIndex && showCursor && (
                  <motion.span
                    className="inline-block w-2 h-4 bg-white"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
                  />
                )}
              </div>
            )}
            {item.type === "output" && index < currentIndex && (
              <div className="text-gray-400 whitespace-pre-line">{item.text}</div>
            )}
            {item.type === "output" && index === currentIndex && (
              <div className="text-gray-400 whitespace-pre-line">{typed}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

