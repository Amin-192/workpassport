'use client'
import Link from 'next/link'
import { Github, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold mb-3">WorkPassport</h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              Verifiable work credentials on the blockchain. Built for the remote work era.
            </p>
            
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li><Link href="/worker" className="hover:text-white transition-colors">For Workers</Link></li>
              <li><Link href="/employer" className="hover:text-white transition-colors">For Employers</Link></li>
              <li><Link href="/verify" className="hover:text-white transition-colors">Verify Credentials</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li><a href="https://github.com/amin-192/workpassport" className="hover:text-white transition-colors">GitHub</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-text-secondary">
              © 2025 WorkPassport. 
            </div>

            <div className="flex items-center gap-6">
              <span className="text-xs text-text-secondary">Powered by</span>
              <div className="flex items-center gap-4">
                <a 
                  href="https://paxos.com/pyusd/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="opacity-60 hover:opacity-100 transition-opacity"
                >
                  <img 
                    src="https://ethglobal.b-cdn.net/organizations/aezzh/square-logo/default.png"
                    alt="PYUSD"
                    className="w-6 h-6"
                  />
                </a>
                <a 
                  href="https://blockscout.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="opacity-60 hover:opacity-100 transition-opacity"
                >
                  <img 
                    src="https://ethglobal.b-cdn.net/organizations/8kguf/square-logo/default.png"
                    alt="Blockscout"
                    className="w-6 h-6"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}