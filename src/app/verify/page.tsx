'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Credential } from '@/types/credentials'
import { ethers } from 'ethers'
import { CheckCircle2, XCircle, Search, FileX, Shield } from 'lucide-react'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'

export default function VerifyPage() {
  const [address, setAddress] = useState('')
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState<{[key: string]: boolean}>({})
  const [onChainVerified, setOnChainVerified] = useState<{[key: string]: boolean}>({})

  const verifyCredential = async (cred: Credential) => {
    try {
      const credential = {
        worker_address: cred.worker_address,
        issuer_address: cred.issuer_address,
        position: cred.position,
        company: cred.company,
        start_date: cred.start_date,
        end_date: cred.end_date,
        skills: cred.skills,
        created_at: cred.created_at
      }
      
      const message = JSON.stringify(credential)
      const recoveredAddress = ethers.verifyMessage(message, cred.signature)
      
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
      
      // Check all on-chain credentials for this worker
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

  const handleVerify = async () => {
    setLoading(true)
    setVerified({})
    setOnChainVerified({})
    
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('worker_address', address)

    if (!error && data) {
      setCredentials(data)
      
      // Connect to blockchain
      const provider = new ethers.BrowserProvider(window.ethereum)
      
      // Verify each credential
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
          <p className="text-text-secondary">Check the authenticity of a worker's credentials</p>
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
              onClick={handleVerify}
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
            {credentials.map((cred) => (
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
