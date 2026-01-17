# Popular DeFi Protocols

## Uniswap

### Overview
Uniswap is the largest decentralized exchange (DEX) by trading volume. It pioneered the Automated Market Maker (AMM) model.

### How It Works
- Uses liquidity pools instead of order books
- Prices determined by constant product formula (x * y = k)
- Anyone can provide liquidity and earn fees
- Trading fee: 0.3% (distributed to liquidity providers)

### Versions
- Uniswap V2: Basic AMM, equal value pair deposits
- Uniswap V3: Concentrated liquidity, better capital efficiency
- Available on Ethereum, Base, Arbitrum, Polygon, and more

### UNI Token
- Governance token for Uniswap protocol
- Holders can vote on protocol changes
- No direct fee sharing (currently)

## Aave

### Overview
Aave is a decentralized lending and borrowing protocol. It's one of the largest DeFi protocols by TVL.

### How It Works
- Deposit assets to earn interest (supply)
- Borrow assets using your deposits as collateral
- Interest rates are variable, based on utilization
- Overcollateralization required (typically 150-200%)

### Key Features
- Flash Loans: Borrow without collateral (must repay in same transaction)
- aTokens: Receipt tokens that earn interest automatically
- Variable and stable interest rates
- Health Factor: Ratio that determines liquidation risk

### AAVE Token
- Governance token
- Can be staked in Safety Module for additional rewards
- Stakers act as insurance backstop

## Compound

### Overview
Compound is a pioneering DeFi lending protocol that helped start the "yield farming" craze.

### How It Works
- Similar to Aave: supply assets, earn interest
- Borrow against your collateral
- cTokens represent your deposited assets
- Interest accrues continuously

### COMP Token
- Governance token
- Distributed to users who supply or borrow
- One of the first major "liquidity mining" programs

## MakerDAO

### Overview
MakerDAO created DAI, the largest decentralized stablecoin.

### How DAI Works
- Deposit collateral (ETH, WBTC, etc.) into Vault
- Mint DAI stablecoin against your collateral
- Pay stability fee (interest) when closing vault
- Liquidation if collateral ratio falls too low

### Key Concepts
- Collateralization Ratio: Minimum ~150%
- Stability Fee: Interest rate for minting DAI
- Liquidation Penalty: Fee if vault is liquidated
- DAI Savings Rate (DSR): Earn yield on DAI

### MKR Token
- Governance token
- Used to pay stability fees
- Burned when fees are collected (deflationary)

## Curve Finance

### Overview
Curve specializes in stablecoin and similar-asset trading with very low slippage.

### How It Works
- Optimized AMM for assets that should have similar prices
- Much lower slippage than Uniswap for stablecoin swaps
- Popular pools: 3pool (USDT/USDC/DAI), stETH/ETH

### CRV Token
- Governance token
- Can be locked for veCRV (voting power + boosted rewards)
- Complex tokenomics with "Curve Wars"

## Aerodrome (Base)

### Overview
Aerodrome is the largest DEX on Base, a fork of Velodrome on Optimism.

### How It Works
- AMM with vote-escrowed tokenomics
- Liquidity providers earn AERO tokens
- veAERO holders vote on which pools get emissions
- Bribes system to incentivize voting

### Why It's Popular on Base
- Native to Base ecosystem
- High APYs for liquidity providers
- Growing ecosystem of integrations

## Lido Finance

### Overview
Lido is the largest liquid staking protocol for Ethereum.

### How It Works
- Stake ETH and receive stETH (liquid staking token)
- stETH represents your staked ETH + rewards
- Can use stETH in DeFi while earning staking rewards
- No minimum stake (unlike native ETH staking's 32 ETH)

### stETH
- Rebases daily (balance increases)
- Widely accepted as collateral in DeFi
- Can be wrapped as wstETH for better DeFi compatibility

## Risk Comparison

| Protocol | Smart Contract Risk | Complexity | Min Investment |
|----------|-------------------|------------|----------------|
| Uniswap | Low (battle-tested) | Low | Any amount |
| Aave | Low (audited, insured) | Medium | Any amount |
| Compound | Low (battle-tested) | Low | Any amount |
| MakerDAO | Low (longest running) | High | Any amount |
| Curve | Medium | High | Any amount |
| Lido | Medium | Low | Any amount |
