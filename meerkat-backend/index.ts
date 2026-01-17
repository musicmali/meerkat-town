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

// Load environment variables
config();

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

When responding:
1. Be concise but thorough
2. Use bullet points for clarity
3. Include relevant data when available
4. Warn about risks appropriately
5. Never give financial advice - always add disclaimers

You work on Base Network and love talking about the Base ecosystem.`;

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

When responding:
1. Be encouraging and supportive
2. Offer multiple options when appropriate
3. Explain your creative choices
4. Match the tone the user is going for
5. Suggest improvements tactfully

You love helping people express their ideas clearly and creatively!`;

// Store conversation history per session
const conversationHistory: Map<string, Array<{ role: 'user' | 'assistant', content: string }>> = new Map();

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

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: BOB_SYSTEM_PROMPT },
        ...history
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const reply = response.choices[0].message.content || 'Bob is thinking...';

    // Add assistant response to history
    history.push({ role: 'assistant', content: reply });

    // Keep only last 10 messages
    if (history.length > 20) {
      history.splice(0, 2);
    }

    return c.json({
      agent: 'bob',
      message: reply,
      sessionId,
      usage: response.usage,
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

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ANA_SYSTEM_PROMPT },
        ...history
      ],
      max_tokens: 1000,
      temperature: 0.8,
    });

    const reply = response.choices[0].message.content || 'Ana is crafting a response...';

    // Add assistant response to history
    history.push({ role: 'assistant', content: reply });

    // Keep only last 10 messages
    if (history.length > 20) {
      history.splice(0, 2);
    }

    return c.json({
      agent: 'ana',
      message: reply,
      sessionId,
      usage: response.usage,
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
 */
app.post('/agents/:agentId', async (c) => {
  try {
    const agentId = c.req.param('agentId');
    const body = await c.req.json();
    const { message, sessionId = 'default', systemPrompt } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Use provided systemPrompt or a default
    const prompt = systemPrompt || `You are Meerkat Agent #${agentId}, a helpful AI assistant on the Base network. Be friendly and concise.`;

    // Get or create conversation history
    const historyKey = `agent-${agentId}-${sessionId}`;
    if (!conversationHistory.has(historyKey)) {
      conversationHistory.set(historyKey, []);
    }
    const history = conversationHistory.get(historyKey)!;

    // Add user message to history
    history.push({ role: 'user', content: message });

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt },
        ...history
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const reply = response.choices[0].message.content || 'Thinking...';

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
      usage: response.usage,
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
// ============================================================================

/**
 * Demo chat with Bob (no payment, limited)
 */
app.post('/demo/bob', async (c) => {
  try {
    const body = await c.req.json();
    const { message } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: BOB_SYSTEM_PROMPT + '\n\nThis is a FREE demo. Keep responses short but helpful.' },
        { role: 'user', content: message }
      ],
      max_tokens: 200,
    });

    return c.json({
      agent: 'bob',
      message: response.choices[0].message.content,
      demo: true
    });

  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Demo chat with Ana (no payment, limited)
 */
app.post('/demo/ana', async (c) => {
  try {
    const body = await c.req.json();
    const { message } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ANA_SYSTEM_PROMPT + '\n\nThis is a FREE demo. Keep responses short but helpful.' },
        { role: 'user', content: message }
      ],
      max_tokens: 200,
    });

    return c.json({
      agent: 'ana',
      message: response.choices[0].message.content,
      demo: true
    });

  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * Generic Demo chat for minted agents (no payment, limited)
 * Accepts a systemPrompt from the frontend to customize the agent's personality
 */
app.post('/demo/:agentId', async (c) => {
  try {
    const agentId = c.req.param('agentId');
    const body = await c.req.json();
    const { message, systemPrompt } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    // Use provided systemPrompt or default
    const prompt = systemPrompt
      ? systemPrompt + '\n\nThis is a FREE demo. Keep responses short but helpful.'
      : `You are Meerkat Agent #${agentId}, a helpful AI assistant. This is a FREE demo. Keep responses short but helpful.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: message }
      ],
      max_tokens: 300,
    });

    return c.json({
      agent: agentId,
      message: response.choices[0].message.content,
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

/**
 * A2A Agent Card - Agent discovery endpoint
 * Returns agent metadata in A2A protocol compliant format
 * Spec: https://a2a-protocol.org/latest/specification/
 */
app.get('/agents/:agentId/.well-known/agent-card.json', (c) => {
  const agentId = c.req.param('agentId');
  const systemPrompt = getSystemPrompt(agentId);

  if (!systemPrompt) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  // Determine agent name and description
  const agentName = agentId === 'bob'
    ? 'Bob'
    : agentId === 'ana'
      ? 'Ana'
      : `Meerkat Agent ${agentId}`;

  const agentDescription = agentId === 'bob'
    ? 'Smart crypto analyst meerkat with glasses. Expert in cryptocurrency market analysis, token fundamentals, DeFi protocols, and on-chain metrics.'
    : agentId === 'ana'
      ? 'Cheerful and creative writing assistant meerkat. Expert in content creation, copywriting, blog posts, social media content, and creative storytelling.'
      : `Custom Meerkat Agent ${agentId} from Meerkat Town - an AI agent on Base network.`;

  // Determine skills based on agent type
  const agentSkills = agentId === 'bob'
    ? [
        {
          id: 'crypto_analysis',
          name: 'Cryptocurrency Analysis',
          description: 'Analyze cryptocurrency markets, tokens, and DeFi protocols',
          tags: ['crypto', 'defi', 'analysis', 'market']
        },
        {
          id: 'chat',
          name: 'Chat',
          description: 'Have a conversation about crypto and blockchain topics',
          tags: ['conversation', 'nlp']
        }
      ]
    : agentId === 'ana'
      ? [
          {
            id: 'content_creation',
            name: 'Content Creation',
            description: 'Create written content including blog posts, articles, and marketing copy',
            tags: ['writing', 'content', 'creative']
          },
          {
            id: 'chat',
            name: 'Chat',
            description: 'Have a conversation about writing and content creation',
            tags: ['conversation', 'nlp']
          }
        ]
      : [
          {
            id: 'chat',
            name: 'Chat',
            description: 'Have a conversation with this Meerkat agent',
            tags: ['conversation', 'nlp']
          }
        ];

  return c.json({
    // Required fields
    name: agentName,
    description: agentDescription,
    url: `https://meerkat.up.railway.app/agents/${agentId}`,
    version: '1.0.0',
    defaultInputModes: ['text'],
    defaultOutputModes: ['text'],
    authentication: {
      schemes: ['x402'],
      description: 'Payment via x402 USDC micropayments on Base network'
    },
    skills: agentSkills,

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
      price: '$0.001',
      currency: 'USDC'
    }
  });
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