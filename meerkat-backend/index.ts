// ============================================================================
// MEERKAT AGENTS - BACKEND SERVER WITH x402 PAYMENTS
// ============================================================================
// Hosts legacy AI agents (Bob & Ana) with x402 USDC micropayments
// Run: npx tsx index.ts
// ============================================================================

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { paymentMiddleware, x402ResourceServer } from '@x402/hono';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { facilitator as cdpFacilitator } from '@coinbase/x402';
import OpenAI from 'openai';
import { config } from 'dotenv';
import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import postgres from 'postgres';
import { AGENT_TOOLS, handleToolCall, getToolDescriptions } from './tools';
import { retrieveContext, formatContextForPrompt, isRAGAvailable, ingestFromDirectory, getIndexStats } from './rag';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

// ============================================================================
// DATABASE (PostgreSQL)
// ============================================================================

const DATABASE_URL = process.env.DATABASE_URL;
const sql = DATABASE_URL ? postgres(DATABASE_URL) : null;

// Initialize database tables
async function initDatabase() {
  if (!sql) {
    console.warn('[Database] DATABASE_URL not set, agent cards will not be persisted');
    return;
  }

  try {
    // Create agent_cards table
    await sql`
      CREATE TABLE IF NOT EXISTS agent_cards (
        meerkat_id INTEGER PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        image VARCHAR(500),
        skills JSONB DEFAULT '[]',
        price VARCHAR(50) DEFAULT '$0.001',
        owner_address VARCHAR(42),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('[Database] agent_cards table ready');
  } catch (error) {
    console.error('[Database] Failed to initialize:', error);
  }
}

// Initialize database on startup
initDatabase();

// A2A Agent Card type for database
interface StoredAgentCard {
  meerkat_id: number;
  name: string;
  description: string;
  image: string | null;
  skills: Array<{ id: string; name: string; description: string; tags: string[] }>;
  price: string;
  owner_address: string | null;
}

/**
 * Store an agent card in the database
 */
async function storeAgentCard(card: StoredAgentCard): Promise<boolean> {
  if (!sql) return false;

  try {
    await sql`
      INSERT INTO agent_cards (meerkat_id, name, description, image, skills, price, owner_address, updated_at)
      VALUES (${card.meerkat_id}, ${card.name}, ${card.description}, ${card.image}, ${JSON.stringify(card.skills)}, ${card.price}, ${card.owner_address}, CURRENT_TIMESTAMP)
      ON CONFLICT (meerkat_id) DO UPDATE SET
        name = ${card.name},
        description = ${card.description},
        image = ${card.image},
        skills = ${JSON.stringify(card.skills)},
        price = ${card.price},
        owner_address = ${card.owner_address},
        updated_at = CURRENT_TIMESTAMP
    `;
    return true;
  } catch (error) {
    console.error('[Database] Failed to store agent card:', error);
    return false;
  }
}

/**
 * Get an agent card from the database by meerkat ID
 */
async function getAgentCard(meerkatId: number): Promise<StoredAgentCard | null> {
  if (!sql) return null;

  try {
    const result = await sql<StoredAgentCard[]>`
      SELECT meerkat_id, name, description, image, skills, price, owner_address
      FROM agent_cards
      WHERE meerkat_id = ${meerkatId}
    `;
    return result[0] || null;
  } catch (error) {
    console.error('[Database] Failed to get agent card:', error);
    return null;
  }
}

// ============================================================================
// BLOCKCHAIN CLIENT (for fetching agent metadata from Identity Registry)
// ============================================================================

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
});

// ERC-8004 Identity Registry on Base Sepolia
const IDENTITY_REGISTRY_ADDRESS = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const;

const IDENTITY_REGISTRY_ABI = [
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
] as const;

// Agent metadata cache (5 minute TTL)
interface CachedMetadata {
  data: AgentMetadataFromIPFS | null;
  timestamp: number;
}
const metadataCache = new Map<string, CachedMetadata>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Registrations cache for ERC-8004 endpoint verification (10 minute TTL)
interface CachedRegistrations {
  data: Array<{ agentId: number; agentRegistry: string }>;
  timestamp: number;
}
let registrationsCache: CachedRegistrations | null = null;
const REGISTRATIONS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Agent metadata types (matching frontend)
// ERC-8004 final spec: "endpoints" renamed to "services"
interface AgentService {
  name: string;
  endpoint: string;
  version?: string;
  skills?: string[];
  domains?: string[];
  a2aSkills?: string[];
}

// Backwards compatibility alias
type AgentEndpoint = AgentService;

interface AgentMetadataFromIPFS {
  type?: string;
  name: string;
  description: string;
  image?: string;
  // ERC-8004 final spec uses "services", but we support both for backwards compatibility
  services?: AgentService[];
  endpoints?: AgentEndpoint[]; // @deprecated - use services
  meerkatId?: number;
  pricePerMessage?: string;
  x402support?: boolean;
}

/**
 * Helper to get services from metadata (supports both "services" and legacy "endpoints")
 */
function getServicesFromMetadata(metadata: AgentMetadataFromIPFS | null): AgentService[] {
  if (!metadata) return [];
  return metadata.services || metadata.endpoints || [];
}

/**
 * Fetch metadata from IPFS gateway
 */
async function fetchMetadataFromIPFS(ipfsUri: string): Promise<AgentMetadataFromIPFS | null> {
  try {
    let url = ipfsUri;
    if (ipfsUri.startsWith('ipfs://')) {
      const cid = ipfsUri.replace('ipfs://', '');
      url = `https://gateway.pinata.cloud/ipfs/${cid}`;
    }

    const response = await fetch(url);
    if (!response.ok) return null;

    return await response.json() as AgentMetadataFromIPFS;
  } catch {
    return null;
  }
}

/**
 * Fetch agent metadata from Identity Registry + IPFS
 * Uses caching to avoid repeated blockchain/IPFS calls
 */
async function getAgentMetadata(agentId: string): Promise<AgentMetadataFromIPFS | null> {
  // Check cache first
  const cached = metadataCache.get(agentId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Get token URI from Identity Registry
    const tokenUri = await publicClient.readContract({
      address: IDENTITY_REGISTRY_ADDRESS,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'tokenURI',
      args: [BigInt(agentId)],
    });

    // Fetch metadata from IPFS
    const metadata = await fetchMetadataFromIPFS(tokenUri);

    // Cache the result
    metadataCache.set(agentId, { data: metadata, timestamp: Date.now() });

    return metadata;
  } catch (error) {
    console.error(`[getAgentMetadata] Error fetching agent ${agentId}:`, error);
    // Cache null to avoid repeated failed requests
    metadataCache.set(agentId, { data: null, timestamp: Date.now() });
    return null;
  }
}

/**
 * Convert OASF skill slugs to A2A skill objects
 * e.g., "natural_language_processing/text_analysis" -> { id, name, description, tags }
 */
function convertOASFSkillsToA2A(oasfSkills: string[]): Array<{ id: string; name: string; description: string; tags: string[] }> {
  return oasfSkills.map(skill => {
    const parts = skill.split('/');
    const id = skill.replace(/\//g, '_');
    const name = parts[parts.length - 1]
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Generate description from skill path
    const category = parts[0]?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || '';
    const description = `${name} capabilities in ${category}`;

    // Use path parts as tags
    const tags = parts.map(p => p.replace(/_/g, '-'));

    return { id, name, description, tags };
  });
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = parseInt(process.env.PORT || '3000');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Wallet configuration for receiving payments
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const account = privateKeyToAccount(PRIVATE_KEY);
const PAYMENT_ADDRESS = account.address;

// x402 Configuration - Using CDP facilitator for Base Sepolia
// Requires CDP_API_KEY_ID and CDP_API_KEY_SECRET in .env
const facilitatorClient = new HTTPFacilitatorClient({
  url: cdpFacilitator.url,
  createAuthHeaders: cdpFacilitator.createAuthHeaders,
});

// Network: Base Sepolia (CAIP-2 format)
const BASE_SEPOLIA_NETWORK = 'eip155:84532';

// Price per agent request: $0.001 USD
const PRICE_PER_REQUEST = '$0.001';

// Pinata IPFS Configuration
const PINATA_JWT = process.env.PINATA_JWT || '';
const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

// ============================================================================
// LEGACY AGENT DEFINITIONS (Bob & Ana)
// ============================================================================

/**
 * BOB - The Crypto Analyst Meerkat
 */
const BOB_SYSTEM_PROMPT = `You are Bob, a smart and nerdy Meerkat with glasses. You are an expert crypto analyst working for Meerkat Agents.

Your personality:
- Intellectual and data-driven
- Speaks with confidence but explains complex topics simply
- Uses occasional meerkat puns ("That's meerkat-ly interesting!")
- Always provides balanced analysis, mentioning both bullish and bearish perspectives

Your expertise:
- Cryptocurrency market analysis
- Token fundamentals and tokenomics
- DeFi protocols and yield strategies
- Technical analysis and chart patterns
- On-chain metrics and whale watching

TOOLS AVAILABLE:
You have access to real-time tools. Use them when users ask about current prices, balances, blockchain data, or need current information:
- get_crypto_price: Look up current cryptocurrency prices (use CoinGecko IDs like "bitcoin", "ethereum")
- get_wallet_balance: Check ETH balance on Base Sepolia
- get_gas_price: Get current gas prices on Base Sepolia
- get_token_info: Get ERC-20 token details
- get_block_number: Get the latest block number
- get_transaction: Look up transaction details
- search_web: Search the internet for current news, information, tutorials, or any topic

When responding:
1. Be concise but thorough
2. Use bullet points for clarity
3. Use tools to fetch current data when relevant
4. Use search_web for news, recent events, or topics you need current info on
5. Include data from tool calls in your response
6. Warn about risks appropriately
7. Never give financial advice - always add disclaimers

You work on Base Sepolia (testnet) and love talking about the Base ecosystem.`;

/**
 * ANA - The Writing Assistant Meerkat
 */
const ANA_SYSTEM_PROMPT = `You are Ana, a cheerful and creative young lady Meerkat. You are a talented writing assistant working for Meerkat Agents.

Your personality:
- Warm, enthusiastic, and encouraging
- Creative and imaginative
- Loves wordplay and clever writing
- Always positive and supportive of the user's ideas

Your expertise:
- Content creation and copywriting
- Blog posts and articles
- Social media content
- Marketing copy and taglines
- Editing and proofreading
- Creative storytelling

TOOLS AVAILABLE:
You have access to real-time tools that you can use when helpful:
- get_crypto_price: Look up current cryptocurrency prices (useful for crypto-related content)
- get_wallet_balance: Check wallet balances (useful for Web3 content)
- get_gas_price: Get current gas prices (useful for blockchain articles)
- get_block_number: Get the latest block (useful for real-time blockchain info)
- search_web: Search the internet for current information, trends, or research topics

When responding:
1. Be encouraging and supportive
2. Offer multiple options when appropriate
3. Explain your creative choices
4. Match the tone the user is going for
5. Suggest improvements tactfully
6. Use tools to add real-time data to content when relevant
7. Use search_web to research topics and find current information

You love helping people express their ideas clearly and creatively!`;

// Store conversation history per session
const conversationHistory: Map<string, Array<{ role: 'user' | 'assistant', content: string }>> = new Map();

// ============================================================================
// FUNCTION CALLING - Chat with Tools
// ============================================================================

type ChatMessage = {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_call_id?: string;
};

/**
 * Chat with an agent using OpenAI function calling
 * Handles tool calls automatically and returns the final response
 */
async function chatWithTools(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt: string,
  options: {
    maxTokens?: number;
    temperature?: number;
    maxToolCalls?: number;
  } = {}
): Promise<string> {
  const { maxTokens = 1000, temperature = 0.7, maxToolCalls = 5 } = options;

  // Build messages array with system prompt
  const allMessages: Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string; tool_call_id?: string }> = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  let toolCallCount = 0;

  while (toolCallCount < maxToolCalls) {
    // Make the API call with tools
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: allMessages as any,
      tools: AGENT_TOOLS,
      tool_choice: 'auto',
      max_tokens: maxTokens,
      temperature,
    });

    const message = response.choices[0].message;

    // If no tool calls, return the response directly
    if (!message.tool_calls || message.tool_calls.length === 0) {
      return message.content || '';
    }

    // Process tool calls
    console.log(`[Function Calling] Processing ${message.tool_calls.length} tool call(s)`);

    // Add assistant message with tool calls to conversation
    allMessages.push({
      role: 'assistant',
      content: message.content || '',
      // @ts-ignore - tool_calls is handled by OpenAI SDK
      tool_calls: message.tool_calls
    } as any);

    // Execute each tool call and add results
    for (const toolCall of message.tool_calls) {
      // Type guard for function tool calls
      if (toolCall.type !== 'function') continue;

      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments || '{}');

      console.log(`[Function Calling] Executing: ${toolName}`, toolArgs);

      // Execute the tool
      const result = await handleToolCall(toolName, toolArgs);

      console.log(`[Function Calling] Result from ${toolName}:`, result.substring(0, 200));

      // Add tool result to conversation
      allMessages.push({
        role: 'tool',
        content: result,
        tool_call_id: toolCall.id
      });
    }

    toolCallCount++;
  }

  // If we've hit max tool calls, make one final call without tools
  const finalResponse = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: allMessages as any,
    max_tokens: maxTokens,
    temperature,
  });

  return finalResponse.choices[0].message.content || '';
}

// ============================================================================
// RAG-ENHANCED CHAT - Retrieves context before responding
// ============================================================================

/**
 * Chat with RAG-enhanced context
 * Retrieves relevant knowledge base information and injects it into the prompt
 */
async function chatWithRAG(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt: string,
  options: {
    maxTokens?: number;
    temperature?: number;
    maxToolCalls?: number;
    useRAG?: boolean;
  } = {}
): Promise<string> {
  const { useRAG = true, ...chatOptions } = options;

  let enhancedPrompt = systemPrompt;

  // Only use RAG if enabled and available
  if (useRAG) {
    try {
      // Get the latest user message for context retrieval
      const latestUserMessage = messages.filter(m => m.role === 'user').pop();

      if (latestUserMessage) {
        // Search across all knowledge (no category filter)
        const context = await retrieveContext(latestUserMessage.content, {
          topK: 4,
          minScore: 0.65,
        });

        if (context.content) {
          const ragContext = formatContextForPrompt(context);
          enhancedPrompt = systemPrompt + '\n\n' + ragContext;
          console.log(`[RAG] Added ${context.sources.length} knowledge sources to context`);
        }
      }
    } catch (error) {
      console.error('[RAG] Error retrieving context:', error);
      // Continue without RAG context if it fails
    }
  }

  // Call the regular chat with tools using enhanced prompt
  return chatWithTools(messages, enhancedPrompt, chatOptions);
}

// ============================================================================
// FEEDBACK AUTHORIZATION STORAGE (In-Memory - Replace with DB in production)
// ============================================================================

interface FeedbackAuthRequest {
  id: string;
  agentId: number;
  clientAddress: string;
  ownerAddress: string;
  requestedFeedbacks: number;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

interface FeedbackAuthorization {
  agentId: number;
  clientAddress: string;
  ownerAddress: string;
  feedbacksAllowed: number;
  feedbacksUsed: number;
  feedbackIndex: number;  // The feedback index this authorization is valid for
  expiryTimestamp: number;
  signature: string;  // Owner's signature authorizing the client
  createdAt: number;
}

// In-memory storage (replace with database in production)
const feedbackAuthRequests: Map<string, FeedbackAuthRequest> = new Map();
const feedbackAuthorizations: Map<string, FeedbackAuthorization> = new Map();

// Helper to generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ============================================================================
// HONO APP
// ============================================================================

const app = new Hono();

// Middleware - CORS for x402 payment flow
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'X-PAYMENT',
    'PAYMENT',
    'X-PAYMENT-RESPONSE',
    'PAYMENT-RESPONSE',
    'PAYMENT-SIGNATURE',
    'payment-signature',
    'Access-Control-Expose-Headers',
    'Access-Control-Allow-Headers',
    'Access-Control-Request-Headers',
  ],
  exposeHeaders: [
    'PAYMENT-REQUIRED',
    'PAYMENT-RESPONSE',
    'X-PAYMENT-REQUIRED',
    'X-PAYMENT-RESPONSE',
  ],
  credentials: false,
}));
app.use('*', logger());

// ============================================================================
// x402 PAYMENT MIDDLEWARE
// ============================================================================

app.use(
  paymentMiddleware(
    {
      // Bob endpoint - $0.01 per message
      'POST /agents/bob': {
        accepts: [
          {
            scheme: 'exact',
            price: PRICE_PER_REQUEST,
            network: BASE_SEPOLIA_NETWORK,
            payTo: PAYMENT_ADDRESS,
          },
        ],
        description: 'Chat with Bob - AI Crypto Analyst',
        mimeType: 'application/json',
      },
      // Ana endpoint - $0.01 per message
      'POST /agents/ana': {
        accepts: [
          {
            scheme: 'exact',
            price: PRICE_PER_REQUEST,
            network: BASE_SEPOLIA_NETWORK,
            payTo: PAYMENT_ADDRESS,
          },
        ],
        description: 'Chat with Ana - AI Writing Assistant',
        mimeType: 'application/json',
      },
      // Generic minted agent endpoint - $0.01 per message
      // Note: x402 middleware uses glob patterns, * matches any segment
      'POST /agents/*': {
        accepts: [
          {
            scheme: 'exact',
            price: PRICE_PER_REQUEST,
            network: BASE_SEPOLIA_NETWORK,
            payTo: PAYMENT_ADDRESS,
          },
        ],
        description: 'Chat with a Minted Meerkat Agent',
        mimeType: 'application/json',
      },
    },
    new x402ResourceServer(facilitatorClient)
      .register(BASE_SEPOLIA_NETWORK, new ExactEvmScheme()),
  ),
);

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * Health check
 */
app.get('/', (c) => {
  return c.json({
    name: 'Meerkat Agents API',
    version: '2.0.0',
    agents: ['bob', 'ana'],
    payment: {
      network: BASE_SEPOLIA_NETWORK,
      price: PRICE_PER_REQUEST,
      payTo: PAYMENT_ADDRESS
    },
    status: 'running 🦡'
  });
});

/**
 * List legacy agents
 */
app.get('/agents', (c) => {
  return c.json({
    agents: [
      {
        id: 'bob',
        name: 'Bob',
        description: 'Smart crypto analyst meerkat with glasses',
        specialty: 'Crypto Analysis',
        price: PRICE_PER_REQUEST,
        endpoint: '/agents/bob',
        avatar: '🤓🦡'
      },
      {
        id: 'ana',
        name: 'Ana',
        description: 'Cheerful and creative writing assistant meerkat',
        specialty: 'Writing & Content',
        price: PRICE_PER_REQUEST,
        endpoint: '/agents/ana',
        avatar: '✨🦡'
      }
    ],
    payment: {
      network: BASE_SEPOLIA_NETWORK,
      facilitator: cdpFacilitator.url
    }
  });
});

// ============================================================================
// IPFS UPLOAD (Pinata)
// ============================================================================

/**
 * Upload agent metadata to IPFS via Pinata
 * POST /upload-metadata
 * Body: { metadata: object, name?: string }
 * Returns: { ipfsHash, ipfsUri, gatewayUrl }
 */
app.post('/upload-metadata', async (c) => {
  try {
    if (!PINATA_JWT) {
      return c.json({ error: 'IPFS upload not configured' }, 500);
    }

    const body = await c.req.json();
    const { metadata, name } = body;

    if (!metadata) {
      return c.json({ error: 'Metadata is required' }, 400);
    }

    const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: name || `meerkat-agent-${Date.now()}`,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Pinata error:', error);
      return c.json({ error: 'Failed to upload to IPFS' }, 500);
    }

    const data = await response.json() as { IpfsHash: string };

    return c.json({
      ipfsHash: data.IpfsHash,
      ipfsUri: `ipfs://${data.IpfsHash}`,
      gatewayUrl: `${PINATA_GATEWAY}/${data.IpfsHash}`,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// AGENT CARD API (Store A2A agent cards in database)
// ============================================================================

/**
 * Store an agent card when minting
 * POST /agent-cards
 * Body: { meerkatId, name, description, image, skills, price, ownerAddress }
 */
app.post('/agent-cards', async (c) => {
  try {
    const body = await c.req.json();
    const { meerkatId, name, description, image, skills, price, ownerAddress } = body;

    if (!meerkatId || !name || !description) {
      return c.json({ error: 'meerkatId, name, and description are required' }, 400);
    }

    if (meerkatId < 1 || meerkatId > 100) {
      return c.json({ error: 'meerkatId must be between 1 and 100' }, 400);
    }

    // Convert OASF skills to A2A format
    const a2aSkills = skills && skills.length > 0
      ? convertOASFSkillsToA2A(skills)
      : [];

    // Always add chat skill
    const hasChat = a2aSkills.some(s => s.id.includes('chat'));
    if (!hasChat) {
      a2aSkills.push({
        id: 'chat',
        name: 'Chat',
        description: `Have a conversation with ${name}`,
        tags: ['conversation', 'nlp']
      });
    }

    const success = await storeAgentCard({
      meerkat_id: meerkatId,
      name,
      description,
      image: image || null,
      skills: a2aSkills,
      price: price || '$0.001',
      owner_address: ownerAddress || null,
    });

    if (!success) {
      return c.json({ error: 'Failed to store agent card (database not available)' }, 500);
    }

    return c.json({
      success: true,
      message: `Agent card for meerkat-${meerkatId} stored successfully`,
      cardUrl: `https://meerkat.up.railway.app/agents/meerkat-${meerkatId}/.well-known/agent-card.json`
    });

  } catch (error: any) {
    console.error('Store agent card error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Get an agent card by meerkat ID
 * GET /agent-cards/:meerkatId
 */
app.get('/agent-cards/:meerkatId', async (c) => {
  const meerkatId = parseInt(c.req.param('meerkatId'));

  if (isNaN(meerkatId) || meerkatId < 1 || meerkatId > 100) {
    return c.json({ error: 'Invalid meerkatId' }, 400);
  }

  const card = await getAgentCard(meerkatId);

  if (!card) {
    return c.json({ error: 'Agent card not found' }, 404);
  }

  return c.json(card);
});

// ============================================================================
// FEEDBACK AUTHORIZATION API
// ============================================================================

/**
 * Request feedback authorization from agent owner
 * POST /feedback-auth/request
 * Body: { agentId, clientAddress, ownerAddress, requestedFeedbacks?, message? }
 */
app.post('/feedback-auth/request', async (c) => {
  try {
    const body = await c.req.json();
    const { agentId, clientAddress, ownerAddress, requestedFeedbacks = 5, message } = body;

    if (!agentId || !clientAddress || !ownerAddress) {
      return c.json({ error: 'agentId, clientAddress, and ownerAddress are required' }, 400);
    }

    // Check if request already exists
    const existingRequest = Array.from(feedbackAuthRequests.values()).find(
      r => r.agentId === agentId &&
           r.clientAddress.toLowerCase() === clientAddress.toLowerCase() &&
           r.status === 'pending'
    );

    if (existingRequest) {
      return c.json({ error: 'Authorization request already pending', requestId: existingRequest.id }, 400);
    }

    // Check if authorization already exists and is valid
    const authKey = `${agentId}-${clientAddress.toLowerCase()}`;
    const existingAuth = feedbackAuthorizations.get(authKey);
    if (existingAuth && existingAuth.expiryTimestamp > Date.now() / 1000 &&
        existingAuth.feedbacksUsed < existingAuth.feedbacksAllowed) {
      return c.json({
        error: 'Valid authorization already exists',
        authorization: existingAuth
      }, 400);
    }

    const request: FeedbackAuthRequest = {
      id: generateId(),
      agentId,
      clientAddress: clientAddress.toLowerCase(),
      ownerAddress: ownerAddress.toLowerCase(),
      requestedFeedbacks,
      message,
      status: 'pending',
      createdAt: Date.now(),
    };

    feedbackAuthRequests.set(request.id, request);

    return c.json({
      success: true,
      requestId: request.id,
      message: 'Authorization request submitted. Waiting for owner approval.'
    });

  } catch (error: any) {
    console.error('Feedback auth request error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Get pending authorization requests for an owner
 * GET /feedback-auth/requests/:ownerAddress
 */
app.get('/feedback-auth/requests/:ownerAddress', async (c) => {
  const ownerAddress = c.req.param('ownerAddress').toLowerCase();

  const requests = Array.from(feedbackAuthRequests.values())
    .filter(r => r.ownerAddress === ownerAddress && r.status === 'pending')
    .sort((a, b) => b.createdAt - a.createdAt);

  return c.json({ requests });
});

/**
 * Grant feedback authorization (owner signs and submits)
 * POST /feedback-auth/grant
 * Body: { requestId, feedbacksAllowed, expiryDays, signature, feedbackIndex, expiryTimestamp }
 */
app.post('/feedback-auth/grant', async (c) => {
  try {
    const body = await c.req.json();
    const { requestId, feedbacksAllowed, signature, feedbackIndex, expiryTimestamp: providedExpiry } = body;

    if (!requestId || !signature) {
      return c.json({ error: 'requestId and signature are required' }, 400);
    }

    if (!feedbackIndex || !providedExpiry) {
      return c.json({ error: 'feedbackIndex and expiryTimestamp are required' }, 400);
    }

    const request = feedbackAuthRequests.get(requestId);
    if (!request) {
      return c.json({ error: 'Request not found' }, 404);
    }

    if (request.status !== 'pending') {
      return c.json({ error: 'Request already processed' }, 400);
    }

    // Create authorization with the exact values that were signed
    const authorization: FeedbackAuthorization = {
      agentId: request.agentId,
      clientAddress: request.clientAddress,
      ownerAddress: request.ownerAddress,
      feedbacksAllowed: feedbacksAllowed || request.requestedFeedbacks,
      feedbacksUsed: 0,
      feedbackIndex,
      expiryTimestamp: providedExpiry,
      signature,
      createdAt: Date.now(),
    };

    // Store authorization
    const authKey = `${request.agentId}-${request.clientAddress}`;
    feedbackAuthorizations.set(authKey, authorization);

    // Update request status
    request.status = 'approved';
    feedbackAuthRequests.set(requestId, request);

    return c.json({
      success: true,
      authorization,
      message: 'Authorization granted successfully'
    });

  } catch (error: any) {
    console.error('Grant authorization error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Reject feedback authorization request
 * POST /feedback-auth/reject
 * Body: { requestId }
 */
app.post('/feedback-auth/reject', async (c) => {
  try {
    const body = await c.req.json();
    const { requestId } = body;

    if (!requestId) {
      return c.json({ error: 'requestId is required' }, 400);
    }

    const request = feedbackAuthRequests.get(requestId);
    if (!request) {
      return c.json({ error: 'Request not found' }, 404);
    }

    if (request.status !== 'pending') {
      return c.json({ error: 'Request already processed' }, 400);
    }

    request.status = 'rejected';
    feedbackAuthRequests.set(requestId, request);

    return c.json({ success: true, message: 'Authorization request rejected' });

  } catch (error: any) {
    console.error('Reject authorization error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Get authorization for a client to give feedback on an agent
 * GET /feedback-auth/:agentId/:clientAddress
 */
app.get('/feedback-auth/:agentId/:clientAddress', async (c) => {
  const agentId = parseInt(c.req.param('agentId'));
  const clientAddress = c.req.param('clientAddress').toLowerCase();

  const authKey = `${agentId}-${clientAddress}`;
  const authorization = feedbackAuthorizations.get(authKey);

  if (!authorization) {
    return c.json({ authorized: false, error: 'No authorization found' }, 404);
  }

  // Check if expired
  if (authorization.expiryTimestamp < Date.now() / 1000) {
    return c.json({ authorized: false, error: 'Authorization expired' }, 403);
  }

  // Check if all feedbacks used
  if (authorization.feedbacksUsed >= authorization.feedbacksAllowed) {
    return c.json({ authorized: false, error: 'All authorized feedbacks have been used' }, 403);
  }

  return c.json({
    authorized: true,
    authorization,
    remainingFeedbacks: authorization.feedbacksAllowed - authorization.feedbacksUsed
  });
});

/**
 * Mark a feedback as used (called after successful on-chain feedback)
 * POST /feedback-auth/use
 * Body: { agentId, clientAddress }
 */
app.post('/feedback-auth/use', async (c) => {
  try {
    const body = await c.req.json();
    const { agentId, clientAddress } = body;

    const authKey = `${agentId}-${clientAddress.toLowerCase()}`;
    const authorization = feedbackAuthorizations.get(authKey);

    if (!authorization) {
      return c.json({ error: 'Authorization not found' }, 404);
    }

    authorization.feedbacksUsed += 1;
    feedbackAuthorizations.set(authKey, authorization);

    return c.json({
      success: true,
      remainingFeedbacks: authorization.feedbacksAllowed - authorization.feedbacksUsed
    });

  } catch (error: any) {
    console.error('Use feedback error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Get all authorization requests (for debugging/admin)
 * GET /feedback-auth/all
 */
app.get('/feedback-auth/all', async (c) => {
  return c.json({
    requests: Array.from(feedbackAuthRequests.values()),
    authorizations: Array.from(feedbackAuthorizations.values()),
  });
});

// ============================================================================
// PAID ROUTES (Protected by x402)
// ============================================================================

/**
 * Chat with Bob (Crypto Analyst) - PAID
 * Now with function calling for real-time data!
 */
app.post('/agents/bob', async (c) => {
  try {
    const body = await c.req.json();
    const { message, sessionId = 'default' } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Get or create conversation history
    if (!conversationHistory.has(sessionId)) {
      conversationHistory.set(sessionId, []);
    }
    const history = conversationHistory.get(sessionId)!;

    // Add user message to history
    history.push({ role: 'user', content: message });

    // Call OpenAI with RAG-enhanced context and function calling
    const reply = await chatWithRAG(history, BOB_SYSTEM_PROMPT, {
      maxTokens: 1000,
      temperature: 0.7,
      useRAG: true
    });

    // Add assistant response to history
    history.push({ role: 'assistant', content: reply });

    // Keep only last 20 messages
    if (history.length > 20) {
      history.splice(0, 2);
    }

    return c.json({
      agent: 'bob',
      message: reply,
      sessionId,
      payment: {
        charged: PRICE_PER_REQUEST,
        network: BASE_SEPOLIA_NETWORK
      }
    });

  } catch (error: any) {
    console.error('Bob error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Chat with Ana (Writing Assistant) - PAID
 * Now with function calling for real-time data!
 */
app.post('/agents/ana', async (c) => {
  try {
    const body = await c.req.json();
    const { message, sessionId = 'default' } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Get or create conversation history
    if (!conversationHistory.has(`ana-${sessionId}`)) {
      conversationHistory.set(`ana-${sessionId}`, []);
    }
    const history = conversationHistory.get(`ana-${sessionId}`)!;

    // Add user message to history
    history.push({ role: 'user', content: message });

    // Call OpenAI with RAG-enhanced context and function calling
    // Ana uses RAG less aggressively (writing assistant may not need crypto knowledge as often)
    const reply = await chatWithRAG(history, ANA_SYSTEM_PROMPT, {
      maxTokens: 1000,
      temperature: 0.8,
      useRAG: true
    });

    // Add assistant response to history
    history.push({ role: 'assistant', content: reply });

    // Keep only last 20 messages
    if (history.length > 20) {
      history.splice(0, 2);
    }

    return c.json({
      agent: 'ana',
      message: reply,
      sessionId,
      payment: {
        charged: PRICE_PER_REQUEST,
        network: BASE_SEPOLIA_NETWORK
      }
    });

  } catch (error: any) {
    console.error('Ana error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Chat with a Minted Agent - PAID
 * Generic endpoint for any minted agent, accepts systemPrompt from frontend
 * Now with function calling for real-time data!
 */
app.post('/agents/:agentId', async (c) => {
  try {
    const agentId = c.req.param('agentId');
    const body = await c.req.json();
    const { message, sessionId = 'default', systemPrompt } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Build system prompt with tools documentation
    const toolsInfo = `

TOOLS AVAILABLE:
You have access to real-time tools. Use them when users ask about current data:
- get_crypto_price: Look up cryptocurrency prices (use CoinGecko IDs like "bitcoin", "ethereum")
- get_wallet_balance: Check ETH balance on Base Sepolia
- get_gas_price: Get current gas prices on Base Sepolia
- get_token_info: Get ERC-20 token details
- get_block_number: Get the latest block number
- get_transaction: Look up transaction details
- search_web: Search the internet for current news, information, or any topic

Use these tools when relevant to provide accurate, real-time information.`;

    const prompt = (systemPrompt || `You are Meerkat Agent #${agentId}, a helpful AI assistant on the Base network. Be friendly and concise.`) + toolsInfo;

    // Get or create conversation history
    const historyKey = `agent-${agentId}-${sessionId}`;
    if (!conversationHistory.has(historyKey)) {
      conversationHistory.set(historyKey, []);
    }
    const history = conversationHistory.get(historyKey)!;

    // Add user message to history
    history.push({ role: 'user', content: message });

    // Call OpenAI with RAG-enhanced context and function calling
    const reply = await chatWithRAG(history, prompt, {
      maxTokens: 1000,
      temperature: 0.7,
      useRAG: true
    });

    // Add assistant response to history
    history.push({ role: 'assistant', content: reply });

    // Keep only last 20 messages
    if (history.length > 20) {
      history.splice(0, 2);
    }

    return c.json({
      agent: agentId,
      message: reply,
      sessionId,
      payment: {
        charged: PRICE_PER_REQUEST,
        network: BASE_SEPOLIA_NETWORK
      }
    });

  } catch (error: any) {
    console.error('Minted agent error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// FREE DEMO ROUTES (For Testing Without Payment)
// Now with function calling for real-time data!
// ============================================================================

/**
 * Demo chat with Bob (no payment, limited)
 * Supports function calling for testing
 */
app.post('/demo/bob', async (c) => {
  try {
    const body = await c.req.json();
    const { message } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    const demoPrompt = BOB_SYSTEM_PROMPT + '\n\nThis is a FREE demo. Keep responses short but helpful.';
    const reply = await chatWithRAG(
      [{ role: 'user', content: message }],
      demoPrompt,
      { maxTokens: 500, maxToolCalls: 2, useRAG: true }
    );

    return c.json({
      agent: 'bob',
      message: reply,
      demo: true
    });

  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Demo chat with Ana (no payment, limited)
 * Supports function calling for testing
 */
app.post('/demo/ana', async (c) => {
  try {
    const body = await c.req.json();
    const { message } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    const demoPrompt = ANA_SYSTEM_PROMPT + '\n\nThis is a FREE demo. Keep responses short but helpful.';
    const reply = await chatWithRAG(
      [{ role: 'user', content: message }],
      demoPrompt,
      { maxTokens: 500, maxToolCalls: 2, useRAG: true }
    );

    return c.json({
      agent: 'ana',
      message: reply,
      demo: true
    });

  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Generic Demo chat for minted agents (no payment, limited)
 * Accepts a systemPrompt from the frontend to customize the agent's personality
 * Supports function calling for testing
 */
app.post('/demo/:agentId', async (c) => {
  try {
    const agentId = c.req.param('agentId');
    const body = await c.req.json();
    const { message, systemPrompt } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Build system prompt with tools documentation
    const toolsInfo = `

TOOLS AVAILABLE:
You have access to real-time tools:
- get_crypto_price: Look up cryptocurrency prices
- get_wallet_balance: Check ETH balance on Base Sepolia
- get_gas_price: Get current gas prices
- get_block_number: Get the latest block number
- search_web: Search the internet for current information`;

    const basePrompt = systemPrompt || `You are Meerkat Agent #${agentId}, a helpful AI assistant.`;
    const prompt = basePrompt + toolsInfo + '\n\nThis is a FREE demo. Keep responses short but helpful.';

    const reply = await chatWithRAG(
      [{ role: 'user', content: message }],
      prompt,
      { maxTokens: 500, maxToolCalls: 2, useRAG: true }
    );

    return c.json({
      agent: agentId,
      message: reply,
      demo: true
    });

  } catch (error: any) {
    console.error('Demo chat error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// MCP (MODEL CONTEXT PROTOCOL) SERVER
// ============================================================================
// Implements MCP over Streamable HTTP transport
// Docs: https://modelcontextprotocol.io/docs/concepts/transports
// ============================================================================

const MCP_VERSION = '2025-06-18';

// Agent tools definition - tools each meerkat agent can expose
const getAgentTools = (agentId: string) => [
  {
    name: 'chat',
    title: 'Chat with Agent',
    description: `Send a message to ${agentId} and receive a response`,
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The message to send to the agent',
        },
        sessionId: {
          type: 'string',
          description: 'Optional session ID for conversation continuity',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'get_agent_info',
    title: 'Get Agent Info',
    description: `Get metadata and capabilities for agent ${agentId}`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Agent prompts definition
const getAgentPrompts = (agentId: string) => [
  {
    name: 'greeting',
    description: `Default greeting prompt for ${agentId}`,
    arguments: [],
  },
  {
    name: 'help',
    description: `Ask ${agentId} for help on a topic`,
    arguments: [
      {
        name: 'topic',
        description: 'The topic to get help on',
        required: true,
      },
    ],
  },
];

// Get system prompt for an agent (supports legacy and custom agents)
const getSystemPrompt = (agentId: string): string | null => {
  if (agentId === 'bob') return BOB_SYSTEM_PROMPT;
  if (agentId === 'ana') return ANA_SYSTEM_PROMPT;
  // For custom meerkat agents, we'd fetch from database
  // For now, return a generic meerkat prompt
  if (agentId.startsWith('meerkat-')) {
    return `You are a Meerkat Agent from Meerkat Town. You are helpful, friendly, and knowledgeable. Your agent ID is ${agentId}.`;
  }
  return null;
};

// ============================================================================
// OASF (Open Agent Skills Framework) ENDPOINT
// ============================================================================

/**
 * OASF Endpoint - Returns agent skills and domains in OASF format
 * GET /oasf/:agentId
 */
app.get('/oasf/:agentId', async (c) => {
  const agentIdParam = c.req.param('agentId');

  // Handle both formats: "72" or "meerkat-72"
  const isNumericId = /^\d+$/.test(agentIdParam);
  const isMeerkatFormat = /^meerkat-\d+$/.test(agentIdParam);

  // Extract numeric ID from either format
  const meerkatId = isMeerkatFormat
    ? parseInt(agentIdParam.replace('meerkat-', ''))
    : isNumericId
      ? parseInt(agentIdParam)
      : null;

  // Legacy agents (bob/ana)
  if (agentIdParam === 'bob' || agentIdParam === 'ana') {
    const skills = agentIdParam === 'bob'
      ? ['blockchain_and_cryptocurrency/market_analysis', 'blockchain_and_cryptocurrency/defi_protocols']
      : ['natural_language_processing/content_generation', 'natural_language_processing/text_summarization'];

    return c.json({
      version: 'v0.8.0',
      agentId: agentIdParam,
      skills: skills.map(skill => ({
        slug: skill,
        name: skill.split('/').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        category: skill.split('/')[0]?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      })),
      domains: [],
    });
  }

  // Minted agents: fetch from database
  if (meerkatId && meerkatId >= 1 && meerkatId <= 100) {
    try {
      const card = await getAgentCard(meerkatId);

      if (!card) {
        return c.json({ error: 'Agent not found' }, 404);
      }

      // Parse skills if it's a string (JSONB might come as string or object)
      let skillsArray = card.skills;
      if (typeof skillsArray === 'string') {
        try {
          skillsArray = JSON.parse(skillsArray);
        } catch {
          skillsArray = [];
        }
      }

      // Ensure skills is an array
      if (!Array.isArray(skillsArray)) {
        skillsArray = [];
      }

      // Convert A2A skills back to OASF format
      const oasfSkills = skillsArray.map(skill => ({
        slug: skill.id ? skill.id.replace(/_/g, '/') : 'unknown',
        name: skill.name || 'Unknown Skill',
        description: skill.description || '',
        tags: skill.tags || [],
      }));

      return c.json({
        version: 'v0.8.0',
        agentId: `meerkat-${meerkatId}`,
        name: card.name,
        description: card.description,
        skills: oasfSkills,
        domains: [],
      });
    } catch (error) {
      console.error('[OASF] Error fetching agent:', error);
      return c.json({ error: 'Failed to fetch agent skills' }, 500);
    }
  }

  return c.json({ error: 'Invalid agent ID' }, 400);
});

/**
 * MCP Endpoint Info - GET request returns endpoint capabilities
 * Used by validators and discovery tools to verify the endpoint exists
 */
app.get('/mcp/:agentId', async (c) => {
  const agentId = c.req.param('agentId');

  // Validate agentId exists
  const systemPrompt = getSystemPrompt(agentId);
  if (!systemPrompt) {
    return c.json({ error: `Agent not found: ${agentId}` }, 404);
  }

  return c.json({
    name: `Meerkat Agent ${agentId} MCP Server`,
    version: '1.0.0',
    protocolVersion: MCP_VERSION,
    description: `Model Context Protocol endpoint for ${agentId}`,
    transport: 'streamable-http',
    methods: ['POST'],
    capabilities: {
      tools: true,
      prompts: true,
      resources: false,
    },
    tools: getAgentTools(agentId).map(t => t.name),
    prompts: getAgentPrompts(agentId).map(p => p.name),
    x402: {
      supported: true,
      network: BASE_SEPOLIA_NETWORK,
      price: PRICE_PER_REQUEST,
    },
  });
});

/**
 * MCP Endpoint - JSON-RPC 2.0 over HTTP
 * Handles all MCP protocol methods
 */
app.post('/mcp/:agentId', async (c) => {
  const agentId = c.req.param('agentId');

  // Validate agentId exists
  const systemPrompt = getSystemPrompt(agentId);
  if (!systemPrompt) {
    return c.json({
      jsonrpc: '2.0',
      error: { code: -32602, message: `Agent not found: ${agentId}` },
      id: null,
    }, 404);
  }

  try {
    const body = await c.req.json();
    const { jsonrpc, id, method, params } = body;

    // Validate JSON-RPC format
    if (jsonrpc !== '2.0') {
      return c.json({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid JSON-RPC version' },
        id,
      }, 400);
    }

    // Route to appropriate handler
    switch (method) {
      // ============ LIFECYCLE ============
      case 'initialize': {
        return c.json({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: MCP_VERSION,
            capabilities: {
              tools: { listChanged: false },
              prompts: { listChanged: false },
              resources: { listChanged: false },
            },
            serverInfo: {
              name: `Meerkat Agent ${agentId}`,
              version: '1.0.0',
            },
          },
        });
      }

      // ============ TOOLS ============
      case 'tools/list': {
        return c.json({
          jsonrpc: '2.0',
          id,
          result: {
            tools: getAgentTools(agentId),
          },
        });
      }

      case 'tools/call': {
        const { name: toolName, arguments: toolArgs } = params || {};

        if (toolName === 'chat') {
          const { message, sessionId = 'default' } = toolArgs || {};

          if (!message) {
            return c.json({
              jsonrpc: '2.0',
              id,
              result: {
                content: [{ type: 'text', text: 'Error: message is required' }],
                isError: true,
              },
            });
          }

          // Call OpenAI with agent's system prompt
          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message },
            ],
            max_tokens: 1000,
          });

          return c.json({
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                { type: 'text', text: response.choices[0].message.content || '' },
              ],
              isError: false,
            },
          });
        }

        if (toolName === 'get_agent_info') {
          return c.json({
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    agentId,
                    tools: getAgentTools(agentId).map(t => t.name),
                    prompts: getAgentPrompts(agentId).map(p => p.name),
                    x402support: true,
                    network: BASE_SEPOLIA_NETWORK,
                  }),
                },
              ],
              isError: false,
            },
          });
        }

        return c.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: `Unknown tool: ${toolName}` }],
            isError: true,
          },
        });
      }

      // ============ PROMPTS ============
      case 'prompts/list': {
        return c.json({
          jsonrpc: '2.0',
          id,
          result: {
            prompts: getAgentPrompts(agentId),
          },
        });
      }

      case 'prompts/get': {
        const { name: promptName } = params || {};
        const prompts = getAgentPrompts(agentId);
        const prompt = prompts.find(p => p.name === promptName);

        if (!prompt) {
          return c.json({
            jsonrpc: '2.0',
            error: { code: -32602, message: `Prompt not found: ${promptName}` },
            id,
          });
        }

        return c.json({
          jsonrpc: '2.0',
          id,
          result: {
            description: prompt.description,
            messages: [
              { role: 'user', content: { type: 'text', text: `Run the ${promptName} prompt` } },
            ],
          },
        });
      }

      // ============ UNKNOWN METHOD ============
      default:
        return c.json({
          jsonrpc: '2.0',
          error: { code: -32601, message: `Method not found: ${method}` },
          id,
        }, 400);
    }
  } catch (error: any) {
    console.error('MCP error:', error);
    return c.json({
      jsonrpc: '2.0',
      error: { code: -32603, message: error.message },
      id: null,
    }, 500);
  }
});

// ============================================================================
// ERC-8004 ENDPOINT DOMAIN VERIFICATION
// ============================================================================

/**
 * Agent Registration Discovery - ERC-8004 Endpoint Domain Verification
 * Returns registrations list for all Meerkat Town agents hosted on this domain
 *
 * This allows explorers (like 8004scan) to verify that endpoints are controlled
 * by the agent owners. Per ERC-8004 spec:
 * "An agent MAY optionally prove control of an HTTPS endpoint-domain by publishing
 * https://{endpoint-domain}/.well-known/agent-registration.json"
 *
 * @see https://eips.ethereum.org/EIPS/eip-8004#endpoint-domain-verification-optional
 */
app.get('/.well-known/agent-registration.json', async (c) => {
  try {
    // Chain info for CAIP-10 format
    const chainId = 84532; // Base Sepolia
    const identityRegistry = IDENTITY_REGISTRY_ADDRESS;
    const agentRegistryCAIP10 = `eip155:${chainId}:${identityRegistry}`;

    // Check cache first
    if (registrationsCache && Date.now() - registrationsCache.timestamp < REGISTRATIONS_CACHE_TTL) {
      console.log('[agent-registration.json] Using cached registrations');
      // Return cached data (skip to return statement below)
    } else {
      console.log('[agent-registration.json] Fetching registrations from blockchain...');

      const registrations: Array<{
        agentId: number;
        agentRegistry: string;
      }> = [];

      // Fetch agent metadata to find Meerkat Town agents
      // Start from agent 16 (first Meerkat agent) and go up to 200
      // Stop early if we get consecutive errors (means we've reached the end)
      const startId = 16;
      const maxId = 200; // Upper bound for search
      let consecutiveErrors = 0;

      for (let agentId = startId; agentId <= maxId; agentId++) {
        try {
          // Get token URI
          const tokenUri = await publicClient.readContract({
            address: IDENTITY_REGISTRY_ADDRESS,
            abi: IDENTITY_REGISTRY_ABI,
            functionName: 'tokenURI',
            args: [BigInt(agentId)],
          }) as string;

          consecutiveErrors = 0; // Reset on success

          // Quick check: if IPFS URI exists, fetch metadata
          if (tokenUri && (tokenUri.startsWith('ipfs://') || tokenUri.startsWith('https://'))) {
            // Fetch metadata to verify it's a Meerkat Town agent
            const metadata = await fetchMetadataFromIPFS(tokenUri);

            if (metadata && metadata.meerkatId && metadata.meerkatId >= 1 && metadata.meerkatId <= 100) {
              registrations.push({
                agentId: agentId,
                agentRegistry: agentRegistryCAIP10,
              });
            }
          }
        } catch {
          consecutiveErrors++;
          // If we get 5 consecutive errors, assume we've reached the end
          if (consecutiveErrors >= 5) {
            console.log(`[agent-registration.json] Stopping search at agent ${agentId} (5 consecutive errors)`);
            break;
          }
          continue;
        }
      }

      // Cache the results
      registrationsCache = { data: registrations, timestamp: Date.now() };
      console.log(`[agent-registration.json] Cached ${registrations.length} registrations`);
    }

    const registrations = registrationsCache!.data;

    // Return ERC-8004 compliant registration file
    return c.json({
      // Standard ERC-8004 registration type
      type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',

      // Domain info
      name: 'Meerkat Town',
      description: 'Web3 AI agent marketplace on Base. Mint AI agents as NFTs, chat with them via x402 USDC micropayments, and provide on-chain reputation feedback.',
      image: 'https://www.meerkat.town/logo.png',

      // All Meerkat Town agents registered on this domain
      registrations: registrations,

      // Services available on this domain
      services: [
        {
          name: 'A2A',
          endpoint: 'https://meerkat.up.railway.app/agents/{agentId}/.well-known/agent-card.json',
          version: '0.3.0',
          description: 'A2A protocol agent cards for all Meerkat agents',
        },
        {
          name: 'MCP',
          endpoint: 'https://meerkat.up.railway.app/mcp/{agentId}',
          version: '2025-06-18',
          description: 'MCP JSON-RPC endpoint for AI agent interactions',
        },
      ],

      // Trust mechanisms supported
      supportedTrust: ['reputation'],

      // Domain is active
      active: true,

      // x402 payment support
      x402support: true,

      // Last updated timestamp
      updatedAt: Math.floor(Date.now() / 1000),
    });

  } catch (error: any) {
    console.error('[agent-registration.json] Error:', error);
    return c.json({
      error: 'Failed to generate registration file',
      message: error.message,
    }, 500);
  }
});

/**
 * A2A Agent Card - Agent discovery endpoint
 * Returns agent metadata in A2A protocol compliant format
 * Spec: https://a2a-protocol.org/latest/specification/
 *
 * For legacy agents (bob, ana): Uses hardcoded metadata
 * For minted agents (numeric IDs): Fetches metadata from IPFS via Identity Registry
 */
app.get('/agents/:agentId/.well-known/agent-card.json', async (c) => {
  const agentIdParam = c.req.param('agentId');

  // Check if this is a legacy agent (bob/ana) or a minted agent
  const isLegacyAgent = agentIdParam === 'bob' || agentIdParam === 'ana';

  // Handle both formats: "18" or "meerkat-18"
  const isNumericId = /^\d+$/.test(agentIdParam);
  const isMeerkatFormat = /^meerkat-\d+$/.test(agentIdParam);

  // Extract numeric ID from either format
  const agentId = isMeerkatFormat
    ? agentIdParam.replace('meerkat-', '')
    : agentIdParam;

  // Legacy agents: use hardcoded data
  if (isLegacyAgent) {
    const agentName = agentId === 'bob' ? 'Bob' : 'Ana';
    const agentDescription = agentId === 'bob'
      ? 'Smart crypto analyst meerkat with glasses. Expert in cryptocurrency market analysis, token fundamentals, DeFi protocols, and on-chain metrics.'
      : 'Cheerful and creative writing assistant meerkat. Expert in content creation, copywriting, blog posts, social media content, and creative storytelling.';

    const agentSkills = agentId === 'bob'
      ? [
          { id: 'crypto_analysis', name: 'Cryptocurrency Analysis', description: 'Analyze cryptocurrency markets, tokens, and DeFi protocols', tags: ['crypto', 'defi', 'analysis', 'market'] },
          { id: 'chat', name: 'Chat', description: 'Have a conversation about crypto and blockchain topics', tags: ['conversation', 'nlp'] }
        ]
      : [
          { id: 'content_creation', name: 'Content Creation', description: 'Create written content including blog posts, articles, and marketing copy', tags: ['writing', 'content', 'creative'] },
          { id: 'chat', name: 'Chat', description: 'Have a conversation about writing and content creation', tags: ['conversation', 'nlp'] }
        ];

    return c.json({
      name: agentName,
      description: agentDescription,
      url: `https://meerkat.up.railway.app/agents/${agentId}`,
      version: '1.0.0',
      defaultInputModes: ['text'],
      defaultOutputModes: ['text'],
      authentication: { schemes: ['x402'], description: 'Payment via x402 USDC micropayments on Base network' },
      skills: agentSkills,
      capabilities: { streaming: false, pushNotifications: false, stateTransitionHistory: false },
      provider: { organization: 'Meerkat Town', url: 'https://meerkat.town' },
      x402: { supported: true, network: 'eip155:84532', price: '$0.001', currency: 'USDC' }
    });
  }

  // Minted agents: fetch from database by meerkat ID
  // Supports both "/agents/72" and "/agents/meerkat-72" formats
  if (isNumericId || isMeerkatFormat) {
    const meerkatId = parseInt(agentId);

    if (isNaN(meerkatId) || meerkatId < 1 || meerkatId > 100) {
      return c.json({ error: 'Invalid meerkat ID (must be 1-100)' }, 400);
    }

    // Fetch from database
    const card = await getAgentCard(meerkatId);

    if (!card) {
      return c.json({ error: 'Agent card not found. Agent may not be minted yet.' }, 404);
    }

    return c.json({
      // Required A2A fields
      name: card.name,
      description: card.description,
      url: `https://meerkat.up.railway.app/agents/meerkat-${meerkatId}`,
      version: '1.0.0',
      defaultInputModes: ['text'],
      defaultOutputModes: ['text'],
      authentication: {
        schemes: ['x402'],
        description: 'Payment via x402 USDC micropayments on Base network'
      },
      skills: card.skills,

      // Optional but recommended fields
      capabilities: {
        streaming: false,
        pushNotifications: false,
        stateTransitionHistory: false
      },
      provider: {
        organization: 'Meerkat Town',
        url: 'https://meerkat.town'
      },

      // Custom extension for x402 payment details
      x402: {
        supported: true,
        network: 'eip155:84532',
        price: card.price,
        currency: 'USDC'
      },

      // Meerkat Town specific extension
      meerkat: {
        id: meerkatId,
        image: card.image
      }
    });
  }

  // Unknown agent type
  return c.json({ error: 'Invalid agent ID' }, 400);
});

// ============================================================================
// RAG ADMIN ENDPOINTS
// ============================================================================

/**
 * Trigger knowledge ingestion
 * POST /admin/ingest
 * Headers: { Authorization: "Bearer <ADMIN_SECRET>" }
 */
app.post('/admin/ingest', async (c) => {
  try {
    // Simple auth check - in production, use proper auth
    const authHeader = c.req.header('Authorization');
    const adminSecret = process.env.ADMIN_SECRET || 'meerkat-admin-2024';

    if (authHeader !== `Bearer ${adminSecret}`) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const knowledgeDir = path.join(__dirname, 'knowledge');

    console.log('[Admin] Starting knowledge ingestion...');
    // Ingest without category filter - documents will be categorized as 'general'
    const chunksIngested = await ingestFromDirectory(knowledgeDir);

    console.log(`[Admin] Ingested ${chunksIngested} chunks`);

    // Get index stats
    const stats = await getIndexStats();

    return c.json({
      success: true,
      chunksIngested,
      indexStats: stats
    });

  } catch (error: any) {
    console.error('[Admin] Ingestion error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Get RAG index stats
 * GET /admin/rag-stats
 */
app.get('/admin/rag-stats', async (c) => {
  try {
    const available = await isRAGAvailable();
    if (!available) {
      return c.json({ error: 'RAG not configured' }, 503);
    }

    const stats = await getIndexStats();
    return c.json({
      available: true,
      stats
    });

  } catch (error: any) {
    console.error('[Admin] Stats error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// START SERVER
// ============================================================================

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                 MEERKAT AGENTS API (v2.0)                    ║
╠══════════════════════════════════════════════════════════════╣
║  💰 PAID ENDPOINTS (x402 USDC):                              ║
║     POST /agents/bob  - ${PRICE_PER_REQUEST} per message                    ║
║     POST /agents/ana  - ${PRICE_PER_REQUEST} per message                    ║
║                                                              ║
║  🆓 FREE DEMO:                                               ║
║     POST /demo/bob                                           ║
║     POST /demo/ana                                           ║
║                                                              ║
║  🤖 MCP ENDPOINTS (Model Context Protocol):                  ║
║     POST /mcp/:agentId  - JSON-RPC 2.0                       ║
║     GET  /agents/:agentId/.well-known/agent-card.json        ║
╠══════════════════════════════════════════════════════════════╣
║  Server: http://localhost:${PORT}                               ║
║  Network: Base                                               ║
╚══════════════════════════════════════════════════════════════╝
`);

// Start server
import { serve } from '@hono/node-server';

serve({
  port: PORT,
  fetch: app.fetch,
});

export default {
  port: PORT,
  fetch: app.fetch,
};