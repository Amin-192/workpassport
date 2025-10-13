'use client'
import { useState } from 'react'
import { ethers } from 'ethers'

export default function WalletConnect() {
  const [address, setAddress] = useState<string | null>(null)

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.send("eth_requestAccounts", [])
        setAddress(accounts[0])
      } catch (error) {
        console.error('Failed to connect wallet:', error)
      }
    } else {
      alert('Please install MetaMask!')
    }
  }

  return (
    <button 
      onClick={connectWallet}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
    </button>
  )
}