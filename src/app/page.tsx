import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <section className="relative px-6 pt-32 pb-24">
        <div className="max-w-4xl mx-auto">
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
        </div>

        <div className="absolute inset-0 -z-10 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, rgb(39 39 42) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(39 39 42) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px'
          }} />
        </div>
      </section>

      <Features />
      <HowItWorks />
    </div>
  )
}