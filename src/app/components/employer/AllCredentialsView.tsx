'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ethers } from 'ethers'
import { ESCROW_ADDRESS, ESCROW_ABI } from '@/lib/contract'
import { Search, Loader2, DollarSign, CheckCircle2, Clock } from 'lucide-react'

interface AllCredentialsViewProps {
  issuerAddress: string
}

interface CredentialWithPayment {
  id: string
  worker_address: string
  position: string
  company: string
  start_date: string
  end_date: string | null
  skills: string[]
  created_at: string
  credential_hash: string
  paymentAmount?: string
  paymentClaimed?: boolean
}

export default function AllCredentialsView({ issuerAddress }: AllCredentialsViewProps) {
  const [credentials, setCredentials] = useState<CredentialWithPayment[]>([])
  const [filteredCredentials, setFilteredCredentials] = useState<CredentialWithPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadCredentials()
  }, [issuerAddress])

  useEffect(() => {
    filterCredentials()
  }, [searchQuery, credentials])

  const loadCredentials = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('credentials')
        .select('*')
        .ilike('issuer_address', issuerAddress)
        .order('created_at', { ascending: false })

      if (!error && data) {
        const credsWithPayment = await Promise.all(
          data.map(async (cred) => {
            let paymentAmount = undefined
            let paymentClaimed = undefined

            if (typeof window.ethereum !== 'undefined') {
              try {
                const provider = new ethers.BrowserProvider(window.ethereum)
                const escrow = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, provider)
                const [, amount, claimed] = await escrow.getEscrow(cred.worker_address, cred.credential_hash)
                
                if (amount > BigInt(0)) {
                  paymentAmount = ethers.formatUnits(amount, 6)
                  paymentClaimed = claimed
                }
              } catch (e) {
                // No payment for this credential
              }
            }

            return {
              ...cred,
              paymentAmount,
              paymentClaimed
            }
          })
        )

        setCredentials(credsWithPayment)
        setFilteredCredentials(credsWithPayment)
      }
    } catch (error) {
      console.error('Failed to load credentials:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterCredentials = () => {
    if (!searchQuery.trim()) {
      setFilteredCredentials(credentials)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = credentials.filter(cred => 
      cred.position.toLowerCase().includes(query) ||
      cred.company.toLowerCase().includes(query) ||
      cred.worker_address.toLowerCase().includes(query) ||
      cred.skills.some(skill => skill.toLowerCase().includes(query))
    )
    setFilteredCredentials(filtered)
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
        <h1 className="text-3xl font-bold mb-2">All Credentials</h1>
        <p className="text-text-secondary">Complete list of issued work credentials</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by position, company, worker address, or skills..."
            className="w-full pl-12 pr-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-white transition-colors"
          />
        </div>
      </div>

      <div className="mb-4 text-sm text-text-secondary">
        Showing {filteredCredentials.length} of {credentials.length} credentials
      </div>

      {filteredCredentials.length > 0 ? (
        <div className="space-y-4">
          {filteredCredentials.map((cred) => (
            <div
              key={cred.id}
              className="border border-border rounded-xl p-6 hover:border-text-secondary transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">{cred.position}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-text-secondary text-sm">{cred.company}</p>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/50 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-500">Verified</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-text-secondary mb-1">
                    {new Date(cred.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-text-secondary mb-1">Worker Address:</p>
                <p className="text-sm font-mono">{cred.worker_address}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-text-secondary mb-2">Duration:</p>
                <p className="text-sm">
                  {cred.start_date} → {cred.end_date || 'Present'}
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-text-secondary mb-2">Skills:</p>
                <div className="flex gap-2 flex-wrap">
                  {cred.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-bg-secondary border border-border rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {cred.paymentAmount && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img 
                        src="https://ethglobal.b-cdn.net/organizations/aezzh/square-logo/default.png" 
                        alt="PYUSD"
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">
                        {cred.paymentAmount} PYUSD
                      </span>
                    </div>
                    {cred.paymentClaimed ? (
                      <span className="text-xs text-green-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Payment claimed
                      </span>
                    ) : (
                      <span className="text-xs text-yellow-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Awaiting claim
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-xl p-12 text-center">
          <Search className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No credentials found</h3>
          <p className="text-sm text-text-secondary">
            {searchQuery ? 'Try a different search term' : 'Start by issuing credentials'}
          </p>
        </div>
      )}
    </div>
  )
}