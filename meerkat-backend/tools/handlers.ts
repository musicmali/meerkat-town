// ============================================================================
// AGENT TOOLS - Handler Implementations
// ============================================================================
// Execute tool calls and return results
// ============================================================================

import { createPublicClient, http, formatEther, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';

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
