import 'dotenv/config'
import { agent } from './credential-monitor'
import { companyVerifier } from './company-verifier'

console.log('🚀 Starting WorkPassport AI Agents...\n')

console.log('Starting Company Verifier...')
companyVerifier.start()

console.log('\nStarting Credential Monitor...')
agent.start()

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down agents...')
  companyVerifier.stop()
  agent.stop()
  process.exit(0)
})