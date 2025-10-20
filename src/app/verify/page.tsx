'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Credential } from '@/types/credentials'
import { ethers } from 'ethers'
import { CheckCircle2, XCircle, Search, FileX, Shield, Github, Loader2 } from 'lucide-react'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'
import { CREDENTIAL_TYPES, DOMAIN } from '@/lib/eip712'

export default function VerifyPage() {
  const [address, setAddress] = useState('')
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState<{[key: string]: boolean}>({})
  const [onChainVerified, setOnChainVerified] = useState<{[key: string]: boolean}>({})

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

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!address) return

    setLoading(true)
    setVerified({})
    setOnChainVerified({})
    
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .ilike('worker_address', address)

    if (!error && data) {
      setCredentials(data)
      
      if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask for full verification!')
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
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Verify Credentials</h1>
          </div>
          <p className="text-text-secondary">Check the authenticity of a worker&apos;s credentials on-chain and cryptographically</p>
        </div>

        {/* Search Section */}
        <div className="border border-border rounded-xl p-8 mb-8 bg-bg-secondary/20">
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Worker Wallet Address</label>
              <input 
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-white transition-colors"
              />
            </div>

            <button 
              type="submit"
              disabled={loading || !address}
              className="w-full px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying credentials...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Verify Credentials
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {credentials.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Found {credentials.length} credential{credentials.length > 1 ? 's' : ''}
              </h2>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-text-secondary">Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-text-secondary">Invalid</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {credentials.map((cred) => {
                const isGitHubCredential = cred.company.includes('GitHub (@')
                const signatureValid = verified[cred.id]
                const onChainValid = onChainVerified[cred.id]
                const fullyVerified = signatureValid && onChainValid

                return (
                  <div 
                    key={cred.id} 
                    className={`border rounded-xl p-6 transition-all ${
                      fullyVerified 
                        ? 'border-green-500/50 bg-green-500/5' 
                        : 'border-border'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        {isGitHubCredential && (
                          <Github className="w-5 h-5 text-text-secondary" />
                        )}
                        <div>
                          <h3 className="text-lg font-semibold">{cred.position}</h3>
                          <p className="text-text-secondary text-sm">{cred.company}</p>
                          <p className="text-xs text-text-secondary mt-1">
                            Issued by: {cred.issuer_address.slice(0, 6)}...{cred.issuer_address.slice(-4)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {signatureValid ? (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                              <span className="text-sm text-green-500 font-medium">Signature Valid</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-5 h-5 text-red-500" />
                              <span className="text-sm text-red-500 font-medium">Invalid Signature</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {onChainValid ? (
                            <>
                              <Shield className="w-5 h-5 text-green-500" />
                              <span className="text-sm text-green-500 font-medium">On-Chain Verified</span>
                            </>
                          ) : (
                            <>
                              <Shield className="w-5 h-5 text-red-500" />
                              <span className="text-sm text-red-500 font-medium">Not On-Chain</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="text-sm text-text-secondary">
                        {cred.start_date} - {cred.end_date || 'Present'}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {cred.skills.slice(0, 3).map((skill: string, i: number) => (
                          <span 
                            key={i}
                            className="px-3 py-1 bg-bg-secondary border border-border rounded-full text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                        {cred.skills.length > 3 && (
                          <span className="px-3 py-1 bg-bg-secondary border border-border rounded-full text-xs">
                            +{cred.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : address && !loading ? (
          <div className="border border-border rounded-xl p-12 text-center">
            <FileX className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No credentials found</h3>
            <p className="text-sm text-text-secondary">This address has no verified credentials in the system</p>
          </div>
        ) : (
          <div className="border border-border rounded-xl p-12 text-center">
            <Search className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to verify</h3>
            <p className="text-sm text-text-secondary">Enter a worker&apos;s wallet address above to check their credentials</p>
          </div>
        )}
      </div>
    </div>
  )
}
