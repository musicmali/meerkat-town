# Crypto & Blockchain Glossary

## Basic Terms

### Blockchain
A distributed ledger technology that records transactions across many computers. Once recorded, data cannot be altered without changing all subsequent blocks.

### Cryptocurrency
Digital or virtual currency that uses cryptography for security. Examples: Bitcoin (BTC), Ethereum (ETH), USDC.

### Wallet
Software or hardware that stores private keys and allows users to send/receive cryptocurrency. Types: Hot wallets (connected to internet), Cold wallets (offline).

### Private Key
A secret cryptographic key that proves ownership of a wallet. Never share your private key. Anyone with your private key can access your funds.

### Public Key / Address
Your wallet's public identifier, like a bank account number. Safe to share for receiving funds. Format: 0x followed by 40 hexadecimal characters.

### Seed Phrase / Recovery Phrase
A list of 12 or 24 words that can restore your wallet. Store securely offline. Never share or enter on suspicious websites.

## Ethereum Concepts

### ETH (Ether)
The native cryptocurrency of Ethereum. Used to pay gas fees and as a store of value.

### Gas
The unit measuring computational effort on Ethereum. You pay gas fees to execute transactions and smart contracts.

### Gwei
A denomination of ETH. 1 Gwei = 0.000000001 ETH. Gas prices are often quoted in Gwei.

### Smart Contract
Self-executing code deployed on the blockchain. Once deployed, it runs exactly as programmed without possibility of downtime or censorship.

### ERC-20
A token standard on Ethereum. Most tokens (USDC, UNI, AAVE) follow this standard. Defines basic functions: transfer, approve, balanceOf.

### ERC-721
The NFT (Non-Fungible Token) standard. Each token is unique with its own ID and metadata.

### ERC-1155
Multi-token standard supporting both fungible and non-fungible tokens in one contract.

## Layer 2 Terms

### Layer 1 (L1)
The base blockchain (e.g., Ethereum mainnet). Provides security and finality.

### Layer 2 (L2)
Scaling solutions built on top of L1. Process transactions off-chain for lower fees. Examples: Base, Arbitrum, Optimism.

### Optimistic Rollup
L2 solution that assumes transactions are valid by default. Uses fraud proofs if someone challenges. Examples: Base, Optimism, Arbitrum.

### ZK Rollup
L2 solution using zero-knowledge proofs to validate transactions. Examples: zkSync, StarkNet.

### Sequencer
The entity that orders transactions on an L2. Currently centralized on most L2s.

### Bridge
Protocol that allows transferring assets between different blockchains or L1/L2.

## DeFi Terms

### DEX (Decentralized Exchange)
Exchange without a central authority. Users trade directly from their wallets. Examples: Uniswap, Aerodrome.

### CEX (Centralized Exchange)
Traditional exchange that holds user funds. Examples: Coinbase, Binance.

### AMM (Automated Market Maker)
Algorithm that provides liquidity and determines prices using mathematical formulas instead of order books.

### Liquidity Pool
Smart contract holding two or more tokens that enables trading. Liquidity providers deposit tokens and earn fees.

### LP Token
Token received when providing liquidity. Represents your share of the pool.

### Yield
Return on investment, usually expressed as APY or APR.

### Farming / Yield Farming
Strategy of moving assets between protocols to maximize returns.

### Staking
Locking up tokens to support network operations (validation) or earn rewards.

### Collateral
Assets deposited to secure a loan. If loan goes bad, collateral is liquidated.

### Liquidation
Forced selling of collateral when its value drops below required threshold.

### Slippage
Difference between expected and executed trade price due to market movement or low liquidity.

### MEV (Maximal Extractable Value)
Profit that validators/miners can extract by reordering transactions. Can cause front-running.

### Front-running
When someone sees your pending transaction and places their own transaction before yours to profit.

## Market Terms

### Market Cap
Total value of all tokens in circulation. Price × Circulating Supply.

### FDV (Fully Diluted Valuation)
Market cap if all tokens (including locked/unvested) were in circulation.

### TVL (Total Value Locked)
Total assets deposited in a DeFi protocol.

### Volume
Amount traded over a period (usually 24 hours).

### Liquidity
How easily an asset can be traded without affecting its price.

### HODL
Slang for "hold" - keeping crypto long-term instead of trading.

### FOMO
"Fear Of Missing Out" - buying because of hype, not research.

### FUD
"Fear, Uncertainty, Doubt" - negative information spread to cause panic selling.

### Whale
Someone who holds a very large amount of cryptocurrency.

### Rug Pull
Scam where developers abandon a project and take user funds.

### DYOR
"Do Your Own Research" - reminder to research before investing.

## Technical Terms

### Hash
Fixed-length output from a cryptographic function. Used for transaction IDs, block identification.

### Block
Group of transactions bundled together and added to the blockchain.

### Nonce
Number used once. In transactions, prevents replay attacks.

### ABI (Application Binary Interface)
Interface definition for interacting with smart contracts.

### RPC (Remote Procedure Call)
Method for communicating with blockchain nodes.

### Oracle
Service that provides external data to smart contracts. Example: Chainlink price feeds.

### Multisig
Wallet requiring multiple signatures to execute transactions. More secure than single-key wallets.

### DAO (Decentralized Autonomous Organization)
Organization governed by smart contracts and token holder votes instead of traditional management.
