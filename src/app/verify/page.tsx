'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Credential } from '@/types/credentials'
import { ethers } from 'ethers'
import { CheckCircle2, XCircle, Search, FileX, Shield } from 'lucide-react'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'
import { CREDENTIAL_TYPES, DOMAIN } from '@/lib/eip712'

export default function VerifyPage() {
  const [address, setAddress] = useState('')
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState<{[key: string]: boolean}>({})
  const [onChainVerified, setOnChainVerified] = useState<{[key: string]: boolean}>({})

  useEffect(() => {
    const loadWalletAddress = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const accounts = await provider.send("eth_requestAccounts", [])
          if (accounts[0]) {
            setAddress(accounts[0])
            handleVerify(accounts[0])
          }
        } catch (error) {
          console.error('Failed to load wallet:', error)
        }
      }
    }
    
    loadWalletAddress()
  }, [])

  const verifyCredential = async (cred: Credential) => {
    try {
      const message = JSON.parse(cred.signed_message)
      const recoveredAddress = ethers.verifyTypedData(
        DOMAIN,
        CREDENTIAL_TYPES,
        message,
        cred.signature
      )
      return recoveredAddress.toLowerCase() === cred.issuer_address.toLowerCase()
    } catch (error) {
      console.error('Verification error:', error)
      return false
    }
  }

  const verifyOnChain = async (cred: Credential, provider: ethers.BrowserProvider) => {
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
      const count = await contract.getCredentialCount(cred.worker_address)
      
      for (let i = 0; i < count; i++) {
        const [hash] = await contract.getCredential(cred.worker_address, i)
        if (hash === cred.credential_hash) {
          return true
        }
      }
      return false
    } catch (error) {
      console.error('On-chain verification error:', error)
      return false
    }
  }

  const handleVerify = async (walletAddress?: string) => {
    const addressToVerify = walletAddress || address
    if (!addressToVerify) return

    setLoading(true)
    setVerified({})
    setOnChainVerified({})
    
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .ilike('worker_address', addressToVerify)

    if (!error && data) {
      setCredentials(data)
      
      if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask!')
        setLoading(false)
        return
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum)
      
      const verificationResults: {[key: string]: boolean} = {}
      const onChainResults: {[key: string]: boolean} = {}
      
      for (const cred of data) {
        verificationResults[cred.id] = await verifyCredential(cred)
        onChainResults[cred.id] = await verifyOnChain(cred, provider)
      }
      
      setVerified(verificationResults)
      setOnChainVerified(onChainResults)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Verify Credentials</h1>
          <p className="text-text-secondary">Check the authenticity of a worker&apos;s credentials</p>
        </div>

        <div className="border border-border rounded-xl p-8 mb-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Worker Address</label>
              <input 
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-text-secondary transition-colors"
              />
            </div>

            <button 
              onClick={() => handleVerify()}
              disabled={loading}
              className="w-full px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Credentials'}
            </button>
          </div>
        </div>

        {credentials.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              Found {credentials.length} credential{credentials.length > 1 ? 's' : ''}
            </h2>
            {credentials.map((cred) => {
              const isGitHubCredential = cred.company.includes('GitHub (@')
              
              if (isGitHubCredential) {
                return (
                  <div key={cred.id} className="border border-border rounded-xl p-6 bg-gradient-to-br from-bg-secondary/50 to-bg-secondary/20">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        <div>
                          <h3 className="text-lg font-semibold">GitHub Profile Connected</h3>
                          <p className="text-sm text-text-secondary">{cred.company}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {verified[cred.id] ? (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                              <span className="text-sm text-green-500">Signature Valid</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-5 h-5 text-red-500" />
                              <span className="text-sm text-red-500">Invalid Signature</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {onChainVerified[cred.id] ? (
                            <>
                              <Shield className="w-5 h-5 text-green-500" />
                              <span className="text-sm text-green-500">On-Chain Verified</span>
                            </>
                          ) : (
                            <>
                              <Shield className="w-5 h-5 text-red-500" />
                              <span className="text-sm text-red-500">Not On-Chain</span>
                            </>
                          )}
                        </div>
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
                        <p className="text-sm text-text-secondary mt-1">
                          Issued by: {cred.issuer_address.slice(0, 6)}...{cred.issuer_address.slice(-4)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {verified[cred.id] ? (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                              <span className="text-sm text-green-500">Signature Valid</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-5 h-5 text-red-500" />
                              <span className="text-sm text-red-500">Invalid Signature</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {onChainVerified[cred.id] ? (
                            <>
                              <Shield className="w-5 h-5 text-green-500" />
                              <span className="text-sm text-green-500">On-Chain Verified</span>
                            </>
                          ) : (
                            <>
                              <Shield className="w-5 h-5 text-red-500" />
                              <span className="text-sm text-red-500">Not On-Chain</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-text-secondary mb-3">
                      {cred.start_date} - {cred.end_date || 'Present'}
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
        ) : address && !loading ? (
          <div className="border border-border rounded-xl p-12 text-center">
            <FileX className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No credentials found</h3>
            <p className="text-sm text-text-secondary">This address has no verified credentials</p>
          </div>
        ) : (
          <div className="border border-border rounded-xl p-12 text-center">
            <Search className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results yet</h3>
            <p className="text-sm text-text-secondary">Enter a worker address to verify their credentials</p>
          </div>
        )}
      </div>
    </div>
  )
}