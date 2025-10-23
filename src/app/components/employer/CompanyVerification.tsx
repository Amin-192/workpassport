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

      const response = await fetch('/api/verify-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId: data.id,
          companyName: formData.companyName,
          website: formData.website,
          linkedinUrl: formData.linkedinUrl
        })
      })

      if (!response.ok) {
        throw new Error('Verification request failed')
      }

      alert('Verification request submitted! AI is checking your company...')
      setShowForm(false)
      checkVerificationStatus()
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
            <h3 className="text-lg font-semibold">Company Verified</h3>
            <p className="text-sm text-text-secondary">
              {verification.company_name} • Verified {new Date(verification.verified_at!).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="text-sm text-text-secondary">
          Your company has been verified. You can now issue credentials with a verified badge.
        </div>
      </div>
    )
  }

  if (verification?.status === 'pending') {
    return (
      <div className="border border-yellow-500/50 rounded-xl p-6 bg-yellow-500/5">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-6 h-6 text-yellow-500" />
          <div>
            <h3 className="text-lg font-semibold">Verification Pending</h3>
            <p className="text-sm text-text-secondary">
              {verification.company_name} • Submitted {new Date(verification.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="text-sm text-text-secondary">
          Your verification request is being reviewed. This usually takes a few minutes.
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
          <div className="mb-4 text-sm text-text-secondary">
            Reason: {verification.rejection_reason}
          </div>
        )}
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
        >
          Request Verification Again
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
              Verify your company to issue credentials with a trusted badge
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
        >
          Verify Company
        </button>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-6 h-6" />
        <h3 className="text-lg font-semibold">Verify Your Company</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Company Name</label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
            placeholder="TechCorp Kenya Ltd"
            required
            className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-white transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Company Website</label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({...formData, website: e.target.value})}
            placeholder="https://techcorp.co.ke"
            required
            className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-white transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">LinkedIn Profile (Optional)</label>
          <input
            type="url"
            value={formData.linkedinUrl}
            onChange={(e) => setFormData({...formData, linkedinUrl: e.target.value})}
            placeholder="https://linkedin.com/company/techcorp"
            className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-white transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Business Registration Number (Optional)</label>
          <input
            type="text"
            value={formData.businessRegistration}
            onChange={(e) => setFormData({...formData, businessRegistration: e.target.value})}
            placeholder="PVT-ABC123456"
            className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-white transition-colors"
          />
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
            ) : 'Submit for Verification'}
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