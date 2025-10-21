'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ethers } from 'ethers'
import { supabase } from '@/lib/supabase'
import { CONTRACT_ADDRESS, CONTRACT_ABI, ESCROW_ADDRESS, ESCROW_ABI, PYUSD_ADDRESS, PYUSD_ABI } from '@/lib/contract'
import { CREDENTIAL_TYPES, DOMAIN, createCredentialMessage } from '@/lib/eip712'
import { Briefcase, CheckCircle2, Loader2 } from 'lucide-react'
import RoleSelector from '../components/RoleSelector'

export default function EmployerPage() {
  const router = useRouter()
  const [address, setAddress] = useState<string>('')
  const [showRoleSelector, setShowRoleSelector] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [formData, setFormData] = useState({
    workerAddress: '',
    position: '',
    company: '',
    startDate: '',
    endDate: '',
    skills: '',
    paymentAmount: ''
  })
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [status, setStatus] = useState('')
  const [recentCredentials, setRecentCredentials] = useState<any[]>([])
  const [loadingRecent, setLoadingRecent] = useState(true)

  useEffect(() => {
    checkExistingConnection()
  }, [router])

  const checkExistingConnection = async () => {
    // Check if user explicitly disconnected
    const hasDisconnected = sessionStorage.getItem('wallet_disconnected')
    if (hasDisconnected) {
      setPageLoading(false)
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
            
            if (role === 'worker') {
              router.push('/worker')
              return
            }
            setPageLoading(false)
            loadRecentCredentials(walletAddress)
          } else {
            setShowRoleSelector(true)
            setPageLoading(false)
          }
        } else {
          setPageLoading(false)
        }
      } catch (error) {
        console.error('Failed to check connection:', error)
        setPageLoading(false)
      }
    } else {
      setPageLoading(false)
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
      
      // Store in localStorage for quick access
      localStorage.setItem(`role_${address}`, role)
      
      // Trigger storage event for navigation update
      window.dispatchEvent(new Event('storage'))
      
      if (role === 'worker') {
        router.push('/worker')
      } else {
        setShowRoleSelector(false)
        setPageLoading(false)
        loadRecentCredentials(address)
      }
    } catch (error) {
      console.error('Failed to save role:', error)
      alert('Failed to save role. Please try again.')
    }
  }

  const loadRecentCredentials = async (issuerAddress?: string) => {
    setLoadingRecent(true)
    
    try {
      let targetAddress = issuerAddress
      
      if (!targetAddress) {
        if (typeof window.ethereum === 'undefined') {
          setLoadingRecent(false)
          return
        }
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        targetAddress = await signer.getAddress()
      }

      const { data, error } = await supabase
        .from('credentials')
        .select('*')
        .ilike('issuer_address', targetAddress)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!error && data) {
        setRecentCredentials(data)
      }
    } catch (error) {
      console.error('Failed to load recent credentials:', error)
    } finally {
      setLoadingRecent(false)
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
      await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()
      const issuerAddress = await signer.getAddress()

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
          signed_message: signedMessage
        }])

      if (error) throw error

      setStatus('Success!')
      alert('Credential issued successfully!')
      setFormData({
        workerAddress: '',
        position: '',
        company: '',
        startDate: '',
        endDate: '',
        skills: '',
        paymentAmount: ''
      })
      
      loadRecentCredentials()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert('Failed to issue credential: ' + message)
    } finally {
      setLoading(false)
      setStatus('')
    }
  }

  if (!address && !showRoleSelector && !pageLoading) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="border border-border rounded-xl p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-text-secondary mb-6">
              Please connect your wallet to issue credentials
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

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-text-secondary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Issue Credentials</h1>
          </div>
          <p className="text-text-secondary">Sign work credentials and escrow payment for your workers</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
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

          {/* Recent Activity Section */}
          <div className="lg:col-span-1">
            <div className="border border-border rounded-xl p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">Recent Credentials</h3>
              
              {loadingRecent ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-3 border border-border rounded-lg animate-pulse">
                      <div className="h-4 bg-bg-secondary rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-bg-secondary rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentCredentials.length > 0 ? (
                <div className="space-y-3">
                  {recentCredentials.map((cred) => (
                    <div key={cred.id} className="p-3 border border-border rounded-lg hover:border-text-secondary transition-colors">
                      <h4 className="font-medium text-sm mb-1">{cred.position}</h4>
                      <p className="text-xs text-text-secondary">{cred.company}</p>
                      <p className="text-xs text-text-secondary mt-1">
                        {cred.worker_address.slice(0, 6)}...{cred.worker_address.slice(-4)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No credentials issued yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}