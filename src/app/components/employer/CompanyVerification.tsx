'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, XCircle, Clock, Loader2, Building2, AlertCircle } from 'lucide-react'

interface CompanyVerificationProps {
  employerAddress: string
}

interface Verification {
  id: string
  company_name: string
  website: string
  linkedin_url: string | null
  business_registration: string | null
  status: 'pending' | 'verified' | 'rejected'
  verified_at: string | null
  rejection_reason: string | null
  created_at: string
}

export default function CompanyVerification({ employerAddress }: CompanyVerificationProps) {
  const [verification, setVerification] = useState<Verification | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    website: '',
    linkedinUrl: '',
    businessRegistration: ''
  })

  useEffect(() => {
    checkVerificationStatus()
    
    // Set up real-time subscription for status updates
    const subscription = supabase
      .channel('company_verification_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'company_verifications',
          filter: `employer_address=eq.${employerAddress.toLowerCase()}`
        },
        (payload) => {
          setVerification(payload.new as Verification)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [employerAddress])

  const checkVerificationStatus = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('company_verifications')
        .select('*')
        .eq('employer_address', employerAddress.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!error && data) {
        setVerification(data)
      }
    } catch (error) {
      console.error('Failed to check verification:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('company_verifications')
        .insert([{
          employer_address: employerAddress.toLowerCase(),
          company_name: formData.companyName,
          website: formData.website,
          linkedin_url: formData.linkedinUrl || null,
          business_registration: formData.businessRegistration || null,
          status: 'pending'
        }])
        .select()
        .single()

      if (error) throw error

      alert('Verification submitted! AI is reviewing your company (usually takes 15-30 seconds)...')
      setShowForm(false)
      setVerification(data)
    } catch (error) {
      console.error('Submission failed:', error)
      alert('Failed to submit verification request')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="border border-border rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-text-secondary" />
        </div>
      </div>
    )
  }

  if (verification?.status === 'verified') {
    return (
      <div className="border border-green-500/50 rounded-xl p-6 bg-green-500/5">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
          <div>
            <h3 className="text-lg font-semibold">Company Verified ✓</h3>
            <p className="text-sm text-text-secondary">
              {verification.company_name} • Verified {new Date(verification.verified_at!).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="text-sm text-text-secondary">
          Your company has been verified by AI. You can now issue credentials with a verified badge.
        </div>
      </div>
    )
  }

  if (verification?.status === 'pending') {
    return (
      <div className="border border-yellow-500/50 rounded-xl p-6 bg-yellow-500/5">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-6 h-6 text-yellow-500 animate-pulse" />
          <div>
            <h3 className="text-lg font-semibold">AI Verification in Progress...</h3>
            <p className="text-sm text-text-secondary">
              {verification.company_name} • Submitted {new Date(verification.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="text-sm text-text-secondary mb-3">
          Our AI agent is verifying your company details. This usually takes 15-30 seconds.
        </div>
        <div className="flex items-center gap-2 text-xs text-yellow-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Checking company legitimacy...</span>
        </div>
      </div>
    )
  }

  if (verification?.status === 'rejected') {
    return (
      <div className="border border-red-500/50 rounded-xl p-6 bg-red-500/5">
        <div className="flex items-center gap-3 mb-4">
          <XCircle className="w-6 h-6 text-red-500" />
          <div>
            <h3 className="text-lg font-semibold">Verification Rejected</h3>
            <p className="text-sm text-text-secondary">
              {verification.company_name}
            </p>
          </div>
        </div>
        {verification.rejection_reason && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
            <strong>AI Analysis:</strong> {verification.rejection_reason}
          </div>
        )}
        <button
          onClick={() => {
            setShowForm(true)
            setFormData({
              companyName: '',
              website: '',
              linkedinUrl: '',
              businessRegistration: ''
            })
          }}
          className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
        >
          Submit New Verification Request
        </button>
      </div>
    )
  }

  if (!showForm) {
    return (
      <div className="border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-yellow-500" />
          <div>
            <h3 className="text-lg font-semibold">Company Not Verified</h3>
            <p className="text-sm text-text-secondary">
              Verify your company with AI to unlock credential issuance
            </p>
          </div>
        </div>
        <div className="mb-4 text-sm text-text-secondary">
          Our AI agent will verify your company details in real-time (15-30 seconds)
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
        >
          Start Verification
        </button>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-6 h-6" />
        <div>
          <h3 className="text-lg font-semibold">Verify Your Company</h3>
          <p className="text-xs text-text-secondary">AI will verify your company automatically</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
            placeholder="TechCorp Kenya Ltd"
            required
            className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-white transition-colors"
          />
          <p className="text-xs text-text-secondary mt-1">Use your official registered company name</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Company Website <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({...formData, website: e.target.value})}
            placeholder="https://techcorp.co.ke"
            required
            className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-white transition-colors"
          />
          <p className="text-xs text-text-secondary mt-1">Must be a valid, active website</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">LinkedIn Company Page</label>
          <input
            type="url"
            value={formData.linkedinUrl}
            onChange={(e) => setFormData({...formData, linkedinUrl: e.target.value})}
            placeholder="https://linkedin.com/company/techcorp"
            className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-white transition-colors"
          />
          <p className="text-xs text-text-secondary mt-1">Optional but recommended for faster verification</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Business Registration Number</label>
          <input
            type="text"
            value={formData.businessRegistration}
            onChange={(e) => setFormData({...formData, businessRegistration: e.target.value})}
            placeholder="PVT-ABC123456"
            className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-white transition-colors"
          />
          <p className="text-xs text-text-secondary mt-1">Optional</p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-3">
          <p className="text-xs text-blue-400">
            💡 Our AI will verify your company in 15-30 seconds by checking your website and company information
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </span>
            ) : 'Submit for AI Verification'}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-bg-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}