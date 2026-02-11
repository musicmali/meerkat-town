# Base Network Overview

Base is a secure, low-cost, builder-friendly Ethereum Layer 2 (L2) solution built by Coinbase. It provides a platform for developers to build decentralized applications.

## Key Features

### Layer 2 Scaling
- Base is built on Optimism's OP Stack, making it an Optimistic Rollup
- Transactions are processed off-chain and then batched to Ethereum mainnet
- This results in significantly lower gas fees compared to Ethereum mainnet
- Typical transaction costs on Base are under $0.01

### Security
- Base inherits security from Ethereum mainnet
- Uses fraud proofs to ensure transaction validity
- Backed by Coinbase's security infrastructure
- Regular security audits and bug bounty programs

### EVM Compatibility
- Fully compatible with Ethereum Virtual Machine (EVM)
- Developers can deploy existing Solidity smart contracts without modification
- Supports all standard Ethereum tools: Hardhat, Foundry, Remix, etc.
- Works with popular wallets like MetaMask, Coinbase Wallet, Rainbow

## Network Details

### Mainnet
- Chain ID: 8453
- RPC URL: https://mainnet.base.org
- Block Explorer: https://basescan.org
- Native Token: ETH (bridged from Ethereum)

### Sepolia Testnet
- Chain ID: 84532
- RPC URL: https://sepolia.base.org
- Block Explorer: https://sepolia.basescan.org
- Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

## Bridging Assets

### Official Bridge
- Use bridge.base.org to transfer ETH and supported tokens
- Deposits from Ethereum to Base: ~1 minute
- Withdrawals from Base to Ethereum: 7 days (due to optimistic rollup security)

### Third-Party Bridges
- Hop Protocol
- Across Protocol
- Stargate Finance
- Synapse Protocol

## Development Resources

### Documentation
- Official docs: docs.base.org
- Developer guides and tutorials
- API references and SDKs

### Tools
- Base SDK for JavaScript/TypeScript
- Coinbase Wallet SDK for web3 integration
- OnchainKit for building onchain apps

## Popular DApps on Base

### DeFi
- Aerodrome (DEX) - largest DEX on Base
- Uniswap V3
- Compound Finance
- Aave V3

### NFTs
- OpenSea
- Zora
- friend.tech (SocialFi)

### Gaming
- Various Web3 games launching on Base

## Gas and Fees

Base uses ETH for gas fees. The fee structure includes:
- L2 execution fee (very low, paid to sequencer)
- L1 data fee (for posting data to Ethereum)

Typical transaction costs:
- Simple transfer: < $0.001
- Token swap: < $0.01
- NFT mint: < $0.05

## Ecosystem Growth

Base has seen rapid adoption since its mainnet launch in August 2023:
- Hundreds of dApps deployed
- Billions in TVL (Total Value Locked)
- Growing developer community
- Regular hackathons and grants programs

## ERC-8004 Standard

### Overview
- On-chain standard for AI agent identity, reputation, and validation
- Enables decentralized agent marketplaces like Meerkat Town
- Three registries work together to create a trust layer for AI agents

### Identity Registry
- Registers AI agents with on-chain metadata (name, description, skills)
- Each agent is an NFT with a unique token ID
- Metadata stored on IPFS, URI stored on-chain
- Supports OASF (Open Agent Skill Framework) taxonomy for agent capabilities
- Address: 0x8004AA63c570c570eBF15376c0dB199918BFe9Fb (Base Sepolia)

### Reputation Registry
- On-chain feedback and scoring system for agents
- Users submit scores (0-100) after interacting with agents
- Self-rating prevention: agent owners cannot rate their own agents
- Aggregated scores provide trust signals for agent quality
- Address: 0x8004bd8daB57f14Ed299135749a5CB5c42d341BF (Base Sepolia)

### Validation Registry
- Verification layer for agent capabilities and claims
- Validators can attest to agent properties
- Helps users distinguish verified agents from unverified
- Address: 0x8004C269D0A5647E51E121FeB226200ECE932d55 (Base Sepolia)

## Coinbase Smart Wallet

### Overview
- Account abstraction wallet built by Coinbase
- No browser extension needed, works with passkeys
- Gasless transactions via paymasters
- Creates wallets instantly (no seed phrase for basic setup)

### Features
- Passkey-based authentication (Face ID, fingerprint, device PIN)
- Batch transactions (multiple actions in one click)
- Session keys for DApp interactions without repeated signing
- Cross-device support via passkey sync
- Compatible with all EVM chains Base supports

### For Developers
- Coinbase Wallet SDK integration
- OnchainKit components for easy wallet connection
- Support for EIP-4337 (account abstraction standard)
- Paymaster integration for sponsored transactions

## Account Abstraction on Base

### EIP-4337
- Standard for account abstraction without protocol changes
- Smart contract wallets instead of EOA (externally owned accounts)
- Enables: gasless transactions, social recovery, batch operations
- Components: UserOperation, Bundler, EntryPoint, Paymaster

### Benefits
- Users don't need ETH for gas (paymaster covers it)
- Custom signature schemes (passkeys, multisig)
- Automated transactions (scheduled, conditional)
- Better UX: fewer popups, batch approvals
- Recoverable wallets (social recovery, guardians)

## Base Ecosystem

### Developer Programs
- Base Builder Grants: funding for builders on Base
- Onchain Summer: seasonal campaign for new dApps
- Base Bootcamp: developer education program
- Base Guild: community contributor program

### Key Infrastructure
- **OnchainKit**: React components for building on Base
- **Coinbase Wallet SDK**: wallet integration toolkit
- **Coinbase Commerce**: crypto payments for merchants
- **Coinbase Verifications**: on-chain identity attestations (cbid)
- **Base Names**: .base.eth on-chain identity

### Ecosystem Highlights
- Fast-growing L2 with strong Coinbase distribution
- Low transaction costs make microtransactions viable
- x402 payment protocol enables pay-per-request APIs
- Strong focus on consumer applications and onboarding
- Meerkat Town: AI agent marketplace using ERC-8004 and x402 on Base
