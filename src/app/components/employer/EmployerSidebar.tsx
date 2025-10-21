'use client'
import { LayoutDashboard, PenSquare, FileText } from 'lucide-react'

interface EmployerSidebarProps {
  activeView: 'dashboard' | 'issue' | 'all'
  onChangeView: (view: 'dashboard' | 'issue' | 'all') => void
}

export default function EmployerSidebar({ activeView, onChangeView }: EmployerSidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'issue', label: 'Issue Credential', icon: PenSquare },
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
            
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-white text-black'
                    : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}