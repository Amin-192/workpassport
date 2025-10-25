import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract'

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
})

interface CredentialAnalysis {
  suspicious: boolean
  confidence: number
  reason: string
  riskLevel: 'low' | 'medium' | 'high'
}

class CredentialMonitorAgent {
  private running = false
  private lastCheckedTime: string
  private provider: ethers.JsonRpcProvider
  private checkInterval = 30000

  constructor() {
    // Start checking from 10 minutes ago
    this.lastCheckedTime = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    this.provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_KEY'
    )
  }

  async start() {
    if (this.running) {
      console.log('⚠️  Agent already running')
      return
    }

    this.running = true
    console.log('✅ Agent started')
    console.log(`📡 Monitoring every ${this.checkInterval/1000}s`)
    console.log(`📍 Checking credentials after: ${this.lastCheckedTime}`)
    console.log('🔍 First check...\n')

    while (this.running) {
      try {
        await this.monitorCredentials()
      } catch (error) {
        console.error('❌ Error:', error)
      }
      await this.sleep(this.checkInterval)
    }
  }

  async monitorCredentials() {
    console.log(`[${new Date().toISOString()}] Checking...`)
    
    const { data: newCreds, error } = await supabase
      .from('credentials')
      .select('*')
      .gt('created_at', this.lastCheckedTime)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('  ❌ Database error:', error)
      return
    }

    if (!newCreds || newCreds.length === 0) {
      console.log('  ✓ No new credentials\n')
      return
    }

    console.log(`  📋 Found ${newCreds.length} new credential(s)`)

    for (const cred of newCreds) {
      console.log(`\n  🔬 Analyzing credential ${cred.id}`)
      console.log(`     Company: ${cred.company}`)
      console.log(`     Position: ${cred.position}`)
      console.log(`     Worker: ${cred.worker_address}`)

      const analysis = await this.analyzeCredential(cred)
      console.log(`     AI Analysis: ${analysis.suspicious ? '⚠️ SUSPICIOUS' : '✅ OK'} (${analysis.confidence}% confidence)`)
      console.log(`     Reason: ${analysis.reason}`)
      
      const employerStats = await this.getEmployerStats(cred.issuer_address)
      console.log(`     Employer: ${employerStats.totalIssued} total issued, ${employerStats.recentIssued} in 24h`)
      
      const onChainValid = await this.verifyOnChain(cred)
      console.log(`     On-chain: ${onChainValid ? '✅ Verified' : '❌ Not found'}`)

      if (analysis.suspicious || employerStats.suspicious || !onChainValid) {
        console.log(`     🚨 FLAGGING CREDENTIAL`)
        await this.flagCredential(cred, analysis, employerStats)
      }

      await this.updateReputationScores(cred, analysis)
      
      // Update checkpoint to this credential's timestamp
      this.lastCheckedTime = cred.created_at
    }

    console.log('')
  }

  async analyzeCredential(cred: any): Promise<CredentialAnalysis> {
    const duration = this.calculateDuration(cred.start_date, cred.end_date)
    
    const prompt = `Analyze this work credential for fraud:

Company: ${cred.company}
Position: ${cred.position}
Skills: ${cred.skills.join(', ')}
Duration: ${duration} months

Check for red flags:
1. Unrealistic skill combinations
2. Too many high-level skills for duration
3. Generic company names
4. Suspicious timing
5. Position mismatch with skills

Respond with JSON:
{
  "suspicious": boolean,
  "confidence": number (0-100),
  "reason": "explanation",
  "riskLevel": "low" | "medium" | "high"
}`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a fraud detection specialist.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })

      return JSON.parse(completion.choices[0].message.content || '{}')
    } catch (error) {
      console.error('     ⚠️  AI analysis failed:', error)
      return {
        suspicious: false,
        confidence: 0,
        reason: 'Analysis failed',
        riskLevel: 'low'
      }
    }
  }

  async getEmployerStats(issuerAddress: string) {
    const { data: employerCreds, count } = await supabase
      .from('credentials')
      .select('*', { count: 'exact' })
      .ilike('issuer_address', issuerAddress)

    const recentCount = employerCreds?.filter((c: any) => {
      const createdAt = new Date(c.created_at)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return createdAt > dayAgo
    }).length || 0

    const suspicious = recentCount > 10

    return {
      totalIssued: count || 0,
      recentIssued: recentCount,
      suspicious,
      reason: suspicious ? `Issued ${recentCount} credentials in 24h` : 'Normal activity'
    }
  }

  async verifyOnChain(cred: any): Promise<boolean> {
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.provider)
      const count = await contract.getCredentialCount(cred.worker_address)
      
      for (let i = 0; i < count; i++) {
        const [hash] = await contract.getCredential(cred.worker_address, i)
        if (hash === cred.credential_hash) return true
      }
      
      return false
    } catch (error) {
      console.error('     ⚠️  On-chain verification failed:', error)
      return true // Assume valid if verification fails
    }
  }

  async flagCredential(cred: any, analysis: CredentialAnalysis, employerStats: any) {
    const flagReason = `AI: ${analysis.reason}. ${employerStats.suspicious ? employerStats.reason : ''}`

    const { error } = await supabase
      .from('credentials')
      .update({ 
        flagged: true, 
        flag_reason: flagReason,
        flagged_at: new Date().toISOString(),
        risk_level: analysis.riskLevel
      })
      .eq('id', cred.id)

    if (error) {
      console.error('     ⚠️  Failed to flag credential:', error)
    }

    await this.logAction('flag_credential', cred.id, flagReason)
  }

  async updateReputationScores(cred: any, analysis: CredentialAnalysis) {
    const reputationDelta = analysis.suspicious ? -10 : +5

    const { error } = await supabase
      .from('employer_reputation')
      .upsert({
        employer_address: cred.issuer_address.toLowerCase(),
        score: reputationDelta,
        total_issued: 1,
        flagged_count: analysis.suspicious ? 1 : 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'employer_address' })

    if (error) {
      console.error('     ⚠️  Failed to update reputation:', error)
    }
  }

  async logAction(action: string, credentialId: string, details: string) {
    const { error } = await supabase
      .from('agent_actions')
      .insert({ 
        action, 
        credential_id: credentialId, 
        details, 
        timestamp: new Date().toISOString() 
      })

    if (error) {
      console.error('     ⚠️  Failed to log action:', error)
    }
  }

  private calculateDuration(startDate: string, endDate: string | null): number {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()
    return Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()))
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  stop() {
    this.running = false
    console.log('🛑 Agent stopped')
  }
}

export const agent = new CredentialMonitorAgent()