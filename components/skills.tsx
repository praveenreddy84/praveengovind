"use client"

import { motion } from "framer-motion"

const skills = [
  { name: "Cloud Native Development (AWS)", color: "from-blue-500 to-blue-700" },
  { name: "Microservices Architecture", color: "from-yellow-500 to-yellow-700" },
  { name: ".NET & .NET Core Development", color: "from-purple-500 to-purple-700" },
  { name: "Serverless Computing (AWS Lambda, ECS)", color: "from-cyan-500 to-cyan-700" },
  { name: "DevOps & CI/CD Automation", color: "from-green-500 to-green-700" },
  { name: "React.js & Modern Frontend", color: "from-indigo-500 to-indigo-700" },
  { name: "Node.js & API Development", color: "from-red-500 to-red-700" },
  { name: "Oracle DB, MS SQL, Postgress & MySQL", color: "from-teal-500 to-teal-700" },
  { name: "Infrastructure as Code (Terraform, AWS CDK)", color: "from-gray-500 to-gray-700" },
  { name: "Full-Stack Development", color: "from-pink-500 to-pink-700" },
  { name: "Love for PHP", color: "from-orange-500 to-orange-700" },
  { name: "Power Apps & Low-Code Development", color: "from-amber-500 to-amber-700" },
];


export function Skills() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            Expertise & Skills
          </h2>
          <p className="mt-4 text-gray-400">Specialized in building scalable and resilient systems</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4"
        >
          {skills.map((skill, index) => (
            <motion.div
              key={skill.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r ${skill.color} rounded-full blur-xl opacity-25 group-hover:opacity-75 transition-opacity duration-500`}
              />
              <div
                className={`relative px-6 py-2 bg-black border border-gray-800 rounded-full bg-opacity-90 backdrop-blur-sm`}
              >
                <span className="text-gray-300 font-medium">{skill.name}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Background gradient */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl opacity-20" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl opacity-20" />
    </section>
  )
}

