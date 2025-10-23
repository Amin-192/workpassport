'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ethers } from 'ethers'
import { ESCROW_ADDRESS, ESCROW_ABI } from '@/lib/contract'
import { FileText, DollarSign, Users, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'

interface DashboardViewProps {
  issuerAddress: string
  onNavigate: (view: 'issue' | 'all') => void
}

export default function DashboardView({ issuerAddress, onNavigate }: DashboardViewProps) {
  const [stats, setStats] = useState({
    totalCredentials: 0,
    totalEscrowed: '0',
    totalWorkers: 0
  })
  const [recentCredentials, setRecentCredentials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    loadData()
    loadCompanyInfo()
  }, [issuerAddress])

  const loadCompanyInfo = async () => {
    try {
      const { data } = await supabase
        .from('company_verifications')
        .select('company_name, status')
        .eq('employer_address', issuerAddress.toLowerCase())
        .eq('status', 'verified')
        .single()

      if (data) {
        setCompanyName(data.company_name)
        setIsVerified(true)
      }
    } catch (error) {
      // No verified company
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: credentials, error } = await supabase
        .from('credentials')
        .select('*')
        .ilike('issuer_address', issuerAddress)
        .order('created_at', { ascending: false })

      if (!error && credentials) {
        const totalCredentials = credentials.length
        const uniqueWorkers = new Set(credentials.map(c => c.worker_address.toLowerCase())).size
        
        setRecentCredentials(credentials.slice(0, 5))

        let totalEscrowed = 0
        if (typeof window.ethereum !== 'undefined') {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const escrow = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, provider)
          
          for (const cred of credentials) {
            try {
              const [, amount, claimed] = await escrow.getEscrow(cred.worker_address, cred.credential_hash)
              if (!claimed && amount > BigInt(0)) {
                totalEscrowed += parseFloat(ethers.formatUnits(amount, 6))
              }
            } catch (e) {
              // Skip if escrow doesn't exist
            }
          }
        }

        setStats({
          totalCredentials,
          totalEscrowed: totalEscrowed.toFixed(2),
          totalWorkers: uniqueWorkers
        })
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-text-secondary" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
  {isVerified && companyName && (
    <div className="mb-4 flex items-center gap-3 p-4  border border-green-800 rounded-xl">
      <CheckCircle2 className="w-6 h-6 " />
      <div>
        <h2 className="text-xl font-bold ">{companyName}</h2>
        <p className="text-sm text-green-500/80">Verified Company</p>
      </div>
    </div>
  )}
  <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
  <p className="text-text-secondary">Overview of your issued credentials</p>
</div>

      {/* Rest of the component stays the same... */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 border border-border rounded-xl bg-bg-secondary/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-sm font-medium text-text-secondary">Total Credentials</h3>
          </div>
          <div className="text-3xl font-bold">{stats.totalCredentials}</div>
        </div>

        <div className="p-6 border border-border rounded-xl bg-bg-secondary/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-sm font-medium text-text-secondary">PYUSD Escrowed</h3>
          </div>
          <div className="text-3xl font-bold">{stats.totalEscrowed}</div>
          <p className="text-xs text-text-secondary mt-1">Unclaimed payments</p>
        </div>

        <div className="p-6 border border-border rounded-xl bg-bg-secondary/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-sm font-medium text-text-secondary">Workers Verified</h3>
          </div>
          <div className="text-3xl font-bold">{stats.totalWorkers}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <button
          onClick={() => onNavigate('issue')}
          className="p-6 border border-border rounded-xl hover:border-white transition-colors text-left group"
        >
          <h3 className="text-lg font-semibold mb-2 flex items-center justify-between">
            Issue New Credential
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-sm text-text-secondary">
            Create and sign a new work credential for a worker
          </p>
        </button>

        <button
          onClick={() => onNavigate('all')}
          className="p-6 border border-border rounded-xl hover:border-white transition-colors text-left group"
        >
          <h3 className="text-lg font-semibold mb-2 flex items-center justify-between">
            View All Credentials
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-sm text-text-secondary">
            See complete list of all issued credentials
          </p>
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Activity</h2>
          <button
            onClick={() => onNavigate('all')}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            View all →
          </button>
        </div>

        {recentCredentials.length > 0 ? (
          <div className="space-y-3">
            {recentCredentials.map((cred) => (
              <div
                key={cred.id}
                className="p-4 border border-border rounded-lg hover:border-text-secondary transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{cred.position}</h4>
                    <p className="text-sm text-text-secondary">{cred.company}</p>
                  </div>
                  <span className="text-xs text-text-secondary">
                    {new Date(cred.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <span>Worker: {cred.worker_address.slice(0, 6)}...{cred.worker_address.slice(-4)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-border rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No credentials yet</h3>
            <p className="text-sm text-text-secondary mb-4">
              Start by issuing your first credential
            </p>
            <button
              onClick={() => onNavigate('issue')}
              className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Issue Credential
            </button>
          </div>
        )}
      </div>
    </div>
  )
}