'use client'
import { motion } from 'framer-motion'
import { Lock, Coins, Zap, CheckCircle2 } from 'lucide-react'

export default function PyusdSection() {
  return (
    <section className="px-6 py-32">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <img 
                  src="https://ethglobal.b-cdn.net/organizations/aezzh/square-logo/default.png"
                  alt="PYUSD"
                  className="w-16 h-16"
                />
                <div>
                  <h2 className="text-4xl font-bold">PayPal USD</h2>
                  <p className="text-text-secondary">Stablecoin Escrow Layer</p>
                </div>
              </div>

              <p className="text-xl text-text-secondary mb-8 leading-relaxed">
                We use PYUSD to create <span className="text-white font-semibold">skin in the game</span>. 
                When employers issue credentials, they deposit PYUSD into our smart contract escrow. 
                Workers claim payments after verification. No intermediaries.
              </p>

              <div className="space-y-6">
                <FeatureItem 
                  icon={<Lock className="w-5 h-5" />}
                  title="Smart Contract Escrow"
                  description="Payments locked on-chain until credential verification completes"
                />
                <FeatureItem 
                  icon={<Coins className="w-5 h-5" />}
                  title="Direct Worker Claims"
                  description="Workers claim PYUSD directly from contract—no platform fees"
                />
                <FeatureItem 
                  icon={<Zap className="w-5 h-5" />}
                  title="Instant Settlement"
                  description="Blockchain-native payments settle in seconds, not days"
                />
              </div>
            </div>

            <div className="relative">
              <div className="p-8 border border-border rounded-2xl bg-bg-secondary/20">
                <div className="space-y-4">
                  <CodeBlock 
                    title="Employer deposits PYUSD"
                    code="depositToEscrow(workerAddress, credentialHash, 100 PYUSD)"
                  />
                  <div className="flex items-center justify-center py-2">
                    <div className="w-px h-8 bg-border" />
                  </div>
                  <CodeBlock 
                    title="Worker claims payment"
                    code="claimPayment(credentialHash) → 100 PYUSD"
                  />
                  <div className="mt-6 p-4 border border-green-500/20 rounded-lg bg-green-500/5">
                    <div className="flex items-center gap-2 text-green-500 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-medium">Trustless • Transparent • On-Chain</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-bg-secondary border border-border flex items-center justify-center text-green-500">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div>
      <div className="text-xs text-text-secondary mb-2 font-medium">{title}</div>
      <div className="p-4 bg-bg-primary border border-border rounded-lg font-mono text-sm text-green-400">
        {code}
      </div>
    </div>
  )
}