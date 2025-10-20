'use client'
import { useEffect, useState } from 'react'
import Link from "next/link"
import Image from "next/image"
import WalletConnect from "../WalletConnect"

export default function Navigation() {
  const [userRole, setUserRole] = useState<'worker' | 'employer' | null>(null)

  useEffect(() => {
    const role = localStorage.getItem('userRole') as 'worker' | 'employer' | null
    setUserRole(role)
  }, [])

  return (
    <nav className="border-border bg-bg-primary">
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