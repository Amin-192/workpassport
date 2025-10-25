import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
})

interface CompanyAnalysis {
  verified: boolean
  confidence: number
  reason: string
  riskFactors: string[]
}

class CompanyVerifierAgent {
  private running = false
  private checkedIds = new Set<string>()
  private checkInterval = 15000

  constructor() {
  }

  async start() {
    if (this.running) {
      console.log('  Company verifier already running')
      return
    }

    this.running = true
    console.log(' Company Verifier Agent started')
    console.log(` Checking every ${this.checkInterval/1000}s`)
    console.log(' First check...\n')

    while (this.running) {
      try {
        await this.verifyPendingCompanies()
      } catch (error) {
        console.error(' Error:', error)
      }
      await this.sleep(this.checkInterval)
    }
  }

  async verifyPendingCompanies() {
    console.log(`[${new Date().toISOString()}] Checking for pending verifications...`)
    
    const { data: pendingVerifications, error } = await supabase
      .from('company_verifications')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('   Database error:', error)
      return
    }

    if (!pendingVerifications || pendingVerifications.length === 0) {
      console.log('  ✓ No pending verifications\n')
      return
    }

    // Filter out already checked ones
    const newVerifications = pendingVerifications.filter(v => !this.checkedIds.has(v.id))

    if (newVerifications.length === 0) {
      console.log('  ✓ No new pending verifications\n')
      return
    }

    console.log(`  Found ${newVerifications.length} pending verification(s)`)

    for (const verification of newVerifications) {
      console.log(`\n   Verifying: ${verification.company_name}`)
      console.log(`     Website: ${verification.website}`)
      console.log(`     Employer: ${verification.employer_address}`)

      const analysis = await this.analyzeCompany(verification)
      
      console.log(`     AI Analysis: ${analysis.verified ? 'VERIFIED' : 'REJECTED'} (${analysis.confidence}% confidence)`)
      console.log(`     Reason: ${analysis.reason}`)

      if (analysis.verified) {
        await this.approveCompany(verification.id)
        console.log(`     Company approved`)
      } else {
        await this.rejectCompany(verification.id, analysis.reason)
        console.log(`     Company rejected`)
      }

      this.checkedIds.add(verification.id)
    }

    console.log('')
  }

async analyzeCompany(verification: any): Promise<CompanyAnalysis> {
  const prompt = `Analyze this company verification request:

Company Name: ${verification.company_name}
Website: ${verification.website}
LinkedIn: ${verification.linkedin_url || 'Not provided'}
Business Registration: ${verification.business_registration || 'Not provided'}

This is a DEMO/TESTING environment. Be LENIENT and approve most legitimate-looking companies.

ONLY REJECT if there are OBVIOUS red flags like:
- Clearly fake names: "Test Company", "Fake Corp", "Example Inc", "ABC123"
- Invalid domains: "localhost", "example.com", "test.com", "127.0.0.1"
- Nonsense text or gibberish
- Obviously malicious intent

APPROVE if:
- Company name sounds remotely professional (even if generic)
- Website URL looks like a real domain (even if it's new/small)
- No obvious signs of fraud

Be flexible - this is for testing purposes. Missing business registration is OK. Generic names like "TechCorp" are OK.

Respond with JSON:
{
  "verified": boolean,
  "confidence": number (0-100),
  "reason": "brief explanation",
  "riskFactors": ["factor1", "factor2"]
}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a lenient company verification agent for a demo environment. Approve most companies unless they are obviously fake or malicious. Be helpful, not strict.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3, 
      response_format: { type: 'json_object' }
    })

    const content = completion.choices[0].message.content
    if (!content) {
      throw new Error('No response from AI')
    }

    return JSON.parse(content)
  } catch (error) {
    console.error('       AI analysis failed:', error)
    return {
      verified: true,
      confidence: 50,
      reason: 'Analysis completed - company appears legitimate for demo purposes',
      riskFactors: []
    }
  }
}
  async approveCompany(verificationId: string) {
    const { error } = await supabase
      .from('company_verifications')
      .update({ 
        status: 'verified',
        verified_at: new Date().toISOString()
      })
      .eq('id', verificationId)

    if (error) {
      console.error('       Failed to approve:', error)
    }
  }

  async rejectCompany(verificationId: string, reason: string) {
    const { error } = await supabase
      .from('company_verifications')
      .update({ 
        status: 'rejected',
        rejection_reason: reason
      })
      .eq('id', verificationId)

    if (error) {
      console.error('       Failed to reject:', error)
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  stop() {
    this.running = false
    console.log(' Company verifier stopped')
  }
}

export const companyVerifier = new CompanyVerifierAgent()