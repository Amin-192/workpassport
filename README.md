# WorkPassport

Verifiable work credentials with instant PYUSD payments for remote workers across borders.

Built for ETHGlobal ETHOnline 2025.

## The Problem

Remote workers struggle to prove their work history when applying across borders. Employers can't verify credentials. Cross-border payments take days and cost fees.

## The Solution

WorkPassport provides cryptographically signed work credentials stored on-chain with instant PYUSD payment settlements through smart contract escrow.

## Features

**For Employers:**
- AI-powered company verification system
- Issue EIP-712 signed credentials to workers
- Lock PYUSD payments in trustless escrow
- Real-time verification badges

**For Workers:**
- Collect verifiable on-chain credentials
- Claim PYUSD payments instantly
- Connect GitHub for contribution tracking
- Private salary encryption via Lit Protocol

**Autonomous AI Agents:**
- Company Verifier Agent validates employer legitimacy every 15 seconds
- Credential Monitor Agent detects fraud patterns every 30 seconds

## Tech Stack

- Next.js 15 + TypeScript
- Ethereum Sepolia
- Solidity Smart Contracts
- PayPal USD (PYUSD)
- Blockscout SDK
- OpenAI GPT-4o-mini
- Lit Protocol
- Supabase

## Getting Started

### Prerequisites
- Node.js 18+
- MetaMask wallet
- Sepolia testnet ETH

### Installation
```bash
npm install
```

### Environment Setup

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_RPC_URL=your_rpc_url
```

### Run
```bash
# Start web application
npm run dev

# Start AI agents (separate terminal)
npm run agent
```

Open http://localhost:3000

## How It Works

1. Employers submit company details for AI verification
2. Verified employers issue EIP-712 signed credentials
3. Optional PYUSD payment locked in escrow contract
4. Workers claim credentials and payments on-chain
5. AI agents continuously monitor for fraud

## Smart Contracts

Deployed on Ethereum Sepolia testnet.

## Team

Amin Hassan and Even Russom

## License

MIT