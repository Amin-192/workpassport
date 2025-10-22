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