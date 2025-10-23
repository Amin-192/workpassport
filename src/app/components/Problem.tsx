'use client'
import { motion } from 'framer-motion'
import { AlertTriangle, TrendingUp, Clock, FileQuestion, Shield, Code } from 'lucide-react'

export default function Problem() {
  const problems = [
    {
      icon: TrendingUp,
      title: 'Remote Work Exploded',
      description: 'Global talent pools formed overnight. Companies hire across 50+ countries with no verification infrastructure.'
    },
    {
      icon: FileQuestion,
      title: 'Self-Reported Everything',
      description: 'LinkedIn, resumes, portfolios—all self-reported. Zero cryptographic proof. Anyone can claim anything.'
    },
    {
      icon: Clock,
      title: 'Verification Takes Weeks',
      description: 'Background checks require international phone calls, emails, and manual processes. Often completely fails.'
    },
    {
      icon: Shield,
      title: 'Employers Hire Blind',
      description: 'Companies take 6-figure bets on people they can\'t verify. Bad hires cost months of productivity.'
    },
    {
      icon: Code,
      title: 'Work History Not Portable',
      description: 'Your GitHub commits prove nothing about employment. Past work locked in proprietary systems.'
    }
  ]

  return (
    <section className="px-6 py-32">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-4xl mx-auto text-center mb-20">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 border border-red-500/20 rounded-full bg-red-500/5">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-500 font-medium tracking-wide">THE PROBLEM</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
              Remote Work Has a<br />
              <span className="text-text-secondary">Trust Problem</span>
            </h2>
            
            <p className="text-xl text-text-secondary leading-relaxed">
              Post-COVID, work went remote. Companies hire globally. But there's{' '}
              <span className="text-white font-semibold">no verifiable proof of work history</span>. 
              The entire system runs on trust and PDFs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {problems.slice(0, 3).map((problem, i) => (
              <ProblemCard key={i} problem={problem} delay={i * 0.1} />
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {problems.slice(3).map((problem, i) => (
              <ProblemCard key={i} problem={problem} delay={(i + 3) * 0.1} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="p-8 border-2 border-border rounded-2xl bg-bg-secondary/30 text-center">
              <p className="text-2xl font-bold mb-2">
                There is <span className="text-red-400">no blockchain-native identity layer</span> for remote workers.
              </p>
              <p className="text-lg text-text-secondary">
                WorkPassport fixes this.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function ProblemCard({ problem, delay }: { problem: any; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="group p-8 border border-border rounded-xl bg-bg-secondary/10 hover:bg-bg-secondary/30 hover:border-text-secondary transition-all duration-300"
    >
      <div className="w-12 h-12 rounded-xl bg-bg-secondary border border-border flex items-center justify-center mb-6 group-hover:border-text-secondary transition-colors">
        <problem.icon className="w-6 h-6 text-text-secondary" />
      </div>
      <h3 className="text-xl font-bold mb-3">{problem.title}</h3>
      <p className="text-text-secondary leading-relaxed">
        {problem.description}
      </p>
    </motion.div>
  )
}