# Meerkat Town - Complete Technical Documentation

## Executive Summary

**Meerkat Town** is a decentralized AI agent marketplace built on the **Base Sepolia** blockchain. It enables users to mint, own, and monetize AI agents as NFTs using the **ERC-8004** standard for AI Agent identity and reputation. The platform implements **x402** for micropayments, allowing users to pay per message when chatting with AI agents.

### Key Value Propositions:
1. **True AI Agent Ownership** - AI agents are represented as NFTs on-chain
2. **Monetization** - Agent owners earn USDC for every chat message
3. **Reputation System** - On-chain reputation tracking via ERC-8004 standards
4. **Interoperability** - Supports MCP, A2A, and OASF protocols

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Smart Contracts (ERC-8004)](#3-smart-contracts-erc-8004)
4. [Backend Server](#4-backend-server)
5. [Frontend Application](#5-frontend-application)
6. [Blockchain Integration Layer](#6-blockchain-integration-layer)
7. [Payment System (x402)](#7-payment-system-x402)
8. [AI Agent System](#8-ai-agent-system)
9. [Reputation System](#9-reputation-system)
10. [Complete User Workflows](#10-complete-user-workflows)
11. [Data Structures & Types](#11-data-structures--types)
12. [API Reference](#12-api-reference)
13. [Configuration & Deployment](#13-configuration--deployment)

---

## 1. Architecture Overview

```
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|    Frontend      |<--->|    Backend       |<--->|   OpenAI API     |
|    (React/Vite)  |     |    (Express)     |     |   (GPT-4o-mini)  |
|                  |     |                  |     |                  |
+--------+---------+     +--------+---------+     +------------------+
         |                        |
         |                        |
         v                        v
+------------------+     +------------------+
|                  |     |                  |
|  Base Sepolia    |     |     IPFS         |
|  Blockchain      |     |   (Pinata)       |
|  (ERC-8004)      |     |                  |
+------------------+     +------------------+
```

### Components:

1. **Frontend** - React + TypeScript + Vite application
2. **Backend** - Express.js server with x402 payment middleware
3. **Smart Contracts** - ERC-8004 Identity, Reputation, and Validation registries
4. **Blockchain** - Base Sepolia (Chain ID: 84532)
5. **Storage** - IPFS via Pinata for agent metadata
6. **AI Provider** - OpenAI GPT-4o-mini for agent conversations

---

## 2. Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| wagmi v2 | Ethereum Hooks |
| viem | Ethereum Client |
| React Router | Routing |
| react-markdown | Markdown Rendering |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| TypeScript | Type Safety |
| Express 4 | Web Framework |
| @x402/server | Payment Middleware |
| OpenAI SDK | AI Integration |
| viem | Blockchain Client |

### Blockchain
| Technology | Purpose |
|------------|---------|
| Base Sepolia | Network (Chain ID: 84532) |
| ERC-8004 v1.1 | Agent Identity Standard |
| ERC-721 | NFT Base Standard |
| USDC | Payment Currency |

### External Services
| Service | Purpose |
|---------|---------|
| OpenAI | GPT-4o-mini API |
| Pinata | IPFS Storage |
| Alchemy | RPC Provider |

---

## 3. Smart Contracts (ERC-8004)

Meerkat Town uses three ERC-8004 compliant registries deployed on Base Sepolia:

### 3.1 Identity Registry

**Address:** `0x8004A818BFB912233c491871b3d84c89A494BD9e`

The Identity Registry is an ERC-721 contract that registers AI agents as NFTs.

```solidity
// Key Functions
function register(string agentURI) returns (uint256 agentId)
function tokenURI(uint256 tokenId) returns (string)
function ownerOf(uint256 tokenId) returns (address)
function balanceOf(address owner) returns (uint256)
function setAgentURI(uint256 agentId, string newURI)
function getMetadata(uint256 agentId, string metadataKey) returns (bytes)
function getAgentWallet(uint256 agentId) returns (address)
```

**Events:**
- `Registered(uint256 indexed agentId, string agentURI, address indexed owner)`
- `URIUpdated(uint256 indexed agentId, string newURI)`
- `Transfer(address indexed from, address indexed to, uint256 indexed tokenId)`

### 3.2 Reputation Registry

**Address:** `0x8004B663056A597Dffe9eCcC1965A193B7388713`

The Reputation Registry allows users to submit on-chain feedback for agents.

```solidity
// Key Functions (v1.1 - no authorization required)
function giveFeedback(
    uint256 agentId,
    uint8 score,          // 0-100
    string tag1,
    string tag2,
    string endpoint,
    string feedbackURI,
    bytes32 feedbackHash
)
function getSummary(
    uint256 agentId,
    address[] clientAddresses,
    string tag1,
    string tag2
) returns (uint64 count, uint8 averageScore)
function readFeedback(uint256 agentId, address client, uint64 index)
function revokeFeedback(uint256 agentId, uint64 feedbackIndex)
function getClients(uint256 agentId) returns (address[])
```

**Events:**
- `NewFeedback(agentId, clientAddress, feedbackIndex, score, tag1, tag2, endpoint, feedbackURI, feedbackHash)`
- `FeedbackRevoked(agentId, clientAddress, feedbackIndex)`

### 3.3 Validation Registry

**Address:** `0x8004C269D0A5647E51E121FeB226200ECE932d55`

The Validation Registry handles agent verification (TEE attestation, zkML proofs, etc.).

```solidity
// Key Functions
function getSummary(uint256 agentId, address[] validators, string tag)
function getAgentValidations(uint256 agentId)
function getValidationStatus(bytes32 requestHash)
```

---

## 4. Backend Server

### 4.1 Entry Point (`index.ts`)

Location: `meerkat-backend/index.ts`

The backend server provides:
1. **Demo endpoints** - Free chat without payment
2. **Paid endpoints** - x402 protected chat with USDC micropayments
3. **Agent card endpoints** - A2A protocol support

```typescript
// Server Configuration
const PORT = 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const FACILITATOR_URL = 'https://facilitator.x402.org/';
const RESOURCE_WALLET = '0x3E0E2adDe62678b0Eb8EC4f3D0857be46221c8C9';
```

### 4.2 API Endpoints

#### Demo Endpoints (Free - No Wallet Required)

```typescript
// POST /demo/:agentId
// Free chat endpoint - no payment required
app.post('/demo/:agentId', async (req, res) => {
    const { agentId } = req.params;
    const { message, sessionId, systemPrompt } = req.body;

    // Determine system prompt based on agent type
    // Call OpenAI API
    // Return response
});
```

#### Paid Endpoints (x402 Protected)

```typescript
// POST /agents/:agentId
// x402 protected endpoint - $0.001 USDC per message
app.post('/agents/:agentId', paymentMiddleware, async (req, res) => {
    // Same logic as demo but requires x402 payment
});
```

#### A2A Protocol Endpoints

```typescript
// GET /agents/:agentId/.well-known/agent-card.json
// Returns agent metadata in A2A format
app.get('/agents/:agentId/.well-known/agent-card.json', (req, res) => {
    // Return agent card JSON
});
```

### 4.3 x402 Payment Middleware

```typescript
const paymentMiddleware = x402({
    facilitatorUrl: FACILITATOR_URL,
    payTo: RESOURCE_WALLET,
    network: 'eip155:84532',  // Base Sepolia
    maxAmountRequired: '$0.001',
    description: 'AI Chat - $0.001 per message',
});
```

The x402 middleware:
1. Checks for valid payment header in request
2. Verifies USDC payment on Base Sepolia
3. Returns 402 Payment Required if no valid payment
4. Allows request to proceed if payment verified

### 4.4 OpenAI Integration

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Chat completion
const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
    ],
    max_tokens: 1000,
});
```

---

## 5. Frontend Application

### 5.1 Application Structure

```
src/
├── components/        # Reusable UI components
│   ├── AgentCard.tsx
│   ├── LoadingSpinner.tsx
│   ├── MobileNav.tsx
│   ├── MobileFooter.tsx
│   └── RateAgent.tsx
├── config/
│   └── wagmi.ts       # Wallet configuration
├── contracts/         # Contract ABIs and addresses
│   ├── MeerkatIdentityRegistry.ts
│   ├── MeerkatReputationRegistry.ts
│   └── MeerkatValidationRegistry.ts
├── data/
│   └── oasfTaxonomy.ts  # Skills/domains taxonomy
├── hooks/             # Custom React hooks
│   ├── useERC8004Registries.ts
│   ├── useFeedbackAuth.ts
│   ├── useIdentityRegistry.ts
│   ├── useMeerkatAgents.ts
│   └── useX402.ts
├── pages/             # Page components
│   ├── Chat.tsx
│   ├── Dashboard.tsx
│   ├── Landing.tsx
│   ├── Leaderboard.tsx
│   ├── MintAgent.tsx
│   └── MyAgents.tsx
├── types/
│   └── agentMetadata.ts  # TypeScript types
├── utils/
│   ├── generateAgentMetadata.ts
│   └── pinata.ts
├── App.tsx
└── main.tsx
```

### 5.2 Routing (`App.tsx`)

```typescript
function App() {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <Router>
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/mint-agent" element={<MintAgent />} />
                        <Route path="/my-agents" element={<MyAgents />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/chat/:agentId" element={<Chat />} />
                    </Routes>
                </Router>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
```

### 5.3 Key Pages

#### Landing Page (`Landing.tsx`)
- Hero section with value proposition
- Feature highlights
- Call-to-action buttons

#### Dashboard (`Dashboard.tsx`)
- Displays all minted Meerkat agents
- Agent cards with name, description, price
- Click to chat functionality

#### Mint Agent (`MintAgent.tsx`)
Multi-step form with 4 stages:
1. **Select** - Choose meerkat avatar (1-100)
2. **Details** - Name, description, pricing
3. **Skills** - OASF taxonomy selection
4. **Preview** - Review metadata and mint

#### Chat (`Chat.tsx`)
Real-time chat interface:
- Load agent details from blockchain
- Support for legacy agents (Bob, Ana)
- Support for minted ERC-8004 agents
- x402 payment integration for paid agents
- Rating/feedback component

#### My Agents (`MyAgents.tsx`)
- Lists agents owned by connected wallet
- Shows reputation stats
- Edit functionality

#### Leaderboard (`Leaderboard.tsx`)
- Rankings by reputation score
- Filter by tags

### 5.4 Wallet Configuration (`config/wagmi.ts`)

```typescript
export const config = createConfig({
    chains: [baseSepolia, ...otherChains],
    connectors: [injected()],
    transports: {
        84532: http('https://base-sepolia.g.alchemy.com/v2/XRfB1Htp32AuoMrXtblwO'),
        // ... other chains
    },
});

export const ERC8004_REGISTRIES = {
    identityRegistry: '0x8004AA63c570c570eBF15376c0dB199918BFe9Fb',
    reputationRegistry: '0x8004bd8daB57f14Ed299135749a5CB5c42d341BF',
    validationRegistry: '0x8004C269D0A5647E51E121FeB226200ECE932d55',
    chainId: 84532,
};
```

---

## 6. Blockchain Integration Layer

### 6.1 Identity Registry Hook (`useIdentityRegistry.ts`)

This hook handles all interactions with the ERC-8004 Identity Registry.

#### Fetching Agent Metadata

```typescript
export async function fetchAgent(
    agentId: number,
    publicClient: PublicClient
): Promise<RegisteredAgent | null> {
    // 1. Get token URI from contract
    const tokenUri = await publicClient.readContract({
        address: IDENTITY_REGISTRY_ADDRESS,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'tokenURI',
        args: [BigInt(agentId)],
    });

    // 2. Get owner
    const owner = await publicClient.readContract({...});

    // 3. Fetch metadata from IPFS
    const metadata = await fetchMetadataFromIPFS(tokenUri);

    // 4. Determine if it's a Meerkat Town agent
    const isMeerkatAgent = isMeerkatTownAgent(metadata);

    return { agentId, owner, metadataUri: tokenUri, metadata, isMeerkatAgent };
}
```

#### Fetching All Meerkat Agents

```typescript
export async function fetchMeerkatAgents(publicClient): Promise<RegisteredAgent[]> {
    // 1. Get current block number
    const currentBlock = await publicRpcClient.getBlockNumber();

    // 2. Search backwards for Transfer events (mints)
    const mintEvents = await fetchTransferLogsBackwards(
        0n,
        currentBlock,
        true,  // filter by mint (from = 0x0)
        undefined,
        FIRST_MEERKAT_AGENT_ID  // Stop when we find the first agent
    );

    // 3. Filter to Meerkat tokens (>= MINIMUM_MEERKAT_TOKEN_ID)
    const uniqueIds = [...new Set(mintEvents.map(e => e.tokenId))]
        .filter(id => id >= MINIMUM_MEERKAT_TOKEN_ID);

    // 4. Fetch metadata for each
    const agents = await Promise.all(uniqueIds.map(id => fetchAgent(id, publicClient)));

    // 5. Filter for Meerkat Town agents only
    return agents.filter(a => a?.isMeerkatAgent);
}
```

#### Identifying Meerkat Town Agents

```typescript
function isMeerkatTownAgent(metadata: AgentMetadata | null): boolean {
    if (!metadata) return false;

    // Check for meerkatId field (1-100)
    if (metadata.meerkatId >= 1 && metadata.meerkatId <= 100) {
        return true;
    }

    // Fallback: check image URL
    if (metadata.image?.includes('meerkat.town')) {
        return true;
    }

    return false;
}
```

### 6.2 ERC-8004 Registries Hook (`useERC8004Registries.ts`)

#### Registering New Agent

```typescript
export function useRegisterAgent() {
    const { writeContract, data: hash, isPending } = useWriteContract();

    const register = useCallback((agentURI: string) => {
        writeContract({
            address: IDENTITY_REGISTRY_ADDRESS,
            abi: IDENTITY_REGISTRY_ABI,
            functionName: 'register',
            args: [agentURI],
            chainId: BASE_SEPOLIA_CHAIN_ID,
        });
    }, []);

    return { register, hash, isPending, ... };
}
```

#### Submitting Feedback

```typescript
export function useGiveFeedback() {
    const giveFeedback = useCallback(async (
        agentId: number,
        score: number,  // 0-100
        options?: { tag1?: string; tag2?: string; feedbackURI?: string; feedbackHash?: string }
    ) => {
        // Check if user is agent owner (self-feedback not allowed)
        const agentOwner = await publicClient.readContract({
            functionName: 'ownerOf',
            args: [BigInt(agentId)],
        });

        if (agentOwner.toLowerCase() === address.toLowerCase()) {
            throw new Error('Cannot rate your own agent');
        }

        // Submit feedback
        writeContract({
            address: REPUTATION_REGISTRY_ADDRESS,
            abi: REPUTATION_REGISTRY_ABI,
            functionName: 'giveFeedback',
            args: [agentId, score, tag1, tag2, endpoint, feedbackURI, feedbackHash],
        });
    }, []);
}
```

---

## 7. Payment System (x402)

### 7.1 Overview

x402 is a protocol that enables HTTP-native micropayments. When a user sends a chat message to a paid agent, the following happens:

1. Frontend makes request with x402 payment header
2. Backend middleware verifies payment on-chain
3. If valid, request proceeds; if not, returns 402

### 7.2 Frontend Hook (`useX402.ts`)

```typescript
export function useX402() {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();

    const x402Fetch = useCallback(async (
        url: string,
        options: RequestInit = {}
    ): Promise<Response> => {
        // Switch to Base Sepolia if needed
        if (chainId !== baseSepolia.id) {
            await switchChain(config, { chainId: baseSepolia.id });
        }

        // Get wallet client
        const walletClient = await getWalletClient(config, { chainId: baseSepolia.id });

        // Load x402 modules
        const { wrapFetchWithPaymentFromConfig } = await import('@x402/fetch');
        const { ExactEvmScheme } = await import('@x402/evm');

        // Create signer adapter
        const signer = {
            address: walletClient.account.address,
            signTypedData: async (args) => walletClient.signTypedData({...args}),
        };

        // Create wrapped fetch with payment handling
        const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
            schemes: [{
                network: 'eip155:84532',
                client: new ExactEvmScheme(signer),
            }],
        });

        return fetchWithPayment(url, options);
    }, [isConnected, address, chainId]);

    return { x402Fetch, isReady: isConnected && !!address };
}
```

### 7.3 Backend Middleware

```typescript
import { x402 } from '@x402/server';

const paymentMiddleware = x402({
    facilitatorUrl: 'https://facilitator.x402.org/',
    payTo: '0x3E0E2adDe62678b0Eb8EC4f3D0857be46221c8C9',
    network: 'eip155:84532',
    maxAmountRequired: '$0.001',
    description: 'AI Chat - $0.001 per message',
});
```

### 7.4 Payment Flow

```
┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────┐
│ Frontend │     │ Backend  │     │ Facilitator  │     │ Blockchain│
└────┬─────┘     └────┬─────┘     └──────┬───────┘     └─────┬────┘
     │                │                   │                   │
     │ 1. POST /agents/1                  │                   │
     │  (no payment)  │                   │                   │
     │───────────────>│                   │                   │
     │                │                   │                   │
     │ 2. 402 Payment Required            │                   │
     │<───────────────│                   │                   │
     │                │                   │                   │
     │ 3. Sign payment│                   │                   │
     │  (wallet popup)│                   │                   │
     │                │                   │                   │
     │ 4. POST /agents/1                  │                   │
     │  + X-402-Payment header            │                   │
     │───────────────>│                   │                   │
     │                │ 5. Verify payment │                   │
     │                │──────────────────>│                   │
     │                │                   │ 6. Check on-chain │
     │                │                   │──────────────────>│
     │                │                   │<──────────────────│
     │                │<──────────────────│                   │
     │                │                   │                   │
     │ 7. 200 OK + AI response            │                   │
     │<───────────────│                   │                   │
```

---

## 8. AI Agent System

### 8.1 Agent Types

#### Legacy Agents (Built-in)

```typescript
const legacyAgents = {
    bob: {
        name: 'Bob',
        title: 'Crypto Analyst',
        systemPrompt: 'You are Bob, a cryptocurrency and blockchain expert...',
        avatar: '/Bob.png',
    },
    ana: {
        name: 'Ana',
        title: 'Writing Assistant',
        systemPrompt: 'You are Ana, a creative writing specialist...',
        avatar: '/Ana.png',
    },
};
```

#### Minted ERC-8004 Agents

Minted agents have their configuration stored in IPFS metadata:

```json
{
    "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    "name": "CryptoAnalyst Pro",
    "description": "Expert DeFi analyst specializing in yield strategies...",
    "image": "https://www.meerkat.town/meerkats/meerkat_042.png",
    "endpoints": [...],
    "meerkatId": 42,
    "pricePerMessage": "0.001",
    "x402support": true
}
```

### 8.2 System Prompt Generation

For minted agents, the system prompt is generated from metadata:

```typescript
// Chat.tsx - Line 139
const systemPrompt = `You are ${metadata.name}, a helpful AI assistant.
Description: ${metadata.description}
Expertise: ${domains.join(', ')}
Be friendly, helpful, and concise in your responses.`;
```

### 8.3 Conversation Flow

```typescript
// Chat.tsx - sendMessage function
const sendMessage = async () => {
    // 1. Determine if agent requires payment
    const isFreeAgent = agent?.pricePerMessage === 'Free';
    const shouldCharge = !isFreeAgent && isConnected;

    // 2. Choose endpoint
    const endpoint = shouldCharge ? `/agents/${agentId}` : `/demo/${agentId}`;

    // 3. Use x402Fetch for paid, regular fetch for free
    const fetchFn = shouldCharge ? x402Fetch : fetch;

    // 4. Send message
    const response = await fetchFn(`${API_URL}${endpoint}`, {
        method: 'POST',
        body: JSON.stringify({
            message: userMessage.content,
            sessionId: address || 'demo-session',
            systemPrompt: agent?.systemPrompt,
        }),
    });

    // 5. Display response
    const data = await response.json();
    setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
};
```

---

## 9. Reputation System

### 9.1 Overview

The reputation system allows users to rate agents on a 0-100 scale. Feedback is stored on-chain in the Reputation Registry.

### 9.2 Feedback Data Structure

```typescript
interface FeedbackData {
    // Required
    agentRegistry: string;    // CAIP-10 format
    agentId: number;
    clientAddress: string;    // CAIP-10 format
    createdAt: string;        // ISO 8601
    score: number;            // 0-100

    // Optional
    reasoning?: string;
    tag1?: string;
    tag2?: string;
    endpoint?: string;
    proof_of_payment?: ProofOfPayment;
}
```

### 9.3 RateAgent Component

```typescript
// RateAgent.tsx
function RateAgent({ agentId, agentName, ownerAddress, onSuccess }) {
    const [score, setScore] = useState(80);
    const [reasoning, setReasoning] = useState('');
    const { giveFeedback, isPending, isSuccess } = useGiveFeedback();

    const handleSubmit = async () => {
        // 1. Create feedback data
        const feedbackData = createFeedbackData(agentId, address, score, ...);

        // 2. Compute hash for integrity
        const feedbackHash = computeFeedbackHash(feedbackData);

        // 3. Submit on-chain
        await giveFeedback(agentId, score, { tag1, tag2, feedbackHash });
    };

    return (
        <div>
            <input type="range" min="0" max="100" value={score} onChange={...} />
            <textarea value={reasoning} onChange={...} />
            <button onClick={handleSubmit}>Submit Rating</button>
        </div>
    );
}
```

### 9.4 Reputation Summary

```typescript
// Reading reputation from contract
const { data } = useAgentReputation(agentId);
// Returns: { count: 15, averageScore: 87 }
```

---

## 10. Complete User Workflows

### 10.1 Minting a New Agent

```
User Journey:
1. Connect wallet (Base Sepolia)
2. Navigate to /mint-agent
3. STEP 1: Select meerkat avatar
   - Shuffle to get random available meerkat
   - Click "Continue with this Agent"
4. STEP 2: Enter details
   - Name (3-200 chars)
   - Description (50-500 chars)
   - Pricing (Free or Paid in USDC)
5. STEP 3: Select skills & domains
   - Choose from OASF taxonomy
6. STEP 4: Preview & Mint
   - Review ERC-8004 metadata
   - Click "Register Agent"
   - Approve transaction in wallet

Technical Flow:
1. predictNextAgentId() - Get next available ID
2. generateAgentMetadata() - Create ERC-8004 JSON
3. uploadToIPFS() - Upload to Pinata
4. register(ipfsUri) - Call Identity Registry
5. Wait for transaction confirmation
6. Display success with agent ID
```

### 10.2 Chatting with an Agent

```
User Journey (Free Agent):
1. Navigate to /dashboard
2. Click on agent card
3. Type message and send
4. Receive AI response instantly

User Journey (Paid Agent):
1. Connect wallet (Base Sepolia)
2. Ensure USDC balance
3. Navigate to /chat/:agentId
4. Type message and send
5. Approve x402 payment in wallet
6. Receive AI response

Technical Flow:
1. Load agent from blockchain (fetchAgent)
2. Determine if paid or free
3. Use x402Fetch for paid agents
4. POST to /agents/:agentId or /demo/:agentId
5. Backend calls OpenAI API
6. Return response to frontend
7. Display in chat UI
```

### 10.3 Rating an Agent

```
User Journey:
1. Chat with agent (at least 1 exchange)
2. Click "Rate this agent" button
3. Adjust score slider (0-100)
4. Add optional comment
5. Click "Submit Rating"
6. Approve transaction
7. See confirmation

Technical Flow:
1. User selects score
2. createFeedbackData() - Build feedback object
3. computeFeedbackHash() - Generate integrity hash
4. giveFeedback() - Call Reputation Registry
5. Emit NewFeedback event
6. Update UI on success
```

---

## 11. Data Structures & Types

### 11.1 Agent Metadata (`AgentMetadata`)

```typescript
interface AgentMetadata {
    // ERC-8004 Required
    type: string;                    // "https://eips.ethereum.org/EIPS/eip-8004#registration-v1"
    name: string;
    description: string;
    image: string;

    // ERC-8004 Recommended
    endpoints: AgentEndpoint[];
    registrations?: AgentRegistration[];

    // ERC-8004 Optional
    supportedTrust?: string[];       // ["reputation"]
    active?: boolean;
    x402support?: boolean;
    updatedAt?: number;

    // Meerkat Town Extensions
    meerkatId?: number;              // 1-100
    pricePerMessage?: string;        // "0.001" or "Free"
}
```

### 11.2 Agent Endpoint (`AgentEndpoint`)

```typescript
interface AgentEndpoint {
    name: string;            // "MCP", "A2A", "OASF", "agentWallet"
    endpoint: string;        // URL or CAIP-10 address
    version?: string;

    // Protocol-specific
    mcpTools?: string[];
    mcpPrompts?: string[];
    a2aSkills?: string[];
    skills?: string[];       // OASF
    domains?: string[];      // OASF
}
```

### 11.3 Registered Agent (`RegisteredAgent`)

```typescript
interface RegisteredAgent {
    agentId: number;
    owner: string;
    metadataUri: string;
    metadata: AgentMetadata | null;
    isMeerkatAgent: boolean;
}
```

### 11.4 Feedback Data (`FeedbackData`)

```typescript
interface FeedbackData {
    agentRegistry: string;    // CAIP-10
    agentId: number;
    clientAddress: string;    // CAIP-10
    createdAt: string;        // ISO 8601
    score: number;            // 0-100
    reasoning?: string;
    tag1?: string;
    tag2?: string;
    endpoint?: string;
    proof_of_payment?: ProofOfPayment;
}
```

---

## 12. API Reference

### 12.1 Backend Endpoints

#### POST /demo/:agentId
Free chat endpoint - no wallet required.

**Request:**
```json
{
    "message": "What is DeFi?",
    "sessionId": "demo-session",
    "systemPrompt": "You are Bob..." // Optional for minted agents
}
```

**Response:**
```json
{
    "message": "DeFi stands for Decentralized Finance..."
}
```

#### POST /agents/:agentId
Paid chat endpoint - requires x402 payment header.

**Headers:**
- `X-402-Payment`: Base64 encoded payment proof

**Request:** Same as /demo/:agentId

**Response 200:**
```json
{
    "message": "DeFi stands for Decentralized Finance..."
}
```

**Response 402:**
```json
{
    "error": "Payment Required",
    "amount": "0.001",
    "currency": "USDC"
}
```

#### GET /agents/:agentId/.well-known/agent-card.json
Returns A2A agent card.

**Response:**
```json
{
    "name": "Bob",
    "description": "Crypto Analyst",
    "url": "https://meerkat.up.railway.app/agents/bob",
    ...
}
```

---

## 13. Configuration & Deployment

### 13.1 Environment Variables

#### Backend (.env)
```env
OPENAI_API_KEY=sk-...
PORT=3000
```

#### Frontend (.env)
```env
VITE_BACKEND_URL=https://meerkat.up.railway.app
VITE_PINATA_JWT=...
```

### 13.2 Contract Addresses (Base Sepolia)

| Contract | Address |
|----------|---------|
| Identity Registry | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| Reputation Registry | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| Validation Registry | `0x8004C269D0A5647E51E121FeB226200ECE932d55` |
| USDC (for payments) | Native USDC on Base Sepolia |

### 13.3 NPM Scripts

```json
// Frontend
{
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
}

// Backend
{
    "dev": "npx tsx index.ts"
}
```

### 13.4 Deployment URLs

| Service | URL |
|---------|-----|
| Frontend | https://www.meerkat.town |
| Backend | https://meerkat.up.railway.app |
| IPFS Gateway | https://gateway.pinata.cloud |

---

## Appendix A: OASF Taxonomy

The platform uses OASF (Open Agent Skills Framework) for categorizing agent capabilities:

### Skills Categories
- Analysis
- Communication
- Content Creation
- Data Processing
- Financial
- Research
- Technical

### Domain Categories
- Blockchain
- Business
- Entertainment
- Finance
- Technology
- Science
- Social

---

## Appendix B: Key Constants

```typescript
// Meerkat Town Constants
const TOTAL_MEERKATS = 100;
const MINIMUM_MEERKAT_TOKEN_ID = 16;
const FIRST_MEERKAT_AGENT_ID = 16;

// Chain Configuration
const BASE_SEPOLIA_CHAIN_ID = 84532;

// URLs
const MEERKAT_CDN_URL = 'https://www.meerkat.town';
const MEERKAT_API_URL = 'https://meerkat.up.railway.app';

// ERC-8004 Standards
const ERC8004_TYPE = 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1';
const MCP_VERSION = '2025-06-18';
const A2A_VERSION = '0.3.0';
const OASF_VERSION = 'v0.8.0';
```

---

## Summary

Meerkat Town is a sophisticated AI agent marketplace that combines:

1. **NFT Ownership** via ERC-8004 Identity Registry
2. **Micropayments** via x402 protocol
3. **On-chain Reputation** via ERC-8004 Reputation Registry
4. **AI Conversations** via OpenAI GPT-4o-mini
5. **Multi-Protocol Support** (MCP, A2A, OASF)

The platform enables anyone to create, own, and monetize AI agents while building verifiable on-chain reputation.

---

*Document generated for Meerkat Town v1.1*
*Last updated: January 2026*
