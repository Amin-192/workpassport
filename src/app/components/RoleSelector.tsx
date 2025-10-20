'use client'
import { useState } from 'react'
import { User, Briefcase } from 'lucide-react'

interface RoleSelectorProps {
  onSelectRole: (role: 'worker' | 'employer') => void
}

export default function RoleSelector({ onSelectRole }: RoleSelectorProps) {
  const [selected, setSelected] = useState<'worker' | 'employer' | null>(null)

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-primary border border-border rounded-xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-2">Choose Your Role</h2>
        <p className="text-text-secondary text-sm mb-6">
          Select how you'll use WorkPassport
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setSelected('worker')}
            className={`p-6 border-2 rounded-xl transition-all ${
              selected === 'worker'
                ? 'border-white bg-white/5'
                : 'border-border hover:border-text-secondary'
            }`}
          >
            <User className="w-8 h-8 mx-auto mb-3" />
            <div className="font-semibold mb-1">Worker</div>
            <div className="text-xs text-text-secondary">
              Manage credentials
            </div>
          </button>

          <button
            onClick={() => setSelected('employer')}
            className={`p-6 border-2 rounded-xl transition-all ${
              selected === 'employer'
                ? 'border-white bg-white/5'
                : 'border-border hover:border-text-secondary'
            }`}
          >
            <Briefcase className="w-8 h-8 mx-auto mb-3" />
            <div className="font-semibold mb-1">Employer</div>
            <div className="text-xs text-text-secondary">
              Issue credentials
            </div>
          </button>
        </div>

        <button
          onClick={() => selected && onSelectRole(selected)}
          disabled={!selected}
          className="w-full px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  )
}