'use client'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import Problem from './components/Problem'
import PyusdSection from './components/PyusdSection'
import BlockscoutSection from './components/BlockscoutSection'
import Footer from './components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen text-text-primary">
      <section className="relative px-6 pt-38 pb-40 overflow-hidden ">
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-block mb-4 px-3 py-1 border border-border rounded-full text-xs text-text-secondary tracking-wide">
              ETHOnline 2025
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              Your work history,
              <br />
              <span className="text-text-secondary">cryptographically proven</span>
            </h1>
            
            <p className="text-xl text-text-secondary mb-8 max-w-2xl">
              Verifiable credentials for remote workers. No more background checks, 
              no international verification delays. Just cryptographic proof.
            </p>
            
            <div className="flex gap-4">
              <Link 
                href="/worker"
                className="group px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors inline-flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="/verify"
                className="px-6 py-3 border border-border rounded-lg font-medium hover:border-text-secondary hover:bg-bg-secondary transition-colors"
              >
                Verify Credentials
              </Link>
            </div>
          </motion.div>
        </div>

        
    
      </section>

      <Problem />
      <HowItWorks />
      <Features />
      <PyusdSection />
      <BlockscoutSection />
      <Footer />
    </div>
  )
}