'use client'
import { LayoutDashboard, PenSquare, FileText, Lock } from 'lucide-react'

interface EmployerSidebarProps {
  activeView: 'dashboard' | 'issue' | 'all'
  onChangeView: (view: 'dashboard' | 'issue' | 'all') => void
  isVerified: boolean
}

export default function EmployerSidebar({ activeView, onChangeView, isVerified }: EmployerSidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'issue', label: 'Issue Credential', icon: PenSquare, requiresVerification: true },
    { id: 'all', label: 'All Credentials', icon: FileText }
  ]

  return (
    <div className="w-64 border-r border-border bg-bg-primary h-screen sticky top-0">
      <div className="p-6">
        <h2 className="text-lg font-bold mb-6">Employer Portal</h2>
        
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            const isLocked = item.requiresVerification && !isVerified
            
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id as any)}
                disabled={isLocked}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-white text-black'
                    : isLocked
                    ? 'text-text-secondary/50 cursor-not-allowed'
                    : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium flex-1 text-left">{item.label}</span>
                {isLocked && <Lock className="w-4 h-4" />}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}