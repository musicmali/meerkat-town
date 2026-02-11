# NFT Fundamentals

NFTs (Non-Fungible Tokens) are unique digital assets on the blockchain that prove ownership and authenticity. Unlike cryptocurrencies where each token is identical, every NFT has a distinct identity.

## What Are NFTs?

### Core Concept
- Non-fungible means each token is unique and not interchangeable
- Stored on the blockchain with a unique token ID and owner address
- Can represent digital art, collectibles, memberships, identity, real-world assets
- Ownership is verifiable and transferable without intermediaries

### Token Standards
- **ERC-721**: The original NFT standard, one unique token per ID
- **ERC-1155**: Multi-token standard, supports both unique and semi-fungible tokens
- **ERC-8004**: AI agent registry standard, used for registering agents with on-chain identity and reputation
- **ERC-6551**: Token-bound accounts, NFTs that can own assets
- Each standard defines how tokens are minted, transferred, and queried

### How NFTs Work
- A smart contract tracks token IDs and their owners
- Each token has a `tokenURI` pointing to metadata (usually JSON)
- Metadata includes name, description, image, attributes/traits
- The smart contract enforces transfer rules and permissions

## NFT Metadata and Storage

### Metadata Standard
- JSON format with fields: name, description, image, attributes
- Attributes define traits (e.g., background color, hat type, rarity tier)
- External_url, animation_url for interactive/video NFTs
- Properties field for additional custom data

### Storage Options
- **IPFS**: Decentralized file storage, content-addressed (most common)
- **Arweave**: Permanent storage with one-time payment
- **On-chain**: Stored directly in the smart contract (most durable, most expensive)
- **Centralized servers**: Cheapest but risky (can go offline)
- Best practice: use IPFS or Arweave for long-term persistence

### Pinata and IPFS
- Pinata is a popular IPFS pinning service
- Upload files and get a CID (Content Identifier)
- CID-based URLs: `ipfs://<CID>` or `https://gateway.pinata.cloud/ipfs/<CID>`
- Pinning ensures files stay available on the IPFS network

## NFT Marketplaces

### Major Marketplaces
- **OpenSea**: Largest NFT marketplace, supports multiple chains
- **Blur**: Ethereum-focused, popular with traders, aggregator features
- **Zora**: Creator-focused, no-fee minting, strong on Base
- **Magic Eden**: Multi-chain (Solana, Ethereum, Bitcoin, Polygon)
- **Rarible**: Community-governed marketplace
- **Foundation**: Curated art platform
- **LooksRare**: Community-owned, token-incentivized

### Marketplace Mechanics
- Listings: Set a fixed price or start an auction
- Offers: Buyers place bids on specific tokens or collections
- Collection offers: Bid on any NFT in a collection
- Royalties: Creator earnings on secondary sales (varies by marketplace)
- Aggregators: Tools that search across multiple marketplaces

## Minting Process

### What is Minting?
- Creating a new NFT on the blockchain
- Involves deploying or calling a smart contract's mint function
- Costs gas fees (varies by chain and contract complexity)
- Can be open (anyone) or allowlisted (restricted)

### Minting Methods
- Public mint: Anyone can mint during a set window
- Allowlist/Whitelist: Pre-approved addresses get early or guaranteed access
- Free mint: No mint price, only gas fees
- Lazy minting: NFT created on-chain only when purchased
- Airdrop: Sent directly to wallets, no user action needed

### Gas Costs by Chain
- Ethereum mainnet: $5-$100+ per mint depending on gas prices
- Base: $0.01-$0.05 per mint
- Polygon: <$0.01 per mint
- Solana: ~$0.01 per mint
- Layer 2s offer dramatically lower costs for creators and collectors

## NFT Valuation

### Key Metrics
- **Floor price**: Lowest listed price in a collection
- **Volume**: Total trading volume over a period
- **Unique holders**: Number of distinct wallet addresses holding tokens
- **Listed ratio**: Percentage of collection currently for sale
- **Sales velocity**: How quickly NFTs are selling

### Rarity and Traits
- Rarity is determined by how uncommon specific traits are
- Tools: Rarity.tools, HowRare.is, trait-based ranking
- Rare traits generally command higher prices
- 1/1 art valued differently than generative collections

### Valuation Factors
- Artist/creator reputation and track record
- Community size and engagement
- Utility (access, memberships, governance rights)
- Historical trading data and price trends
- Cultural significance and provenance
- Liquidity depth (how easy to sell)

## NFT Risks

### Common Scams
- **Rug pulls**: Creator abandons project after minting
- **Phishing**: Fake websites or signatures that steal NFTs
- **Approval phishing**: Tricking users into approving malicious contracts
- **Address poisoning**: Sending spam from lookalike addresses
- **Wash trading**: Fake trades to inflate volume and price
- **Counterfeit collections**: Copied art with similar names

### Market Risks
- Extreme price volatility, most NFTs lose value
- Illiquidity: difficulty selling at desired price
- Royalty enforcement varies by marketplace
- Smart contract bugs can lock or lose tokens
- Metadata stored on centralized servers can disappear

### Due Diligence
- Verify contract address on block explorer
- Check if contract is verified and audited
- Research the team and their history
- Analyze holder distribution (concentrated = risky)
- Look at organic community activity, not bot-inflated metrics

## NFT Royalties

### EIP-2981 (Royalty Standard)
- On-chain standard for creator royalties on secondary sales
- Contract returns royalty recipient and amount for a given sale price
- Typical royalty: 2.5%-10% of sale price
- Not all marketplaces enforce on-chain royalties

### Royalty Landscape
- OpenSea: Optional creator fees (min 0.5%)
- Blur: Optional royalties
- Zora: Protocol rewards for creators
- Some chains building royalties into transfer functions
- Creator earnings model is evolving rapidly

## Use Cases Beyond Art

### Gaming
- In-game items, characters, skins as NFTs
- Play-to-earn: earn NFTs through gameplay
- Interoperable items across games (emerging)
- Player-owned economies

### Memberships and Access
- NFT as membership card (token-gated access)
- Event tickets that double as collectibles
- Subscription passes with on-chain verification
- DAO governance: NFT holders vote on proposals

### Identity and Credentials
- Digital identity (ENS domains, Lens profiles)
- Proof of attendance (POAPs)
- Verifiable credentials and certificates
- AI agent identity (ERC-8004 on Meerkat Town)

### Real World Assets (RWAs)
- Tokenizing physical assets: real estate, luxury goods
- Fractional ownership of expensive items
- Supply chain tracking and authenticity
- Legal frameworks still evolving

## Generative Art and Collections

### Generative Art
- Algorithm creates unique artwork from a set of parameters
- Art Blocks: leading generative art platform
- fxhash: Tezos-based generative art
- Each mint produces a unique output from the same code
- Valued for the algorithm and aesthetic, not just individual pieces

### Collection Structure
- Typical size: 1,000 to 10,000 items
- Trait layers combined programmatically (PFP collections)
- Rarity distribution designed before reveal
- Reveal mechanics: instant or delayed reveal after minting
- Art stored as layers that combine based on seed/token ID

### PFP (Profile Picture) Collections
- Designed as social media avatars
- Community identity around shared collection
- Notable: CryptoPunks, Bored Ape Yacht Club, Pudgy Penguins, Azuki
- Cultural status symbols in Web3

## Blue Chip Collections

### Established Collections
- **CryptoPunks**: First major NFT collection (2017), 10,000 pixel art characters
- **Bored Ape Yacht Club (BAYC)**: 10,000 ape PFPs with commercial rights
- **Pudgy Penguins**: Strong brand expansion into physical toys
- **Azuki**: Anime-inspired collection with strong art direction
- **Art Blocks Curated**: Premium generative art
- **Chromie Squiggles**: Iconic Art Blocks generative piece by Snowfro
- Blue chips have sustained value through market cycles
