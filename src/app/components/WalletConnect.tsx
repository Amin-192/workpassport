'use client'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { LogOut } from 'lucide-react'

export default function WalletConnect() {
  const [address, setAddress] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    checkConnection()
    
    // Listen for account changes
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (...args: unknown[]) => {
        const accounts = args[0] as string[]
        if (accounts.length === 0) {
          handleDisconnect()
        } else {
          setAddress(accounts[0])
          window.location.reload()
        }
      }

      const handleChainChanged = () => {
        window.location.reload()
      }

      window.ethereum.on?.('accountsChanged', handleAccountsChanged)
      window.ethereum.on?.('chainChanged', handleChainChanged)

      return () => {
        window.ethereum.removeListener?.('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener?.('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const handleDisconnect = () => {
    setAddress(null)
    // Clear all role data
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('role_')) {
        localStorage.removeItem(key)
      }
    })
    window.location.href = '/'
  }

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()
        if (accounts.length > 0) {
          setAddress(await accounts[0].getAddress())
        }
      } catch (error) {
        console.error('Failed to check connection:', error)
      }
    }
  }

  const connect = async () => {
    setConnecting(true)
    try {
      if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask!')
        return
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send("eth_requestAccounts", [])
      setAddress(accounts[0])
      window.location.reload()
    } catch (error) {
      console.error('Failed to connect:', error)
    } finally {
      setConnecting(false)
    }
  }

  const disconnect = () => {
    handleDisconnect()
  }

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <div className="px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary">
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <button
          onClick={disconnect}
          className="px-3 py-2 text-sm text-text-secondary hover:text-red-500 hover:bg-bg-secondary rounded-lg transition-colors flex items-center gap-1"
          title="Disconnect Wallet"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={connect}
      disabled={connecting}
      className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
    >
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  )
}