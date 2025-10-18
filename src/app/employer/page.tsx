'use client'
import { useState } from 'react'
import { ethers } from 'ethers'
import { supabase } from '@/lib/supabase'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'
import { CREDENTIAL_TYPES, DOMAIN, createCredentialMessage } from '@/lib/eip712'
export default function EmployerPage() {
  const [formData, setFormData] = useState({
    workerAddress: '',
    position: '',
    company: '',
    startDate: '',
    endDate: '',
    skills: ''
  })
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTxHash('')

    try {
      if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask!')
        return
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()
      const issuerAddress = await signer.getAddress()

      const createdAt = new Date().toISOString()

      // Create credential object
      const credential = {
        worker_address: formData.workerAddress,
        issuer_address: issuerAddress,
        position: formData.position,
        company: formData.company,
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        skills: formData.skills.split(',').map(s => s.trim()),
        created_at: createdAt
      }

      /// Sign credential with EIP-712
      const message = createCredentialMessage(credential)
      const signature = await signer.signTypedData(DOMAIN, CREDENTIAL_TYPES, message)

      // Generate hash from typed data
      const credentialHash = ethers.TypedDataEncoder.hash(DOMAIN, CREDENTIAL_TYPES, message)
      const signedMessage = JSON.stringify(message)

      // Store hash on blockchain
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const tx = await contract.issueCredential(formData.workerAddress, credentialHash)
      await tx.wait()
      
      setTxHash(tx.hash)

      // Save to Supabase
      const { error } = await supabase
        .from('credentials')
        .insert([{
          ...credential,
          credential_hash: credentialHash,
          signature: signature,
         signed_message: signedMessage 
        }])

      if (error) throw error

      alert('Credential issued successfully!')
      setFormData({
        workerAddress: '',
        position: '',
        company: '',
        startDate: '',
        endDate: '',
        skills: ''
      })
    } catch (error: unknown) {
     const message = error instanceof Error ? error.message : 'Unknown error'
      alert('Failed to issue credential: ' + message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Issue Credentials</h1>
          <p className="text-text-secondary">Sign work credentials for your employees</p>
        </div>

        {txHash && (
          <div className="mb-6 p-4 border border-border rounded-lg bg-bg-secondary">
            <p className="text-sm">Transaction successful!</p>
            <a 
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-secondary hover:text-text-primary"
            >
              View on Etherscan →
            </a>
          </div>
        )}

        <div className="border border-border rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Worker Address</label>
              <input 
                type="text"
                value={formData.workerAddress}
                onChange={(e) => setFormData({...formData, workerAddress: e.target.value})}
                placeholder="0x..."
                required
                className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-text-secondary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Position</label>
              <input 
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                placeholder="Senior Developer"
                required
                className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-text-secondary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Company</label>
              <input 
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                placeholder="TechCorp Kenya"
                required
                className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-text-secondary transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input 
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-text-secondary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input 
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-text-secondary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Skills (comma separated)</label>
              <input 
                type="text"
                value={formData.skills}
                onChange={(e) => setFormData({...formData, skills: e.target.value})}
                placeholder="React, Node.js, Solidity"
                required
                className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-text-secondary transition-colors"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing & Storing on Blockchain...' : 'Sign & Issue Credential'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}