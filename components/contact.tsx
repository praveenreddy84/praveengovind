"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CircuitButton } from "./circuit-button"
import { motion, AnimatePresence } from "framer-motion"

export function Contact() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // In a real-world scenario, you'd want to handle this server-side
    // This is a simple client-side approach for demonstration purposes
    const emailContent = `
      Name: ${formState.name}
      Email: ${formState.email}
      Message: ${formState.message}
    `

    try {
      // This is a placeholder for the actual email sending logic
      // In a real application, you'd make an API call to your server here
      console.log("Sending email to govindpraveen@gmail.com with content:", emailContent)

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setIsSubmitted(true)
      setFormState({ name: "", email: "", message: "" })
    } catch (error) {
      console.error("Error sending email:", error)
      alert("There was an error sending your message. Please try again.")
    }
  }

  return (
    <section id="contact" className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Let's Connect!</h2>
          <p className="mt-4 text-gray-400">Have an idea? Want to chat? Drop me a line!</p>
        </div>

        <AnimatePresence>
          {!isSubmitted ? (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="max-w-md mx-auto space-y-6"
            >
              <Input
                type="text"
                name="name"
                value={formState.name}
                onChange={handleInputChange}
                placeholder="Your Name"
                className="w-full bg-gray-900 border-gray-800 text-white placeholder-gray-500 focus:border-blue-500 transition-colors duration-300"
                required
              />
              <Input
                type="email"
                name="email"
                value={formState.email}
                onChange={handleInputChange}
                placeholder="Your Email"
                className="w-full bg-gray-900 border-gray-800 text-white placeholder-gray-500 focus:border-blue-500 transition-colors duration-300"
                required
              />
              <Textarea
                name="message"
                value={formState.message}
                onChange={handleInputChange}
                placeholder="What's on your mind?"
                className="w-full bg-gray-900 border-gray-800 text-white placeholder-gray-500 focus:border-blue-500 transition-colors duration-300"
                rows={4}
                required
              />
              <CircuitButton type="submit" className="w-full">
                Send Message
              </CircuitButton>
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto text-center"
            >
              <h3 className="text-2xl font-bold text-blue-500 mb-4">Thank You!</h3>
              <p className="text-white mb-6">Your message has been sent. I'll get back to you soon!</p>
              <CircuitButton onClick={() => setIsSubmitted(false)} className="mx-auto">
                Send Another Message
              </CircuitButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

