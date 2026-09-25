// All site copy lives here. Edit this file to update the website content.

export const site = {
  name: "Praveen Govind",
  initials: "PG",
  role: "Applications Architect",
  tagline: "I architect cloud-native systems that scale — and keep them simple enough to reason about.",
  intro:
    "I thrive on architecting scalable, high-performance solutions, yet simplicity is my superpower. Programming is my passion, but life is my greatest teacher. While there isn't a Wikipedia page about me (yet!), this space is here to share my journey — both in code and beyond.",
  photo: "/praveengovind.jpg",
  careerStartYear: 2007,
  socials: [
    { label: "GitHub", href: "https://github.com/praveenreddy84" },
    // { label: "LinkedIn", href: "https://www.linkedin.com/in/your-handle" },
  ],
}

export const yearsOfExperience = new Date().getFullYear() - site.careerStartYear

export const highlights = [
  `${yearsOfExperience}+ years shipping software — from co-founding a startup to architecting enterprise platforms at Toyota Motors North America.`,
  "Modernizing enterprise applications onto cloud-native AWS and Azure with microservices, serverless and containers.",
  "Led delivery for multi-tier client-server applications with a team of 15 engineers.",
]

export const stats = [
  { value: `${yearsOfExperience}+`, label: "Years building software" },
  { value: "3", label: "Companies, one co-founded" },
  { value: "15", label: "Engineers led in delivery" },
  { value: "2", label: "Clouds in production — AWS & Azure" },
]

export type Project = {
  index: string
  title: string
  kicker: string
  summary: string
  problem: string
  build: string
  outcome: string
  tags: string[]
  href?: string
}

export const projects: Project[] = [
  {
    index: "01",
    title: "System Design Simulator",
    kicker: "Interactive lab",
    summary: "Build an architecture, send it traffic, and watch where it breaks. Then fix it within budget.",
    problem:
      "System design is usually explained with static boxes and arrows, so the trade-offs between latency, failures and cost stay abstract.",
    build:
      "A deterministic queueing model of CDN, load balancer, autoscaling servers, cache, replicas and a write queue, with a live traffic diagram and three graded challenges.",
    outcome:
      "Each challenge fails with the naive design, can't be brute-forced within budget, and needs a new idea: caching, then queues and CDNs, then scaling for launch day.",
    tags: ["React", "TypeScript", "SVG", "Queueing theory", "Architecture"],
    href: "/lab/system-design",
  },
  {
    index: "02",
    title: "Enterprise Cloud Modernization",
    kicker: "Toyota Motors North America",
    summary: "Moving long-lived enterprise applications onto cloud-native AWS and Azure platforms.",
    problem: "Legacy applications carried growing tech debt, rising run costs and slow, manual release cycles.",
    build:
      "Re-architected workloads into microservices and serverless components (AWS Lambda, ECS, Docker) with clear service boundaries.",
    outcome: "Reduced tech debt, lower operating costs and systems built to scale with the business.",
    tags: ["AWS", "Azure", "Microservices", "Serverless", "Docker"],
  },
  {
    index: "03",
    title: "Infrastructure as Code & Delivery Pipelines",
    kicker: "Platform engineering",
    summary: "Every environment defined in code, every change shipped through an automated pipeline.",
    problem: "Hand-built environments drifted apart and deployments depended on tribal knowledge.",
    build:
      "Standardized infrastructure with Terraform and AWS CDK, wired into CI/CD automation with observability built in from day one.",
    outcome: "Repeatable, auditable deployments and faster feedback on system performance.",
    tags: ["Terraform", "AWS CDK", "CI/CD", "Observability"],
  },
  {
    index: "04",
    title: "Tech4sys Software Solutions",
    kicker: "Co-founder & Technical Lead",
    summary: "Co-founded a software company and built products on open-source technologies.",
    problem: "Clients needed dependable web applications without enterprise-sized budgets.",
    build:
      "Led development teams, designed scalable databases and delivered applications in Angular, Node.js and PHP with a strong UX/UI focus.",
    outcome: "Eight years of products shipped and a team grown from the ground up.",
    tags: ["Angular", "Node.js", "PHP", "MySQL", "UX/UI"],
  },
]

export const experience = [
  {
    period: "2018 — Present",
    role: "Applications Architect",
    company: "Toyota Motors North America",
    location: "USA",
    description:
      "Architecting and modernizing enterprise applications with cloud-native solutions on AWS and Azure. Designing scalable, high-performance systems using microservices, serverless computing and containers. Leading tech-debt reduction, cost optimization, CI/CD automation, infrastructure as code and observability.",
  },
  {
    period: "2015 — 2018",
    role: "Delivery Manager",
    company: "CES Technology Services",
    location: "India",
    description:
      "Led end-to-end project management for multi-tier client-server applications, managing a team of 15 and owning deliveries.",
  },
  {
    period: "2007 — 2015",
    role: "Technical Lead / Co-Founder",
    company: "Tech4sys Software Solutions",
    location: "India",
    description:
      "Managed and led development teams, designed scalable databases, built applications on open-source technologies, Angular and Node.js, and integrated UX/UI best practices.",
  },
]

export const stack = [
  { group: "Cloud & Platform", items: ["AWS", "Azure", "Lambda", "ECS", "Docker", "Serverless"] },
  { group: "Architecture", items: ["Microservices", "Event-driven design", "API design", "Cost optimization"] },
  { group: "Delivery", items: ["Terraform", "AWS CDK", "CI/CD", "Observability", "DevOps"] },
  { group: "Application", items: [".NET / .NET Core", "Node.js", "React", "Angular", "PHP", "Power Apps"] },
  { group: "Data", items: ["Oracle", "MS SQL", "PostgreSQL", "MySQL"] },
]
