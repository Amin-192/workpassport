'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ethers } from 'ethers'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { useTransactionPopup } from '@blockscout/app-sdk'
import RoleSelector from '../components/RoleSelector'
import EmployerSidebar from '../components/employer/EmployerSidebar'
import DashboardView from '../components/employer/DashboardView'
import IssueCredentialView from '../components/employer/IssueCredentialView'
import AllCredentialsView from '../components/employer/AllCredentialsView'
import CompanyVerification from '../components/employer/CompanyVerification'

export default function EmployerPage() {
  const router = useRouter()
  const [address, setAddress] = useState<string>('')
  const [showRoleSelector, setShowRoleSelector] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [activeView, setActiveView] = useState<'dashboard' | 'issue' | 'all'>('dashboard')
  const [isVerified, setIsVerified] = useState(false)
  const [verificationLoading, setVerificationLoading] = useState(true)
  const { openPopup } = useTransactionPopup()

  useEffect(() => {
    checkExistingConnection()
  }, [router])

  useEffect(() => {
    if (address) {
      checkVerification()
      
      // Subscribe to verification changes
      const subscription = supabase
        .channel('employer_verification_updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'company_verifications',
            filter: `employer_address=eq.${address.toLowerCase()}`
          },
          (payload) => {
            if (payload.new.status === 'verified') {
              setIsVerified(true)
            } else {
              setIsVerified(false)
            }
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [address])

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
        setPageLoading(false)
      }
    } else {
      setPageLoading(false)
    }
  }

  const checkVerification = async () => {
    setVerificationLoading(true)
    try {
      const { data, error } = await supabase
        .from('company_verifications')
        .select('status')
        .eq('employer_address', address.toLowerCase())
        .eq('status', 'verified')
        .single()

      if (!error && data) {
        setIsVerified(true)
      } else {
        setIsVerified(false)
      }
    } catch (error) {
      setIsVerified(false)
    } finally {
      setVerificationLoading(false)
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
      alert('Failed to save role. Please try again.')
    }
  }

  const handleViewTransactionHistory = () => {
    openPopup({
      chainId: "11155111",
      address: address,
    })
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
              Click &quot;Connect Wallet&quot; in the top right corner
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (showRoleSelector) {
    return <RoleSelector onSelectRole={handleRoleSelect} />
  }

  if (pageLoading || verificationLoading) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-text-secondary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary">
      <EmployerSidebar 
        activeView={activeView} 
        onChangeView={setActiveView}
        isVerified={isVerified}
      />
      
      <div className="flex-1 p-12">
        <div className="flex justify-end mb-6">
          <button
            onClick={handleViewTransactionHistory}
            className="flex items-center gap-2 px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary border border-border rounded-lg transition-all"
          >
            <img 
              src="https://ethglobal.b-cdn.net/organizations/8kguf/square-logo/default.png" 
              alt="Blockscout"
              className="w-4 h-4"
            />
            <span>Transaction History</span>
          </button>
        </div>

        {activeView === 'dashboard' && (
          <>
            {!isVerified && (
              <div className="mb-8">
                <CompanyVerification employerAddress={address} />
              </div>
            )}
            <DashboardView 
              issuerAddress={address}
              onNavigate={setActiveView}
            />
          </>
        )}

        {activeView === 'issue' && (
          <>
            {!isVerified ? (
              <div className="max-w-4xl">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold mb-2">Issue Credential</h1>
                  <p className="text-text-secondary">Verify your company first to issue credentials</p>
                </div>
                <CompanyVerification employerAddress={address} />
              </div>
            ) : (
              <IssueCredentialView 
                issuerAddress={address}
                onCredentialIssued={() => {
                  setActiveView('dashboard')
                }}
              />
            )}
          </>
        )}
        
        {activeView === 'all' && (
          <AllCredentialsView issuerAddress={address} />
        )}
      </div>
    </div>
  )
}