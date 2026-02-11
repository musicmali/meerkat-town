// ============================================================================
// AGENT TOOLS - Handler Implementations
// ============================================================================
// Execute tool calls and return results
// ============================================================================

import { createPublicClient, http, formatEther, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';
import { evaluate } from 'mathjs';
import { retrieveContext, isRAGAvailable } from '../rag/retrieval';
import { getAgentReputation } from '../src/contracts/client';

// ============================================================================
// DATABASE CONNECTION - Injected from index.ts for list_agents tool
// ============================================================================
let _sql: any = null;

/**
 * Inject the database connection from index.ts
 * Must be called during server startup
 */
export function setDbConnection(sql: any): void {
  _sql = sql;
}

// ============================================================================
// PRICE CACHE - Avoid CoinGecko rate limits
// ============================================================================
interface CachedPrice {
  data: string;
  timestamp: number;
}

const priceCache = new Map<string, CachedPrice>();
const PRICE_CACHE_TTL = 60 * 1000; // 60 seconds cache

function getCachedPrice(coinId: string): string | null {
  const cached = priceCache.get(coinId.toLowerCase());
  if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL) {
    console.log(`[Price Cache] HIT for ${coinId}`);
    return cached.data;
  }
  return null;
}

function setCachedPrice(coinId: string, data: string): void {
  priceCache.set(coinId.toLowerCase(), { data, timestamp: Date.now() });
  console.log(`[Price Cache] STORED ${coinId}`);
}

// Create a public client for Base Sepolia
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
});

// ERC-20 ABI for basic token info
const ERC20_ABI = [
  { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
] as const;

/**
 * Main handler that routes tool calls to specific implementations
 */
export async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  try {
    switch (name) {
      case 'get_crypto_price':
        return await getCryptoPrice(args.coinId as string);

      case 'get_wallet_balance':
        return await getWalletBalance(args.address as string);

      case 'get_gas_price':
        return await getGasPrice();

      case 'get_token_info':
        return await getTokenInfo(args.address as string);

      case 'get_block_number':
        return await getBlockNumber();

      case 'get_transaction':
        return await getTransaction(args.hash as string);

      case 'search_web':
        return await searchWeb(args.query as string);

      case 'search_knowledge':
        return await searchKnowledge(args.query as string);

      case 'get_agent_reputation':
        return await getReputation(args.agentId as number);

      case 'list_agents':
        return await listAgents();

      case 'execute_calculation':
        return await executeCalculation(args.expression as string);

      case 'get_defi_protocol_stats':
        return await getDefiProtocolStats(args.slug as string);

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (error) {
    console.error(`[Tool Error] ${name}:`, error);
    return JSON.stringify({
      error: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

/**
 * Get cryptocurrency price from CoinGecko (free API)
 * Uses caching to avoid rate limits
 */
async function getCryptoPrice(coinId: string): Promise<string> {
  try {
    // Normalize coin ID
    const normalizedId = coinId.toLowerCase().trim();

    // Check cache first
    const cached = getCachedPrice(normalizedId);
    if (cached) {
      return cached;
    }

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${normalizedId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return JSON.stringify({ error: 'Rate limited by CoinGecko. Please try again in a minute.' });
      }
      return JSON.stringify({ error: `API error: ${response.status}` });
    }

    const data = await response.json() as Record<string, { usd: number; usd_24h_change?: number; usd_market_cap?: number }>;

    if (!data[normalizedId]) {
      // Try a search if exact match failed
      return JSON.stringify({
        error: `Price not found for "${coinId}". Try using the full CoinGecko ID (e.g., "bitcoin", "ethereum", "usd-coin").`
      });
    }

    const priceData = data[normalizedId];
    const result = JSON.stringify({
      coinId: normalizedId,
      price_usd: priceData.usd,
      change_24h_percent: priceData.usd_24h_change?.toFixed(2),
      market_cap_usd: priceData.usd_market_cap,
      timestamp: new Date().toISOString()
    });

    // Cache the successful result
    setCachedPrice(normalizedId, result);

    return result;
  } catch (error) {
    return JSON.stringify({
      error: `Failed to fetch price: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

/**
 * Get wallet ETH balance on Base Sepolia
 */
async function getWalletBalance(address: string): Promise<string> {
  try {
    // Validate address format
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return JSON.stringify({ error: 'Invalid Ethereum address format' });
    }

    const balance = await publicClient.getBalance({
      address: address as `0x${string}`
    });

    return JSON.stringify({
      address,
      balance_eth: formatEther(balance),
      balance_wei: balance.toString(),
      network: 'Base Sepolia',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return JSON.stringify({
      error: `Failed to fetch balance: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

/**
 * Get current gas price on Base Sepolia
 */
async function getGasPrice(): Promise<string> {
  try {
    const gasPrice = await publicClient.getGasPrice();

    return JSON.stringify({
      gas_price_gwei: (Number(gasPrice) / 1e9).toFixed(4),
      gas_price_wei: gasPrice.toString(),
      network: 'Base Sepolia',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return JSON.stringify({
      error: `Failed to fetch gas price: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

/**
 * Get ERC-20 token information
 */
async function getTokenInfo(address: string): Promise<string> {
  try {
    // Validate address format
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return JSON.stringify({ error: 'Invalid token contract address format' });
    }

    const contractAddress = address as `0x${string}`;

    // Fetch all token info in parallel
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      publicClient.readContract({
        address: contractAddress,
        abi: ERC20_ABI,
        functionName: 'name'
      }).catch(() => 'Unknown'),
      publicClient.readContract({
        address: contractAddress,
        abi: ERC20_ABI,
        functionName: 'symbol'
      }).catch(() => 'UNKNOWN'),
      publicClient.readContract({
        address: contractAddress,
        abi: ERC20_ABI,
        functionName: 'decimals'
      }).catch(() => 18),
      publicClient.readContract({
        address: contractAddress,
        abi: ERC20_ABI,
        functionName: 'totalSupply'
      }).catch(() => BigInt(0))
    ]);

    return JSON.stringify({
      address,
      name,
      symbol,
      decimals,
      totalSupply: formatUnits(totalSupply as bigint, decimals as number),
      network: 'Base Sepolia',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return JSON.stringify({
      error: `Failed to fetch token info: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

/**
 * Get latest block number
 */
async function getBlockNumber(): Promise<string> {
  try {
    const blockNumber = await publicClient.getBlockNumber();

    return JSON.stringify({
      block_number: blockNumber.toString(),
      network: 'Base Sepolia',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return JSON.stringify({
      error: `Failed to fetch block number: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

/**
 * Get transaction details
 */
async function getTransaction(hash: string): Promise<string> {
  try {
    // Validate hash format
    if (!hash.match(/^0x[a-fA-F0-9]{64}$/)) {
      return JSON.stringify({ error: 'Invalid transaction hash format' });
    }

    const tx = await publicClient.getTransaction({
      hash: hash as `0x${string}`
    });

    if (!tx) {
      return JSON.stringify({ error: 'Transaction not found' });
    }

    // Also get receipt for status
    const receipt = await publicClient.getTransactionReceipt({
      hash: hash as `0x${string}`
    }).catch(() => null);

    return JSON.stringify({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value_eth: formatEther(tx.value),
      gas_price_gwei: tx.gasPrice ? (Number(tx.gasPrice) / 1e9).toFixed(4) : null,
      block_number: tx.blockNumber?.toString(),
      status: receipt?.status === 'success' ? 'confirmed' : receipt?.status === 'reverted' ? 'failed' : 'pending',
      network: 'Base Sepolia',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return JSON.stringify({
      error: `Failed to fetch transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

/**
 * Search the web using Tavily API
 */
async function searchWeb(query: string): Promise<string> {
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

  if (!TAVILY_API_KEY) {
    return JSON.stringify({ error: 'Web search not configured. TAVILY_API_KEY not set.' });
  }

  try {
    console.log(`[Web Search] Searching for: ${query}`);

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: query,
        search_depth: 'basic',
        include_answer: true,
        include_raw_content: false,
        max_results: 5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Web Search] API error: ${response.status}`, errorText);
      return JSON.stringify({ error: `Search API error: ${response.status}` });
    }

    const data = await response.json() as {
      answer?: string;
      results?: Array<{
        title: string;
        url: string;
        content: string;
      }>;
    };

    // Format results for the LLM
    const formattedResults = {
      answer: data.answer || null,
      sources: data.results?.slice(0, 3).map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.content?.substring(0, 300),
      })) || [],
      query: query,
      timestamp: new Date().toISOString(),
    };

    console.log(`[Web Search] Found ${formattedResults.sources.length} results`);

    return JSON.stringify(formattedResults);
  } catch (error) {
    console.error(`[Web Search] Error:`, error);
    return JSON.stringify({
      error: `Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

// ============================================================================
// NEW TOOLS
// ============================================================================

/**
 * Search the Meerkat Town knowledge base via RAG
 */
async function searchKnowledge(query: string): Promise<string> {
  try {
    const available = await isRAGAvailable();
    if (!available) {
      return JSON.stringify({ error: 'Knowledge base not available. PINECONE_API_KEY not configured.' });
    }

    console.log(`[Knowledge Search] Querying: ${query}`);

    const context = await retrieveContext(query, {
      topK: 3,
      minScore: 0.6,
    });

    if (!context.content) {
      return JSON.stringify({
        query,
        results: [],
        message: 'No relevant information found in the knowledge base.',
      });
    }

    console.log(`[Knowledge Search] Found ${context.sources.length} results`);

    return JSON.stringify({
      query,
      results: context.sources.map((s, i) => ({
        rank: i + 1,
        title: s.title,
        source: s.source,
        relevance: `${s.relevance}%`,
      })),
      content: context.content,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Knowledge Search] Error:', error);
    return JSON.stringify({
      error: `Knowledge search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

/**
 * Get on-chain reputation for a Meerkat agent
 */
async function getReputation(agentId: number): Promise<string> {
  try {
    if (!agentId || agentId < 1) {
      return JSON.stringify({ error: 'Invalid agent ID. Must be a positive integer.' });
    }

    console.log(`[Reputation] Fetching for agent #${agentId}`);

    const reputation = await getAgentReputation(agentId);

    return JSON.stringify({
      agentId,
      averageScore: reputation.averageScore,
      totalFeedback: reputation.totalFeedback,
      network: 'Base Sepolia',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Reputation] Error:', error);
    return JSON.stringify({
      error: `Failed to fetch reputation: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

/**
 * List all minted Meerkat agents from the database
 */
async function listAgents(): Promise<string> {
  try {
    if (!_sql) {
      return JSON.stringify({ error: 'Database not available.' });
    }

    console.log('[List Agents] Fetching all agents');

    const agents = await _sql`
      SELECT meerkat_id, name, description, skills
      FROM agent_cards
      ORDER BY meerkat_id ASC
    `;

    const formatted = agents.map((a: any) => {
      let skills = a.skills;
      if (typeof skills === 'string') {
        try { skills = JSON.parse(skills); } catch { skills = []; }
      }
      const skillNames = Array.isArray(skills)
        ? skills.map((s: any) => s.name || s.id || 'Unknown').slice(0, 5)
        : [];

      return {
        meerkatId: a.meerkat_id,
        name: a.name,
        description: a.description?.substring(0, 150),
        skills: skillNames,
      };
    });

    console.log(`[List Agents] Found ${formatted.length} agents`);

    return JSON.stringify({
      agents: formatted,
      total: formatted.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[List Agents] Error:', error);
    return JSON.stringify({
      error: `Failed to list agents: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

/**
 * Safely evaluate a mathematical expression using mathjs
 */
async function executeCalculation(expression: string): Promise<string> {
  try {
    if (!expression || expression.trim().length === 0) {
      return JSON.stringify({ error: 'Expression is required.' });
    }

    console.log(`[Calculation] Evaluating: ${expression}`);

    const result = evaluate(expression);

    return JSON.stringify({
      expression,
      result: typeof result === 'object' ? result.toString() : result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return JSON.stringify({
      error: `Calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      expression,
    });
  }
}

// ============================================================================
// DEFI CACHE - Avoid excessive DeFiLlama requests
// ============================================================================
interface CachedDefi {
  data: string;
  timestamp: number;
}

const defiCache = new Map<string, CachedDefi>();
const DEFI_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get DeFi protocol stats from DeFiLlama (free API)
 */
async function getDefiProtocolStats(slug: string): Promise<string> {
  try {
    const normalizedSlug = slug.toLowerCase().trim();

    // Check cache
    const cached = defiCache.get(normalizedSlug);
    if (cached && Date.now() - cached.timestamp < DEFI_CACHE_TTL) {
      console.log(`[DeFi Cache] HIT for ${normalizedSlug}`);
      return cached.data;
    }

    console.log(`[DeFi] Fetching stats for: ${normalizedSlug}`);

    const response = await fetch(`https://api.llama.fi/protocol/${normalizedSlug}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return JSON.stringify({
          error: `Protocol "${slug}" not found on DeFiLlama. Try using the exact slug (e.g., "uniswap", "aave-v3", "aerodrome").`
        });
      }
      return JSON.stringify({ error: `DeFiLlama API error: ${response.status}` });
    }

    const data = await response.json() as {
      name?: string;
      tvl?: Array<{ date: number; totalLiquidityUSD: number }>;
      chains?: string[];
      change_1d?: number;
      change_7d?: number;
      currentChainTvls?: Record<string, number>;
      category?: string;
      url?: string;
    };

    // Get latest TVL from the tvl array
    const tvlArray = data.tvl;
    const latestTvl = tvlArray && tvlArray.length > 0
      ? tvlArray[tvlArray.length - 1]!.totalLiquidityUSD
      : null;

    // Sum up current chain TVLs (excluding staking/pool2 variants)
    let totalTvl = 0;
    if (data.currentChainTvls) {
      for (const [key, value] of Object.entries(data.currentChainTvls)) {
        if (!key.includes('-') && typeof value === 'number') {
          totalTvl += value;
        }
      }
    }

    const result = JSON.stringify({
      name: data.name || slug,
      slug: normalizedSlug,
      tvl: totalTvl || latestTvl,
      tvl_formatted: formatUSD(totalTvl || latestTvl || 0),
      chains: data.chains?.slice(0, 10) || [],
      change_1d: data.change_1d ? `${data.change_1d > 0 ? '+' : ''}${data.change_1d.toFixed(2)}%` : null,
      change_7d: data.change_7d ? `${data.change_7d > 0 ? '+' : ''}${data.change_7d.toFixed(2)}%` : null,
      category: data.category || null,
      timestamp: new Date().toISOString(),
    });

    // Cache the result
    defiCache.set(normalizedSlug, { data: result, timestamp: Date.now() });
    console.log(`[DeFi Cache] STORED ${normalizedSlug}`);

    return result;
  } catch (error) {
    console.error('[DeFi] Error:', error);
    return JSON.stringify({
      error: `Failed to fetch DeFi stats: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

function formatUSD(amount: number): string {
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`;
  return `$${amount.toFixed(2)}`;
}
