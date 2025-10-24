'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Credential } from '@/types/credentials'
import { FileText, CheckCircle2, Github, Star, Loader2, ExternalLink, QrCode, X } from 'lucide-react'
import { generateGitHubCredential } from '@/lib/generateCredential'
import { ethers } from 'ethers'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getCachedGitHubData, setCachedGitHubData } from '@/lib/githubCache'
import { ESCROW_ADDRESS, ESCROW_ABI } from '@/lib/contract'
import RoleSelector from '../components/RoleSelector'
import { useNotification, useTransactionPopup } from '@blockscout/app-sdk'
import { QRCodeSVG } from 'qrcode.react'

export default function WorkerPage() {
  const router = useRouter()
  const transactionPopup = useTransactionPopup()
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [address, setAddress] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showRoleSelector, setShowRoleSelector] = useState(false)
  const [showProfileQR, setShowProfileQR] = useState(false)
  const [githubData, setGithubData] = useState<{ 
    user: { login: string }, 
    repos: any[], 
    totalCommits: number,
    repoCommits: { [key: string]: number },
    contributionsTimeline: { month: string, commits: number }[]
  } | null>(null)
  const [githubLoading, setGithubLoading] = useState(false)

  useEffect(() => {
    checkExistingConnection()
  }, [router])

  const checkExistingConnection = async () => {
    const hasDisconnected = sessionStorage.getItem('wallet_disconnected')
    if (hasDisconnected) {
      setLoading(false)
      return
    }
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()
        
        if (accounts.length > 0) {
          const walletAddress = await accounts[0].getAddress()
          setAddress(walletAddress)
          
          const { data: dbRole } = await supabase
            .from('wallet_roles')
            .select('role')
            .eq('wallet_address', walletAddress.toLowerCase())
            .single()
          
          if (dbRole) {
            const role = dbRole.role
            
            localStorage.setItem(`role_${walletAddress}`, role)
            
            if (role === 'employer') {
              router.push('/employer')
              return
            }
            await fetchCredentials(walletAddress)
            fetchGitHubData(walletAddress)
          } else {
            setShowRoleSelector(true)
            setLoading(false)
          }
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Failed to check connection:', error)
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }

  const handleRoleSelect = async (role: 'worker' | 'employer') => {
    if (!address) return
    
    try {
      const { error } = await supabase
        .from('wallet_roles')
        .insert({
          wallet_address: address.toLowerCase(),
          role: role
        })
      
      if (error) {
        if (error.code === '23505') {
          alert('This wallet already has a role assigned.')
          window.location.reload()
          return
        }
        throw error
      }
      
      localStorage.setItem(`role_${address}`, role)
      
      window.dispatchEvent(new Event('storage'))
      
      if (role === 'employer') {
        router.push('/employer')
      } else {
        setShowRoleSelector(false)
        setLoading(true)
        await fetchCredentials(address)
        fetchGitHubData(address)
      }
    } catch (error) {
      console.error('Failed to save role:', error)
      alert('Failed to save role. Please try again.')
    }
  }

  const fetchCredentials = async (workerAddress: string) => {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .ilike('worker_address', workerAddress)
    
    if (!error && data) {
      const credentialsWithVerification = await Promise.all(
        data.map(async (cred) => {
          const { data: verification } = await supabase
            .from('company_verifications')
            .select('status')
            .eq('employer_address', cred.issuer_address.toLowerCase())
            .eq('status', 'verified')
            .single()
          
          return {
            ...cred,
            is_verified: !!verification
          }
        })
      )
      
      setCredentials(credentialsWithVerification)
    }
    setLoading(false)
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
        alert('Failed to claim payment. Please try again.')
      } finally {
        setClaiming(false)
      }
    }

    if (!escrowInfo) return null

    return (
      <div className="mt-4 pt-4 border-t border-border">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="https://ethglobal.b-cdn.net/organizations/aezzh/square-logo/default.png" 
              alt="PYUSD"
              className="w-5 h-5"
            />
            <span className="font-semibold">{escrowInfo.amount} PYUSD</span>
          </div>
          {escrowInfo.claimed ? (
            <span className="text-sm text-green-500 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Claimed
            </span>
          ) : (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="px-4 py-2 bg-white hover:bg-gray-700 text-black disabled:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {claiming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Claiming...
                </>
              ) : (
                'Claim Payment'
              )}
            </button>
          )}
        </div>
      </div>
    )
  }

  const SkeletonCard = () => (
    <div className="border border-border rounded-xl p-6 animate-pulse">
      <div className="h-6 bg-bg-secondary rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-bg-secondary rounded w-1/4 mb-4"></div>
      <div className="flex gap-2 mb-4">
        <div className="h-8 bg-bg-secondary rounded w-20"></div>
        <div className="h-8 bg-bg-secondary rounded w-20"></div>
      </div>
    </div>
  )

  if (!address && !showRoleSelector && !loading) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="border border-border rounded-xl p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-text-secondary mb-6">
              Please connect your wallet to access your Work Passport
            </p>
            <p className="text-sm text-text-secondary">
              Click "Connect Wallet" in the top right corner
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (showRoleSelector) {
    return <RoleSelector onSelectRole={handleRoleSelect} />
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Work Passport</h1>
            <p className="text-text-secondary">Manage your verifiable credentials and work history</p>
          </div>
          <div className="flex gap-2">
            {address && (
              <>
                <button
                  onClick={() => setShowProfileQR(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-border hover:border-text-secondary rounded-lg transition-colors text-sm"
                >
                  <QrCode className="w-4 h-4" />
                  Share Profile
                </button>
                <button
                  onClick={() => transactionPopup.openPopup({ chainId: '11155111', address })}
                  className="flex items-center gap-2 px-4 py-2 border border-border hover:border-text-secondary rounded-lg transition-colors text-sm"
                >
                  <img 
                    src="https://ethglobal.b-cdn.net/organizations/8kguf/square-logo/default.png" 
                    alt="Blockscout"
                    className="w-4 h-4"
                  />
                  Transaction History
                </button>
              </>
            )}
          </div>
        </div>

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
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-bg-secondary border border-border flex items-center justify-center">
                  <Github className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">GitHub Profile</h3>
                  <p className="text-sm text-text-secondary">@{githubData.user.login}</p>
                </div>
              </div>

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
                    {new Set(githubData.repos.map((r: any) => r.language).filter(Boolean)).size}
                  </div>
                  <div className="text-xs text-text-secondary">Languages</div>
                </div>
                <div className="p-4 border border-border rounded-lg bg-bg-secondary/30">
                  <div className="text-2xl font-bold mb-1">
                    {githubData.repos.reduce((sum: number, r: any) => sum + (r.stargazers_count || 0), 0)}
                  </div>
                  <div className="text-xs text-text-secondary flex items-center gap-1">
                    <Star className="w-3 h-3" /> Stars
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3">Top Languages</h4>
                <div className="flex gap-2 flex-wrap">
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

        {loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : credentials.length > 0 ? (
          <div className="space-y-4">
            {credentials.map((cred: any) => {
              const isGitHubCredential = cred.company.includes('GitHub (@')
              if (isGitHubCredential) return null
              
              return (
                <div 
                  key={cred.id} 
                  className="border border-border rounded-xl p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{cred.position}</h3>
                      <div className="flex items-center gap-2">
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
                  <ClaimButton cred={cred} />
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

      {/* Profile QR Modal */}
      {showProfileQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-primary border border-border rounded-xl p-8 max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Share Your Profile</h3>
              <button onClick={() => setShowProfileQR(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <QRCodeSVG 
                value={`${window.location.origin}/verify?address=${address}`}
                size={256}
                level="H"
              />
            </div>
            <p className="text-sm text-text-secondary text-center mt-4">
              Scan to view complete work history
            </p>
          </div>
        </div>
      )}
    </div>
  )
}