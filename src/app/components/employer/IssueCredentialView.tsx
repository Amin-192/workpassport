'use client'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { supabase } from '@/lib/supabase'
import { CONTRACT_ADDRESS, CONTRACT_ABI, ESCROW_ADDRESS, ESCROW_ABI, PYUSD_ADDRESS, PYUSD_ABI } from '@/lib/contract'
import { CREDENTIAL_TYPES, DOMAIN, createCredentialMessage } from '@/lib/eip712'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { encryptCredentialField } from '@/lib/litEncryption'

interface IssueCredentialViewProps {
  issuerAddress: string
  onCredentialIssued?: () => void
}

export default function IssueCredentialView({ issuerAddress, onCredentialIssued }: IssueCredentialViewProps) {
  const [formData, setFormData] = useState({
    workerAddress: '',
    position: '',
    company: '',
    startDate: '',
    endDate: '',
    skills: '',
    paymentAmount: '',
    salary: ''
  })
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [status, setStatus] = useState('')
  const [verifiedCompanyName, setVerifiedCompanyName] = useState<string>('')

  useEffect(() => {
    loadVerifiedCompany()
  }, [issuerAddress])

  const loadVerifiedCompany = async () => {
    try {
      const { data } = await supabase
        .from('company_verifications')
        .select('company_name')
        .eq('employer_address', issuerAddress.toLowerCase())
        .eq('status', 'verified')
        .single()

      if (data) {
        setVerifiedCompanyName(data.company_name)
        setFormData(prev => ({ ...prev, company: data.company_name }))
      }
    } catch (error) {
      // No verified company
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTxHash('')
    setStatus('')

    try {
      if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask!')
        return
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      const createdAt = new Date().toISOString()

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

      let salaryEncrypted = null
      if (formData.salary && formData.salary.trim() !== '') {
        setStatus('Encrypting salary with Lit Protocol...')
        salaryEncrypted = await encryptCredentialField(
          formData.salary,
          formData.workerAddress
        )
      }

      setStatus('Signing credential...')
      const message = createCredentialMessage(credential)
      const signature = await signer.signTypedData(DOMAIN, CREDENTIAL_TYPES, message)
      const credentialHash = ethers.TypedDataEncoder.hash(DOMAIN, CREDENTIAL_TYPES, message)
      const signedMessage = JSON.stringify(message)

      setStatus('Storing credential on blockchain...')
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const tx = await contract.issueCredential(formData.workerAddress, credentialHash)
      await tx.wait()
      setTxHash(tx.hash)

      if (formData.paymentAmount && parseFloat(formData.paymentAmount) > 0) {
        setStatus('Processing PYUSD payment...')
        
        const amount = ethers.parseUnits(formData.paymentAmount, 6)
        
        setStatus('Approving PYUSD...')
        const pyusd = new ethers.Contract(PYUSD_ADDRESS, PYUSD_ABI, signer)
        const approveTx = await pyusd.approve(ESCROW_ADDRESS, amount)
        await approveTx.wait()
        
        setStatus('Depositing to escrow...')
        const escrow = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, signer)
        const depositTx = await escrow.depositPayment(
          formData.workerAddress,
          credentialHash,
          amount
        )
        await depositTx.wait()
      }

      setStatus('Saving to database...')
      const { error } = await supabase
        .from('credentials')
        .insert([{
          ...credential,
          credential_hash: credentialHash,
          signature: signature,
          signed_message: signedMessage,
          salary_encrypted: salaryEncrypted
        }])

      if (error) throw error

      setStatus('Success!')
      alert('Credential issued successfully!')
      setFormData({
        workerAddress: '',
        position: '',
        company: verifiedCompanyName,
        startDate: '',
        endDate: '',
        skills: '',
        paymentAmount: '',
        salary: ''
      })
      
      if (onCredentialIssued) onCredentialIssued()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert('Failed to issue credential: ' + message)
    } finally {
      setLoading(false)
      setStatus('')
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Issue Credential</h1>
        <p className="text-text-secondary">Sign work credentials and escrow payment for your workers</p>
      </div>

      {status && (
        <div className="mb-6 p-4 border border-blue-500/50 rounded-lg bg-blue-500/10 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <p className="text-sm font-medium text-blue-500">{status}</p>
        </div>
      )}

      {txHash && (
        <div className="mb-6 p-4 border border-green-500/50 rounded-lg bg-green-500/10">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <p className="text-sm font-medium text-green-500">Transaction successful!</p>
          </div>
          <a 
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-text-secondary hover:text-text-primary underline"
          >
            View on Etherscan →
          </a>
        </div>
      )}

      <div className="border border-border rounded-xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Worker Wallet Address</label>
            <input 
              type="text"
              value={formData.workerAddress}
              onChange={(e) => setFormData({...formData, workerAddress: e.target.value})}
              placeholder="0x..."
              required
              className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Position</label>
              <input 
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                placeholder="Senior Developer"
                required
                className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-white transition-colors"
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
                className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-white transition-colors"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input 
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                required
                className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date (Optional)</label>
              <input 
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-white transition-colors"
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
              className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Salary (Optional)</label>
            <input 
              type="text"
              value={formData.salary}
              onChange={(e) => setFormData({...formData, salary: e.target.value})}
              placeholder="$150,000"
              className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-white transition-colors"
            />
            <p className="text-xs text-text-secondary mt-1">Will be encrypted with Lit Protocol - only worker can decrypt</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Payment Amount (PYUSD) - Optional</label>
            <input 
              type="number"
              step="0.01"
              value={formData.paymentAmount}
              onChange={(e) => setFormData({...formData, paymentAmount: e.target.value})}
              placeholder="100.00"
              className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-white transition-colors"
            />
            <p className="text-xs text-text-secondary mt-1">Funds will be escrowed until the worker claims</p>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {status || 'Processing...'}
              </span>
            ) : 'Sign & Issue Credential'}
          </button>
        </form>
      </div>
    </div>
  )
}