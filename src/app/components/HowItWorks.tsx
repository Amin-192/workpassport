'use client'
import { motion } from 'framer-motion'
import { Building2, User, CheckCircle2 } from 'lucide-react'

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: Building2,
      title: 'Employers Issue',
      description: 'Companies cryptographically sign work credentials with their wallet and deposit PYUSD into escrow as proof of legitimacy.',
      features: ['Digital signatures', 'PYUSD escrow', 'Blockchain recording', 'Fraud-proof timestamps']
    },
    {
      number: '02',
      icon: User,
      title: 'Workers Own',
      description: 'Receive tamper-proof credentials in your wallet with QR codes for instant, portable sharing across any platform.',
      features: ['Portable credentials', 'QR code generation', 'GitHub integration', 'Lifetime access']
    },
    {
      number: '03',
      icon: CheckCircle2,
      title: 'Anyone Verifies',
      description: 'Instant scanning reveals authentic credential details, issuing employer, escrow status, and complete verification history.',
      features: ['10-second verification', 'Institution validation', 'Fraud detection', 'Hiring confidence']
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
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 border border-green-500/20 rounded-full bg-green-500/5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-500 font-medium tracking-wide">OUR SOLUTION</span>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              WorkPassport: Instant<br />Blockchain Verification
            </h2>
            
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              A complete ecosystem that connects employers, workers, and verifiers through 
              tamper-proof, instantly verifiable digital credentials.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="relative"
              >
                <div className="p-8 border border-border rounded-2xl bg-bg-secondary/10 h-full hover:bg-bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-bg-secondary border border-border flex items-center justify-center">
                      <step.icon className="w-7 h-7 text-text-secondary" />
                    </div>
                    <div>
                      <div className="text-xs text-text-secondary font-mono mb-1">{step.number}</div>
                      <h3 className="text-2xl font-bold">{step.title}</h3>
                    </div>
                  </div>

                  <p className="text-text-secondary mb-6 leading-relaxed">
                    {step.description}
                  </p>

                  <ul className="space-y-3">
                    {step.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-text-secondary">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-border" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}