'use client'
import { useState } from 'react'
import { encryptCredentialField, decryptCredentialField } from '@/lib/litEncryption'
import { ethers } from 'ethers'

export default function TestEncryption() {
  const [address, setAddress] = useState('')
  const [testData, setTestData] = useState('Secret salary: $150,000')
  const [encrypted, setEncrypted] = useState<any>(null)
  const [decrypted, setDecrypted] = useState('')
  const [loading, setLoading] = useState(false)

  const loadWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send("eth_requestAccounts", [])
      setAddress(accounts[0])
    }
  }

  const handleEncrypt = async () => {
    if (!address) {
      alert('Connect wallet first')
      return
    }
    
    setLoading(true)
    try {
      const result = await encryptCredentialField(testData, address)
      setEncrypted(result)
      alert('Encrypted successfully!')
    } catch (error) {
      console.error(error)
      alert('Encryption failed')
    }
    setLoading(false)
  }

  const handleDecrypt = async () => {
    if (!encrypted) {
      alert('Encrypt something first')
      return
    }
    
    setLoading(true)
    try {
      const result = await decryptCredentialField(
        encrypted.ciphertext,
        encrypted.dataToEncryptHash,
        encrypted.accessControlConditions
      )
      setDecrypted(result)
      alert('Decrypted successfully!')
    } catch (error) {
      console.error(error)
      alert('Decryption failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary p-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Lit Encryption</h1>
        
        <div className="space-y-4">
          <button
            onClick={loadWallet}
            className="px-6 py-3 bg-white text-black rounded-lg font-medium"
          >
            {address ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
          </button>

          <div>
            <label className="block mb-2">Data to Encrypt:</label>
            <input
              type="text"
              value={testData}
              onChange={(e) => setTestData(e.target.value)}
              className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg"
            />
          </div>

          <button
            onClick={handleEncrypt}
            disabled={loading || !address}
            className="px-6 py-3 bg-white text-black rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Encrypt'}
          </button>

          {encrypted && (
            <div className="p-4 bg-bg-secondary border border-border rounded-lg">
              <p className="text-sm text-green-500 mb-2">✓ Encrypted</p>
              <p className="text-xs break-all">{encrypted.ciphertext.substring(0, 100)}...</p>
            </div>
          )}

          <button
            onClick={handleDecrypt}
            disabled={loading || !encrypted}
            className="px-6 py-3 bg-white text-black rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Decrypt'}
          </button>

          {decrypted && (
            <div className="p-4 bg-bg-secondary border border-border rounded-lg">
              <p className="text-sm text-green-500 mb-2">✓ Decrypted</p>
              <p className="font-semibold">{decrypted}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}