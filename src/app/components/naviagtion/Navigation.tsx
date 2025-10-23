'use client'
import { useEffect, useState } from 'react'
import Link from "next/link"
import Image from "next/image"
import WalletConnect from "../WalletConnect"
import { ethers } from 'ethers'
import { supabase } from '@/lib/supabase'

export default function Navigation() {
  const [userRole, setUserRole] = useState<'worker' | 'employer' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkRole()
    
    const handleStorageChange = () => {
      checkRole()
    }
    
    const handleDisconnect = () => {
      setUserRole(null)
    }
    
    const handleFocus = () => {
      checkRole()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('wallet-disconnected', handleDisconnect)
    window.addEventListener('focus', handleFocus)
    
    if (typeof window.ethereum !== 'undefined' && window.ethereum.on) {
      const handleAccountsChanged = (...args: unknown[]) => {
        const accounts = args[0] as string[]
        if (accounts.length === 0) {
          setUserRole(null)
        } else {
          checkRole()
        }
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      
      return () => {
        window.removeEventListener('storage', handleStorageChange)
        window.removeEventListener('wallet-disconnected', handleDisconnect)
        window.removeEventListener('focus', handleFocus)
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        }
      }
    }
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('wallet-disconnected', handleDisconnect)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const checkRole = async () => {
    const hasDisconnected = sessionStorage.getItem('wallet_disconnected')
    if (hasDisconnected) {
      setUserRole(null)
      setLoading(false)
      return
    }

    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()
        
        if (accounts.length > 0) {
          const address = await accounts[0].getAddress()
          
          const { data } = await supabase
            .from('wallet_roles')
            .select('role')
            .eq('wallet_address', address.toLowerCase())
            .single()
          
          if (data) {
            setUserRole(data.role as 'worker' | 'employer')
            // Sync to localStorage
            localStorage.setItem(`role_${address}`, data.role)
          } else {
            setUserRole(null)
          }
        } else {
          setUserRole(null)
        }
      } catch (error) {
        console.error('Failed to check role:', error)
        setUserRole(null)
      }
    } else {
      setUserRole(null)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <nav className=" border-border bg-bg-primary">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center group">
              <Image src="/logo.png" alt="WorkPassport" width={50} height={50} />
              <Image src="/workpassport.png" alt="WorkPassport" width={190} height={90} />
            </Link>
            <div className="h-10 w-32 bg-bg-secondary animate-pulse rounded-lg"></div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className=" bg-bg-primary">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center group">
            <Image src="/logo.png" alt="WorkPassport" width={50} height={50} />
            <Image src="/workpassport.png" alt="WorkPassport" width={190} height={90} />
          </Link>
                   
          <div className="flex gap-1 items-center">
            {userRole === 'worker' && (
              <Link 
                href="/worker" 
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
              >
                Dashboard
              </Link>
            )}
            
            {userRole === 'employer' && (
              <Link 
                href="/employer" 
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
              >
                Issue Credentials
              </Link>
            )}

            {!userRole && (
              <>
                <Link 
                  href="/worker" 
                  className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
                >
                  Workers
                </Link>
                <Link 
                  href="/employer" 
                  className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
                >
                  Employers
                </Link>
              </>
            )}

            <Link 
              href="/verify" 
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
            >
              Verify
            </Link>
                         
            <div className="w-px h-5 bg-border mx-2"></div>
                         
            <WalletConnect />
          </div>
        </div>
      </div>
    </nav>
  )
}