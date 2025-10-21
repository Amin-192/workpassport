'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ethers } from 'ethers'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import RoleSelector from '../components/RoleSelector'
import EmployerSidebar from '../components/employer/EmployerSidebar'
import IssueCredentialView from '../components/employer/IssueCredentialView'

export default function EmployerPage() {
  const router = useRouter()
  const [address, setAddress] = useState<string>('')
  const [showRoleSelector, setShowRoleSelector] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [activeView, setActiveView] = useState<'dashboard' | 'issue' | 'all'>('issue')

  useEffect(() => {
    checkExistingConnection()
  }, [router])

  const checkExistingConnection = async () => {
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
      
      localStorage.setItem(`role_${address}`, role)
      window.dispatchEvent(new Event('storage'))
      
      if (role === 'worker') {
        router.push('/worker')
      } else {
        setShowRoleSelector(false)
        setPageLoading(false)
      }
    } catch (error) {
      console.error('Failed to save role:', error)
      alert('Failed to save role. Please try again.')
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
    <div className="flex min-h-screen bg-bg-primary text-text-primary">
      <EmployerSidebar activeView={activeView} onChangeView={setActiveView} />
      
      <div className="flex-1 p-12">
        {activeView === 'issue' && (
          <IssueCredentialView 
            issuerAddress={address}
            onCredentialIssued={() => {
              // Refresh or show success
            }}
          />
        )}
        
        {activeView === 'dashboard' && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
            
          </div>
        )}
        
        {activeView === 'all' && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">All Credentials</h2>
            
          </div>
        )}
      </div>
    </div>
  )
}