'use client'
import { motion } from 'framer-motion'
import { Search, Eye, Bell, ExternalLink } from 'lucide-react'

export default function BlockscoutSection() {
  return (
    <section className="px-6 py-32 bg-bg-secondary/20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="p-8 border border-border rounded-2xl bg-bg-primary">
                <div className="space-y-6">
                  <TransactionPreview 
                    type="Credential Issued"
                    from="Employer"
                    to="Worker"
                    status="success"
                  />
                  <TransactionPreview 
                    type="PYUSD Deposited"
                    from="Employer"
                    to="Escrow Contract"
                    status="success"
                  />
                  <TransactionPreview 
                    type="Payment Claimed"
                    from="Escrow Contract"
                    to="Worker"
                    status="pending"
                  />
                  
                  <div className="pt-4 border-t border-border">
                    <button className="w-full py-3 bg-bg-secondary border border-border rounded-lg text-sm font-medium hover:border-text-secondary transition-colors flex items-center justify-center gap-2">
                      <img 
                        src="https://ethglobal.b-cdn.net/organizations/8kguf/square-logo/default.png"
                        alt="Blockscout"
                        className="w-4 h-4"
                      />
                      View on Blockscout
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <div className="flex items-center gap-4 mb-8">
                <img 
                  src="https://ethglobal.b-cdn.net/organizations/8kguf/square-logo/default.png"
                  alt="Blockscout"
                  className="w-16 h-16"
                />
                <div>
                  <h2 className="text-4xl font-bold">Blockscout</h2>
                  <p className="text-text-secondary">Transparent Verification</p>
                </div>
              </div>

              <p className="text-xl text-text-secondary mb-8 leading-relaxed">
                Every credential issuance, escrow deposit, and payment claim is{' '}
                <span className="text-white font-semibold">publicly verifiable</span> on the blockchain. 
                Blockscout provides the transparency layer that makes trust unnecessary.
              </p>

              <div className="space-y-6">
                <FeatureItem 
                  icon={<Bell className="w-5 h-5" />}
                  title="Real-Time Notifications"
                  description="Transaction toast notifications via Blockscout SDK for every on-chain action"
                />
                <FeatureItem 
                  icon={<Eye className="w-5 h-5" />}
                  title="Transaction History Popup"
                  description="Workers access complete transaction history with one click"
                />
                <FeatureItem 
                  icon={<Search className="w-5 h-5" />}
                  title="Issuer Verification"
                  description="Verify employer addresses directly on Blockscout explorer"
                />
              </div>
            </div>
          </div>

          <div className="mt-20">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-2">See Blockscout in Action</h3>
              <p className="text-text-secondary">Watch how transaction transparency works in WorkPassport</p>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-5xl">
                <div className="rounded-2xl overflow-hidden border border-border bg-bg-primary" style={{ paddingBottom: '56.25%', position: 'relative', height: 0 }}>
                  <iframe 
                    src="https://www.loom.com/embed/0b6780bbc65e4aa1b9e5ff760ab7ab34" 
                    frameBorder="0" 
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  />
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
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-bg-secondary border border-border flex items-center justify-center text-blue-400">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold mb-1">{title}</h4>
        <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function TransactionPreview({ type, from, to, status }: { type: string; from: string; to: string; status: 'success' | 'pending' }) {
  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-bg-secondary/30">
      <div>
        <div className="text-sm font-medium mb-1">{type}</div>
        <div className="text-xs text-text-secondary">
          {from} → {to}
        </div>
      </div>
      <div className={`px-2 py-1 rounded text-xs font-medium ${
        status === 'success' 
          ? 'bg-green-500/10 text-green-500' 
          : 'bg-yellow-500/10 text-yellow-500'
      }`}>
        {status === 'success' ? '✓ Success' : '⏳ Pending'}
      </div>
    </div>
  )
}