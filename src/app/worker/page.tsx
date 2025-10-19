'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Credential } from '@/types/credentials'
import { FileText } from 'lucide-react'
import { generateGitHubCredential } from '@/lib/generateCredential'
import { ethers } from 'ethers'
import { CREDENTIAL_TYPES, DOMAIN, createCredentialMessage } from '@/lib/eip712'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getCachedGitHubData, setCachedGitHubData } from '@/lib/githubCache'

export default function WorkerPage() {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [address, setAddress] = useState<string>('')
  const [loading, setLoading] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [githubData, setGithubData] = useState<{ 
    user: { login: string }, 
    repos: any[], 
    totalCommits: number,
    repoCommits: { [key: string]: number },
    contributionsTimeline: { month: string, commits: number }[]
  } | null>(null)
  const [githubLoading, setGithubLoading] = useState(false)

  useEffect(() => {
    const loadWalletAddress = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const accounts = await provider.send("eth_requestAccounts", [])
          if (accounts[0]) {
            setAddress(accounts[0])
            fetchCredentials(accounts[0])
            fetchGitHubData(accounts[0])
          }
        } catch (error) {
          console.error('Failed to load wallet:', error)
        }
      }
    }
    
    loadWalletAddress()
  }, [])

  const fetchCredentials = async (workerAddress: string) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .ilike('worker_address', workerAddress)
    
    if (!error && data) {
      setCredentials(data)
    }
    setLoading(false)
  }

  const fetchGitHubData = async (walletAddress: string) => {
    // Check cache first with wallet address
    const cached = getCachedGitHubData(walletAddress)
    
    if (cached) {
      // Show cached data immediately!
      setGithubData(cached)
      setGithubLoading(false)
    } else {
      // No cache, show loading
      setGithubLoading(true)
    }
    
    // Fetch fresh data in background (whether cache exists or not)
    try {
      const response = await fetch('/api/auth/github/repos')
      
      if (response.ok) {
        const freshData = await response.json()
        
        // Update display with fresh data
        setGithubData(freshData)
        
        // Save to cache for next time
        setCachedGitHubData(walletAddress, freshData)
      }
    } catch (error) {
      console.error('Failed to fetch GitHub data:', error)
    } finally {
      setGithubLoading(false)
    }
  }

  const handleGenerateCredential = async () => {
    if (!githubData || !address) {
      alert('Please load GitHub data and enter your wallet address first')
      return
    }
    
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask!')
      return
    }

    try {
      setLoading(true)
      
      const credential = generateGitHubCredential(githubData, address)
      
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()
      
      const message = createCredentialMessage({
        worker_address: credential.worker_address,
        issuer_address: await signer.getAddress(),
        position: credential.position,
        company: credential.company,
        start_date: credential.start_date,
        end_date: credential.end_date,
        skills: credential.skills,
        created_at: new Date().toISOString()
      })
      
      const signature = await signer.signTypedData(DOMAIN, CREDENTIAL_TYPES, message)
      const credentialHash = ethers.TypedDataEncoder.hash(DOMAIN, CREDENTIAL_TYPES, message)
      
      const { error } = await supabase.from('credentials').insert([{
        worker_address: credential.worker_address,
        issuer_address: await signer.getAddress(),
        position: credential.position,
        company: credential.company,
        start_date: credential.start_date,
        end_date: credential.end_date || null,
        skills: credential.skills,
        created_at: new Date().toISOString(),
        credential_hash: credentialHash,
        signature: signature,
        signed_message: JSON.stringify(message)
      }])
      
      if (error) throw error
      
      alert('GitHub credential signed and stored successfully!')
      fetchCredentials(address)
    } catch (error: unknown) {
      console.error('Error:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert('Failed to sign credential: ' + message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Work Passport</h1>
          <p className="text-text-secondary">Manage your verifiable credentials</p>
        </div>

        <div className="mb-6">
          {githubLoading ? (
            <div className="px-6 py-3 border border-border rounded-lg text-center text-text-secondary">
              Loading GitHub data...
            </div>
          ) : !githubData ? (
            <a 
              href="/api/auth/github"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Connect GitHub Account
            </a>
          ) : (
            <div className="border border-border rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold mb-1">GitHub Profile</h3>
                  <p className="text-sm text-text-secondary">@{githubData.user.login}</p>
                </div>
                <button
                  onClick={handleGenerateCredential}
                  className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
                >
                  Generate Credential
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border border-border rounded-lg bg-bg-secondary/30">
                  <div className="text-2xl font-bold mb-1">{githubData.repos.length}</div>
                  <div className="text-sm text-text-secondary">Total Repositories</div>
                </div>
                <div className="p-4 border border-border rounded-lg bg-bg-secondary/30">
                  <div className="text-2xl font-bold mb-1">
                    {githubData.totalCommits}+
                  </div>
                  <div className="text-sm text-text-secondary">Total Commits</div>
                </div>
                <div className="p-4 border border-border rounded-lg bg-bg-secondary/30">
                  <div className="text-2xl font-bold mb-1">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {new Set(githubData.repos.map((r: any) => r.language).filter(Boolean)).size}
                  </div>
                  <div className="text-sm text-text-secondary">Languages Used</div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-3">Top Languages</h4>
                <div className="flex gap-2 flex-wrap">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {Array.from(new Set(githubData.repos.map((r: any) => r.language).filter(Boolean))).slice(0, 8).map((lang: any, i: number) => (
                    <span 
                      key={i}
                      className="px-3 py-1 bg-bg-secondary border border-border rounded-full text-sm"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-3">Contribution Activity (Last 12 Months)</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={githubData.contributionsTimeline}>
                    <XAxis 
                      dataKey="month" 
                      stroke="#71717a"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#71717a"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#18181b', 
                        border: '1px solid #27272a',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="commits" fill="#ffffff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
            {credentials.map((cred) => {
              const isGitHubCredential = cred.company.includes('GitHub (@')
              
              if (isGitHubCredential) {
                return (
                  <div key={cred.id} className="border border-border rounded-xl p-6 bg-gradient-to-br from-bg-secondary/50 to-bg-secondary/20">
                    <div className="flex items-center gap-3 mb-4">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      <div>
                        <h3 className="text-lg font-semibold">GitHub Profile Connected</h3>
                        <p className="text-sm text-text-secondary">{cred.company}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-bg-primary rounded-lg">
                        <div className="text-sm text-text-secondary">Languages</div>
                        <div className="text-lg font-semibold">{cred.skills.length}</div>
                      </div>
                      <div className="p-3 bg-bg-primary rounded-lg">
                        <div className="text-sm text-text-secondary">Skills</div>
                        <div className="flex gap-1 flex-wrap mt-1">
                          {cred.skills.slice(0, 3).map((skill: string, i: number) => (
                            <span key={i} className="text-xs px-2 py-1 bg-bg-secondary border border-border rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 bg-bg-primary rounded-lg">
                        <div className="text-sm text-text-secondary">Verified</div>
                        <div className="text-lg font-semibold">✓</div>
                      </div>
                    </div>
                  </div>
                )
              } else {
                return (
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
                )
              }
            })}
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