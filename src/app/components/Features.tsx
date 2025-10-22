'use client'
import { motion } from 'framer-motion'
import { Shield, Zap, Globe } from 'lucide-react'

export default function Features() {
  const features = [
    {
      icon: Shield,
      title: 'Cryptographically Signed',
      description: 'Employers sign credentials with their wallet. EIP-712 signatures make forgery mathematically impossible.',
      stat: '100%',
      statLabel: 'Unforgeable'
    },
    {
      icon: Zap,
      title: 'Instant Verification',
      description: 'No waiting weeks for international background checks. Blockchain verification happens in seconds.',
      stat: '10s',
      statLabel: 'Verification Time'
    },
    {
      icon: Globe,
      title: 'Portable Identity',
      description: 'Your credentials follow you everywhere. One QR code works across any platform, any border.',
      stat: '∞',
      statLabel: 'Platforms'
    }
  ]

  return (
    <section className="px-6 py-32 bg-bg-secondary/10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why Blockchain Changes Everything
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Traditional verification is slow, expensive, and unreliable. WorkPassport is instant, trustless, and permanent.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group relative"
            >
              <div className="p-8 border border-border rounded-2xl bg-bg-primary h-full hover:border-text-secondary transition-all duration-300">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-xl bg-bg-secondary border border-border flex items-center justify-center group-hover:border-text-secondary transition-colors">
                    <feature.icon className="w-7 h-7 text-text-secondary" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-400">{feature.stat}</div>
                    <div className="text-xs text-text-secondary">{feature.statLabel}</div>
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}