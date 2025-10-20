'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Credential } from '@/types/credentials'
import { FileText, CheckCircle2, Github, Star, Loader2, User, Briefcase } from 'lucide-react'
import { generateGitHubCredential } from '@/lib/generateCredential'
import { ethers } from 'ethers'
import { CREDENTIAL_TYPES, DOMAIN, createCredentialMessage } from '@/lib/eip712'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getCachedGitHubData, setCachedGitHubData } from '@/lib/githubCache'
import { ESCROW_ADDRESS, ESCROW_ABI } from '@/lib/contract'

export default function WorkerPage() {
  const router = useRouter()
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [address, setAddress] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showRoleSelector, setShowRoleSelector] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'worker' | 'employer' | null>(null)
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
            const walletAddress = accounts[0]
            setAddress(walletAddress)
            
            // Check if this wallet already has a role
            const storedRole = localStorage.getItem(`role_${walletAddress}`)
            
            if (storedRole) {
              // Role already set for this wallet
              if (storedRole === 'employer') {
                // This wallet is an employer, redirect
                router.push('/employer')
                return
              }
              // Continue as worker
              await fetchCredentials(walletAddress)
              fetchGitHubData(walletAddress)
            } else {
              // No role set, need to choose
              setShowRoleSelector(true)
              setLoading(false)
            }
          }
        } catch (error) {
          console.error('Failed to load wallet:', error)
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }
    
    loadWalletAddress()
  }, [router])

  const handleRoleSelect = async (role: 'worker' | 'employer') => {
    if (!address) return
    
    // Store role permanently for this wallet
    localStorage.setItem(`role_${address}`, role)
    
    if (role === 'employer') {
      router.push('/employer')
    } else {
      setShowRoleSelector(false)
      setLoading(true)
      await fetchCredentials(address)
      fetchGitHubData(address)
    }
  }

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

  const autoGenerateGitHubCredential = async (githubData: any, walletAddress: string) => {
    try {
      const { data: existing } = await supabase
        .from('credentials')
        .select('*')
        .ilike('worker_address', walletAddress)
        .ilike('company', '%GitHub (@%')
      
      if (existing && existing.length > 0) {
        return
      }
      
      const credential = generateGitHubCredential(githubData, walletAddress)
      
      if (typeof window.ethereum === 'undefined') return
      
      const provider = new ethers.BrowserProvider(window.ethereum)
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
      
      await supabase.from('credentials').insert([{
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
      
      fetchCredentials(walletAddress)
      
    } catch (error) {
      console.error('Failed to auto-generate credential:', error)
    }
  }

  const fetchGitHubData = async (walletAddress: string) => {
    const cached = getCachedGitHubData(walletAddress)
    
    if (cached) {
      setGithubData(cached)
      setGithubLoading(false)
    } else {
      setGithubLoading(true)
    }
    
    try {
      const response = await fetch('/api/auth/github/repos')
      
      if (response.ok) {
        const freshData = await response.json()
        
        setGithubData(freshData)
        setCachedGitHubData(walletAddress, freshData)
        
        await autoGenerateGitHubCredential(freshData, walletAddress)
      }
    } catch (error) {
      console.error('Failed to fetch GitHub data:', error)
    } finally {
      setGithubLoading(false)
    }
  }

  const ClaimButton = ({ cred }: { cred: Credential }) => {
    const [claiming, setClaiming] = useState(false)
    const [escrowInfo, setEscrowInfo] = useState<{amount: string, claimed: boolean} | null>(null)

    useEffect(() => {
      checkEscrow()
    }, [])

    const checkEscrow = async () => {
      if (typeof window.ethereum === 'undefined') return
      
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const escrow = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, provider)
        const [, amount, claimed] = await escrow.getEscrow(cred.worker_address, cred.credential_hash)
        
        if (amount > BigInt(0)) {
          setEscrowInfo({
            amount: ethers.formatUnits(amount, 6),
            claimed
          })
        }
      } catch (error) {
        console.error('Failed to check escrow:', error)
      }
    }

    const handleClaim = async () => {
      setClaiming(true)
      try {
        if (typeof window.ethereum === 'undefined') {
          alert('Please install MetaMask!')
          return
        }
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        const escrow = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, signer)
        
        const tx = await escrow.claimPayment(cred.credential_hash)
        await tx.wait()
        
        alert('Payment claimed successfully!')
        checkEscrow()
      } catch (error) {
        console.error('Claim failed:', error)
        alert('Failed to claim payment')
      } finally {
        setClaiming(false)
      }
    }

    if (!escrowInfo || escrowInfo.amount === '0') return null

    return (
      <div className="mt-4 pt-4 border-t border-border">
        {escrowInfo.claimed ? (
          <div className="flex items-center gap-2 text-green-500 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Payment claimed: {escrowInfo.amount} PYUSD</span>
          </div>
        ) : (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {claiming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Claiming...
              </>
            ) : (
              `Claim ${escrowInfo.amount} PYUSD`
            )}
          </button>
        )}
      </div>
    )
  }

  const SkeletonCard = () => (
    <div className="border border-border rounded-xl p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2 flex-1">
          <div className="h-6 bg-bg-secondary rounded w-1/3"></div>
          <div className="h-4 bg-bg-secondary rounded w-1/4"></div>
        </div>
        <div className="h-4 bg-bg-secondary rounded w-32"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-8 bg-bg-secondary rounded-full w-20"></div>
        <div className="h-8 bg-bg-secondary rounded-full w-24"></div>
        <div className="h-8 bg-bg-secondary rounded-full w-16"></div>
      </div>
    </div>
  )

  // Role Selector Modal
  if (showRoleSelector) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
        <div className="bg-bg-primary border border-border rounded-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-2">Choose Your Role</h2>
          <p className="text-text-secondary text-sm mb-2">
            Select how you'll use WorkPassport
          </p>
          <p className="text-yellow-500 text-xs mb-6">
            ⚠️ This choice is permanent for this wallet address
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setSelectedRole('worker')}
              className={`p-6 border-2 rounded-xl transition-all ${
                selectedRole === 'worker'
                  ? 'border-white bg-white/5'
                  : 'border-border hover:border-text-secondary'
              }`}
            >
              <User className="w-8 h-8 mx-auto mb-3" />
              <div className="font-semibold mb-1">Worker</div>
              <div className="text-xs text-text-secondary">
                Manage credentials
              </div>
            </button>

            <button
              onClick={() => setSelectedRole('employer')}
              className={`p-6 border-2 rounded-xl transition-all ${
                selectedRole === 'employer'
                  ? 'border-white bg-white/5'
                  : 'border-border hover:border-text-secondary'
              }`}
            >
              <Briefcase className="w-8 h-8 mx-auto mb-3" />
              <div className="font-semibold mb-1">Employer</div>
              <div className="text-xs text-text-secondary">
                Issue credentials
              </div>
            </button>
          </div>

          <button
            onClick={() => selectedRole && handleRoleSelect(selectedRole)}
            disabled={!selectedRole}
            className="w-full px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Role
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Work Passport</h1>
          <p className="text-text-secondary">Manage your verifiable credentials and work history</p>
        </div>

        {/* GitHub Section */}
        <div className="mb-8">
          {githubLoading ? (
            <div className="border border-border rounded-xl p-6 animate-pulse">
              <div className="h-8 bg-bg-secondary rounded w-48 mb-4"></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-24 bg-bg-secondary rounded"></div>
                <div className="h-24 bg-bg-secondary rounded"></div>
                <div className="h-24 bg-bg-secondary rounded"></div>
              </div>
            </div>
          ) : !githubData ? (
            <a 
              href="/api/auth/github"
              className="flex items-center gap-3 px-6 py-4 border border-border hover:border-text-secondary rounded-xl transition-all group"
            >
              <Github className="w-6 h-6 group-hover:text-text-primary transition-colors" />
              <div>
                <h3 className="font-semibold">Connect GitHub</h3>
                <p className="text-sm text-text-secondary">Automatically generate credentials from your repositories</p>
              </div>
            </a>
          ) : (
            <div className="border border-border rounded-xl p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-bg-secondary border border-border flex items-center justify-center">
                  <Github className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">GitHub Profile</h3>
                  <p className="text-sm text-text-secondary">@{githubData.user.login}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 border border-border rounded-lg bg-bg-secondary/30">
                  <div className="text-2xl font-bold mb-1">{githubData.repos.length}</div>
                  <div className="text-xs text-text-secondary">Repositories</div>
                </div>
                <div className="p-4 border border-border rounded-lg bg-bg-secondary/30">
                  <div className="text-2xl font-bold mb-1">{githubData.totalCommits}+</div>
                  <div className="text-xs text-text-secondary">Commits</div>
                </div>
                <div className="p-4 border border-border rounded-lg bg-bg-secondary/30">
                  <div className="text-2xl font-bold mb-1">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {new Set(githubData.repos.map((r: any) => r.language).filter(Boolean)).size}
                  </div>
                  <div className="text-xs text-text-secondary">Languages</div>
                </div>
                <div className="p-4 border border-border rounded-lg bg-bg-secondary/30">
                  <div className="text-2xl font-bold mb-1">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {githubData.repos.reduce((sum: number, r: any) => sum + (r.stargazers_count || 0), 0)}
                  </div>
                  <div className="text-xs text-text-secondary flex items-center gap-1">
                    <Star className="w-3 h-3" /> Stars
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div className="mb-6">
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

              {/* Contribution Graph */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Contribution Activity (Last 12 Months)</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={githubData.contributionsTimeline}>
                    <XAxis 
                      dataKey="month" 
                      stroke="#71717a"
                      style={{ fontSize: '11px' }}
                    />
                    <YAxis 
                      stroke="#71717a"
                      style={{ fontSize: '11px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#18181b', 
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    />
                    <Bar dataKey="commits" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-6 border border-border rounded-xl bg-bg-secondary/30">
            <div className="text-3xl font-bold mb-1">{credentials.length}</div>
            <div className="text-sm text-text-secondary">Total Credentials</div>
          </div>
          <div className="p-6 border border-border rounded-xl bg-bg-secondary/30">
            <div className="text-3xl font-bold mb-1">
              {new Set(credentials.map(c => c.issuer_address)).size}
            </div>
            <div className="text-sm text-text-secondary">Employers</div>
          </div>
        </div>

        {/* Credentials */}
        {loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : credentials.length > 0 ? (
          <div className="space-y-4">
            {credentials.map((cred) => {
              const isGitHubCredential = cred.company.includes('GitHub (@')
              
              return (
                <div 
                  key={cred.id} 
                  className="border border-border rounded-xl p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {isGitHubCredential && (
                        <Github className="w-5 h-5 text-text-secondary" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold">{cred.position}</h3>
                        <p className="text-text-secondary text-sm">{cred.company}</p>
                      </div>
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
                  {!isGitHubCredential && <ClaimButton cred={cred} />}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="border border-border rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No credentials yet</h3>
            <p className="text-sm text-text-secondary">Connect your GitHub or wait for employers to issue credentials</p>
          </div>
        )}
      </div>
    </div>
  )
}