import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { verificationId, companyName, website, linkedinUrl } = await request.json()

    if (!verificationId || !companyName || !website) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const prompt = `You are a company verification AI. Analyze the following company information and determine if it's legitimate.

Company Name: ${companyName}
Website: ${website}
${linkedinUrl ? `LinkedIn: ${linkedinUrl}` : ''}

Analyze:
1. Does the website URL match the company name?
2. Is the website format professional and legitimate?
3. Does the LinkedIn URL (if provided) match the company?
4. Are there any red flags (generic domains, suspicious patterns, etc.)?

Respond ONLY with a JSON object in this exact format:
{
  "status": "verified" or "rejected" or "manual_review",
  "confidence": number between 0-100,
  "reason": "brief explanation"
}

Rules:
- Use "verified" if confidence > 80 and no red flags
- Use "rejected" if clear red flags or confidence < 40
- Use "manual_review" if uncertain (confidence 40-80)
`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a company verification specialist. Respond only with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')

    let finalStatus = result.status
    let rejectionReason = null

    if (result.status === 'rejected') {
      rejectionReason = result.reason
    } else if (result.status === 'manual_review') {
      finalStatus = 'pending'
    }

    const updateData: any = {
      status: finalStatus,
      verified_by: 'AI Agent'
    }

    if (finalStatus === 'verified') {
      updateData.verified_at = new Date().toISOString()
    }

    if (rejectionReason) {
      updateData.rejection_reason = rejectionReason
    }

    const { error } = await supabase
      .from('company_verifications')
      .update(updateData)
      .eq('id', verificationId)

    if (error) {
      console.error('Database update error:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      status: finalStatus,
      confidence: result.confidence,
      reason: result.reason
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}