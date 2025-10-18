'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Credential } from '@/types/credentials'
import { FileText } from 'lucide-react'

export default function WorkerPage() {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [address, setAddress] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [githubData, setGithubData] = useState<{ user: { login: string }, repos: any[] } | null>(null)
  const [githubLoading, setGithubLoading] = useState(false)


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

  const fetchGitHubData = async () => {
  setGithubLoading(true)
  try {
    const response = await fetch('/api/auth/github/repos')
    if (response.ok) {
      const data = await response.json()
      setGithubData(data)
    }
  } catch (error) {
    console.error('Failed to fetch GitHub data:', error)
  }
  setGithubLoading(false)
}

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Work Passport</h1>
          <p className="text-text-secondary">Manage your verifiable credentials</p>
        </div>

        <div className="mb-6">
  {!githubData ? (
    <button
      onClick={fetchGitHubData}
      disabled={githubLoading}
      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
    >
      {githubLoading ? 'Loading...' : 'Load GitHub Data'}
    </button>
  ) : (
    <div className="p-4 border border-border rounded-lg bg-bg-secondary">
      <p className="text-sm">Connected as: <span className="font-semibold">{githubData.user.login}</span></p>
      <p className="text-sm text-text-secondary">{githubData.repos.length} repositories found</p>
    </div>
  )}
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
