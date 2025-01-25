"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface CircuitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
}

export function CircuitButton({ children, className, ...props }: CircuitButtonProps) {
  return (
    <button
      className={cn("relative px-8 py-3 bg-blue-500 text-white rounded-md overflow-hidden group", className)}
      {...props}
    >
      {/* Circuit paths */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
        {/* Left circuits */}
        <motion.path
          d="M 0 50 L 50 50 L 70 30 L 100 30"
          className="stroke-blue-300/50"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1 }}
        />
        <motion.path
          d="M 0 50 L 50 50 L 70 70 L 100 70"
          className="stroke-blue-300/50"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1, delay: 0.2 }}
        />

        {/* Right circuits */}
        <motion.path
          d="M 200 30 L 230 30 L 250 50 L 300 50"
          className="stroke-blue-300/50"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1, delay: 0.4 }}
        />
        <motion.path
          d="M 200 70 L 230 70 L 250 50 L 300 50"
          className="stroke-blue-300/50"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1, delay: 0.6 }}
        />

        {/* Glowing effect */}
        <motion.circle
          cx="0"
          cy="50"
          r="2"
          className="fill-blue-200"
          initial={{ x: 0 }}
          animate={{ x: 300 }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 0.5 }}
        />
      </svg>

      {/* Button content */}
      <div className="relative z-10 font-medium">{children}</div>

      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  )
}

