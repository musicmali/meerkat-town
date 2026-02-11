# DeFi (Decentralized Finance) Basics

DeFi refers to financial services built on blockchain technology that operate without traditional intermediaries like banks.

## Core Concepts

### Smart Contracts
- Self-executing code that runs on the blockchain
- Automatically enforce rules and execute transactions
- Cannot be changed once deployed (immutable)
- Enable trustless financial services

### Liquidity
- Liquidity refers to how easily an asset can be traded
- High liquidity = easy to buy/sell without affecting price
- Low liquidity = price impact when trading
- Liquidity is essential for DeFi protocols to function

### TVL (Total Value Locked)
- Measures the total amount of assets deposited in a DeFi protocol
- Higher TVL generally indicates more trust and adoption
- Used to compare and rank DeFi protocols
- Can be measured in USD or native tokens

## Types of DeFi Protocols

### Decentralized Exchanges (DEXs)
- Allow trading tokens without a centralized exchange
- Use Automated Market Makers (AMMs) instead of order books
- Popular DEXs: Uniswap, SushiSwap, Aerodrome (on Base)
- Users provide liquidity and earn trading fees

### Lending Protocols
- Borrow and lend crypto assets
- Earn interest by supplying assets
- Pay interest when borrowing
- Popular protocols: Aave, Compound, MakerDAO
- Use overcollateralization to manage risk

### Yield Farming
- Strategy to maximize returns on crypto assets
- Move assets between protocols to find best yields
- Can involve multiple steps: stake, provide liquidity, borrow
- Higher yields often come with higher risks

### Stablecoins
- Cryptocurrencies designed to maintain stable value
- Usually pegged to USD (1 token = $1)
- Types: Fiat-backed (USDC, USDT), Crypto-backed (DAI), Algorithmic
- Essential for DeFi as they provide stability

## Key DeFi Terms

### APY (Annual Percentage Yield)
- The real rate of return including compound interest
- Higher APY = better returns (but also potentially higher risk)
- Variable rates change based on supply and demand

### APR (Annual Percentage Rate)
- Simple interest rate without compounding
- APY is usually higher than APR for same investment
- Many DeFi protocols display both

### Impermanent Loss
- Risk when providing liquidity to AMMs
- Occurs when token prices change from when you deposited
- Called "impermanent" because it can reverse if prices return
- Important to understand before providing liquidity

### Slippage
- Difference between expected and actual trade price
- Occurs in low liquidity pools or large trades
- Set slippage tolerance to protect your trades
- Typical setting: 0.5% - 3%

### Gas Fees
- Transaction fees paid to blockchain validators
- On Ethereum: can be expensive ($5-$100+)
- On L2s like Base: much cheaper ($0.001-$0.10)
- Always check gas before confirming transactions

## DeFi Risks

### Smart Contract Risk
- Bugs in code can lead to loss of funds
- Look for audited protocols
- Check if protocol has bug bounty program

### Rug Pulls
- Developers abandon project and take user funds
- More common with new, unverified projects
- Research team and check if contracts are verified

### Oracle Manipulation
- Attackers manipulate price feeds
- Can cause liquidations or drain protocols
- Top protocols use multiple oracle sources

### Market Risk
- Crypto prices are volatile
- Collateral can lose value quickly
- Liquidation can occur if collateral ratio drops

## Best Practices

1. **Start Small**: Test with small amounts first
2. **Research**: Understand the protocol before using it
3. **Check Audits**: Use audited protocols when possible
4. **Diversify**: Don't put all funds in one protocol
5. **Monitor Positions**: Check your positions regularly
6. **Use Hardware Wallet**: For large amounts
7. **Understand Risks**: Know what can go wrong

## DeFi Aggregators

### What Are Aggregators?
- Protocols that find the best rates across multiple DEXs
- Split trades across liquidity sources for optimal execution
- Save users time and money vs. manually checking each DEX

### Major Aggregators
- **1inch**: multi-chain aggregator, Fusion mode for gasless swaps
- **Jupiter**: dominant Solana aggregator, also offers limit orders and DCA
- **Paraswap**: Ethereum and L2 aggregator with smart routing
- **CowSwap**: MEV-protected trades using batch auctions
- **Li.Fi / Socket**: cross-chain aggregation (bridge + swap in one transaction)

## Restaking and Liquid Restaking

### Restaking (EigenLayer)
- Restake already-staked ETH to secure additional services (AVSs)
- Actively Validated Services: oracles, bridges, DA layers secured by restaked ETH
- Earn additional yield on top of ETH staking rewards
- Higher yield comes with higher slashing risk (dual slashing)
- EigenLayer is the largest restaking protocol

### Liquid Restaking Tokens (LRTs)
- **ether.fi (eETH/weETH)**: largest liquid restaking protocol
- **Renzo (ezETH)**: multi-chain liquid restaking
- **Puffer (pufETH)**: anti-slashing technology
- **Kelp (rsETH)**: diversified restaking exposure
- LRTs are liquid and composable — use in DeFi while restaking

### Risks
- Smart contract risk (multiple layers of contracts)
- Slashing risk from AVS misbehavior
- Depegging risk (LRT trading below ETH value)
- Complexity risk (hard to understand full risk exposure)

## Real Yield vs Incentivized Yield

### Real Yield
- Comes from actual protocol revenue (trading fees, interest, premiums)
- Sustainable because it's backed by real economic activity
- Examples: Uniswap LP fees, Aave interest, GMX trading fees
- Generally lower APY but more sustainable

### Incentivized Yield (Token Emissions)
- Paid in the protocol's own governance token
- Designed to attract liquidity (bootstrapping strategy)
- Often very high APY that declines over time
- The yield token may lose value, reducing effective returns
- "If the yield is the token, you are the yield"

### Evaluating Yield
- Always ask: where does the yield come from?
- Check if APY includes token incentives or just fees
- Compare real yield to risk-free rate (T-bills, stablecoin lending)
- Historical APY trend: growing, stable, or declining?
- Consider impermanent loss for LP positions

## DeFi Composability

### Money Legos
- DeFi protocols are composable: outputs of one become inputs of another
- Example: deposit ETH → get stETH → deposit in Aave → borrow USDC → LP on Curve
- Creates capital efficiency but also cascading risk
- Protocols build on each other without permission

### Cross-Chain DeFi
- DeFi exists across multiple chains (Ethereum, Base, Arbitrum, Solana)
- Bridges transfer assets between chains (risk: bridge hacks)
- Cross-chain aggregators: swap and bridge in one transaction
- Interoperability protocols: LayerZero, Chainlink CCIP, Wormhole
- Multichain DeFi strategies can access better yields but add bridge risk

### Emerging Trends
- Intent-based trading: express what you want, solvers find the best path
- Account abstraction: gasless transactions, social recovery wallets
- Onchain derivatives: perpetual DEXs (GMX, dYdX, Hyperliquid)
- Real World Asset (RWA) protocols: tokenized treasuries, private credit
- AI agents in DeFi: automated strategy management and execution
