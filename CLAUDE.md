# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Meerkat Town is a Web3 AI agent marketplace on Base Sepolia where users mint AI agents as NFTs (ERC-8004 standard), chat with them via x402 USDC micropayments, and provide on-chain reputation feedback.

## Repository Structure

This is a **monorepo** with three main components:

- **Root (`/`)**: React frontend (Vite + TypeScript)
- **`/meerkat-backend`**: Hono server with x402 payment middleware (Bun/Node)
- **`/meerkat-contracts`**: Solidity smart contracts (Foundry)

## Commands

### Frontend (root directory)
```bash
npm run dev      # Start dev server with hot reload (--host for network access)
npm run build    # TypeScript check + Vite production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

### Backend (`/meerkat-backend`)
```bash
bun install      # Install dependencies
bun run index.ts # Start server on port 3000
```

### Smart Contracts (`/meerkat-contracts`)
```bash
forge build      # Compile contracts
forge test       # Run tests
forge fmt        # Format Solidity
```

## Architecture

### Key Technologies
- **Frontend**: React 19, wagmi v3, viem, React Router, react-markdown
- **Backend**: Hono, @x402/hono middleware, OpenAI SDK
- **Blockchain**: Base Sepolia (chain ID 84532), ERC-8004 registries
- **Payments**: x402 protocol for USDC micropayments

### ERC-8004 Registries (Base Sepolia)
```
Identity Registry:   0x8004AA63c570c570eBF15376c0dB199918BFe9Fb
Reputation Registry: 0x8004bd8daB57f14Ed299135749a5CB5c42d341BF
Validation Registry: 0x8004C269D0A5647E51E121FeB226200ECE932d55
```

### Frontend Architecture (`/src`)
- `pages/`: Main views (Dashboard, Chat, MintAgent, MyAgents, Leaderboard, Landing)
- `hooks/`: Custom React hooks for blockchain interactions
  - `useIdentityRegistry.ts`: Fetches agents from ERC-8004 Identity Registry
  - `useERC8004Registries.ts`: Registers agents and submits feedback
  - `useX402.ts`: Wraps fetch with x402 payment handling
- `contracts/`: ABI definitions and registry addresses
- `config/wagmi.ts`: Wallet/chain configuration, exports `ERC8004_REGISTRIES`
- `utils/pinata.ts`: IPFS upload via Pinata

### Backend Architecture (`/meerkat-backend`)
Single `index.ts` file with:
- `/demo/:agentId` - Free chat endpoint (no wallet needed)
- `/agents/:agentId` - Paid chat with x402 middleware ($0.001 USDC per message)
- `/agents/:agentId/.well-known/agent-card.json` - A2A protocol support
- Legacy agents (Bob, Ana) have hardcoded system prompts
- Minted agents receive system prompts from their IPFS metadata

### Agent Identification
- Meerkat Town agents have `meerkatId` (1-100) in their metadata
- First Meerkat agent ID on-chain: #16
- Function `isMeerkatTownAgent()` in `useIdentityRegistry.ts` filters by meerkatId or image URL

### Payment Flow
1. Frontend calls `x402Fetch` from `useX402` hook
2. If 402 returned, wallet signs payment
3. Payment header sent with retry
4. Backend `paymentMiddleware` verifies via CDP facilitator
5. Request proceeds if payment valid

## Environment Variables

### Backend (`/meerkat-backend/.env`)
- `OPENAI_API_KEY` - OpenAI API key
- `PRIVATE_KEY` - Wallet private key for receiving payments
- `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET` - Coinbase x402 facilitator credentials
- `PINATA_JWT` - Pinata IPFS authentication

### Frontend (Vite env)
- `VITE_BACKEND_URL` - Backend API URL (e.g., `https://meerkat.up.railway.app`)
- `VITE_PINATA_JWT` - Pinata JWT for metadata uploads

## Key Constants

```typescript
// Meerkat collection
const TOTAL_MEERKATS = 100;
const FIRST_MEERKAT_AGENT_ID = 16;

// Chain
const BASE_SEPOLIA_CHAIN_ID = 84532;

// x402
const PRICE_PER_REQUEST = '$0.001';
```

## Working with Agents

### Minting Flow (MintAgent.tsx)
1. Select meerkat avatar (1-100)
2. Enter name, description, pricing
3. Select skills/domains from OASF taxonomy
4. Generate ERC-8004 metadata JSON
5. Upload to IPFS via Pinata
6. Call `register(ipfsUri)` on Identity Registry

### Chat Flow (Chat.tsx)
1. Load agent via `fetchAgent()` from registry
2. Build system prompt from metadata
3. Use `x402Fetch` for paid agents or regular fetch for free/demo
4. POST to `/agents/:agentId` or `/demo/:agentId`
5. Display streamed response with react-markdown

### Rating Flow (RateAgent component)
1. User sets score (0-100)
2. Call `giveFeedback()` on Reputation Registry
3. Self-rating prevented (owner cannot rate own agent)
