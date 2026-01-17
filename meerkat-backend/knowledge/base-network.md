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
