'use client'
import { LayoutDashboard, PenSquare, FileText, Lock } from 'lucide-react'

interface EmployerSidebarProps {
  activeView: 'dashboard' | 'issue' | 'all'
  onChangeView: (view: 'dashboard' | 'issue' | 'all') => void
  isVerified: boolean
}

export default function EmployerSidebar({ activeView, onChangeView, isVerified }: EmployerSidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, locked: false },
    { id: 'issue', label: 'Issue Credential', icon: PenSquare, locked: !isVerified },
    { id: 'all', label: 'All Credentials', icon: FileText, locked: false }
  ]

  return (
    <div className="w-64 border-r border-border bg-bg-primary h-screen sticky top-0">
      <div className="p-6">
        <h2 className="text-lg font-bold mb-6">Employer Portal</h2>
        
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.locked ? Lock : item.icon
            const isActive = activeView === item.id
            const isDisabled = item.locked
            
            return (
              <button
                key={item.id}
                onClick={() => !isDisabled && onChangeView(item.id as any)}
                disabled={isDisabled}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isDisabled
                    ? 'text-text-secondary opacity-50 cursor-not-allowed'
                    : isActive
                    ? 'bg-white text-black'
                    : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium flex-1 text-left">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}