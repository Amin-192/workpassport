# Avail Nexus SDK Feedback - ETHOnline 2025

## Project Context
**Project:** WorkPassport - Verifiable credentials platform with PYUSD escrow
**Attempted Integration:** Cross-chain PYUSD claiming via Nexus SDK

## Issues Encountered

### 1. Token Support Not Clear in Documentation
**Problem:** Documentation doesn't clearly list supported tokens per chain.
- Spent hours implementing PYUSD bridge integration
- Only discovered PYUSD unsupported after testing
- SDK only supports: USDC, ETH, MATIC

**Screenshot:** [Add screenshot of your bridge code attempt]

**Suggestion:** Add a prominent "Supported Tokens" table in Quick Start docs showing token support per chain.

### 2. Missing Error Messages
**Problem:** SDK doesn't return clear error when unsupported token used.
- Silent failures during bridging attempts
- No validation on token address before submission

**Suggestion:** Add token validation with descriptive error: "PYUSD not supported on Nexus. Supported tokens: USDC, ETH, MATIC"

## What Worked Well
- SDK installation was straightforward
- TypeScript types were helpful
- [Add positives]

## Recommendations
1. Token compatibility checker in docs
2. Better error handling
3. More testnet examples