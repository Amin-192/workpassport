'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Credential } from '@/types/credentials'
import { FileText } from 'lucide-react'

export default function WorkerPage() {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [address, setAddress] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const fetchCredentials = async (workerAddress: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('worker_address', workerAddress)
    
    if (!error && data) {
      setCredentials(data)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Work Passport</h1>
          <p className="text-text-secondary">Manage your verifiable credentials</p>
        </div>

        <div className="mb-6">
  <a 
    href="/api/auth/github"
    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
  >
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
    Connect GitHub Account
  </a>
</div>

        <div className="mb-8">
          <div className="flex gap-4">
            <input 
              type="text"
              placeholder="Enter your wallet address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="flex-1 px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-text-secondary transition-colors"
            />
            <button 
              onClick={() => fetchCredentials(address)}
              disabled={loading}
              className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load Credentials'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-6 border border-border rounded-xl bg-bg-secondary/30">
            <div className="text-3xl font-bold mb-1">{credentials.length}</div>
            <div className="text-sm text-text-secondary">Credentials</div>
          </div>
          <div className="p-6 border border-border rounded-xl bg-bg-secondary/30">
            <div className="text-3xl font-bold mb-1">
              {new Set(credentials.map(c => c.issuer_address)).size}
            </div>
            <div className="text-sm text-text-secondary">Employers</div>
          </div>
          <div className="p-6 border border-border rounded-xl bg-bg-secondary/30">
            <div className="text-3xl font-bold mb-1">0</div>
            <div className="text-sm text-text-secondary">Verifications</div>
          </div>
        </div>

        {credentials.length > 0 ? (
          <div className="space-y-4">
            {credentials.map((cred) => (
              <div key={cred.id} className="border border-border rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{cred.position}</h3>
                    <p className="text-text-secondary">{cred.company}</p>
                  </div>
                  <div className="text-sm text-text-secondary">
                    {cred.start_date} - {cred.end_date || 'Present'}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {cred.skills.map((skill: string, i: number) => (
                    <span 
                      key={i}
                      className="px-3 py-1 bg-bg-secondary border border-border rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-border rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No credentials yet</h3>
            <p className="text-sm text-text-secondary">Enter your address above to load credentials</p>
          </div>
        )}
      </div>
    </div>
  )
}
