// Multi-Network Configuration for Meerkat Town
// Supports Ethereum Mainnet and Base Sepolia with network-specific contract addresses and features

// RPC Configuration
// Alchemy API key from environment (optional - free RPCs used when not provided)
const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY || '';

// Free public RPCs (used as primary for testnet, fallback for mainnet)
const FREE_RPCS: Record<number, string> = {
  1: 'https://eth.llamarpc.com',      // Ethereum mainnet free RPC
  84532: 'https://sepolia.base.org',  // Base Sepolia official free RPC
};

// Build RPC URLs based on available API key
function buildRpcUrl(chainId: number): string {
  // Base Sepolia: always use free RPC (testnet, no need for paid service)
  if (chainId === 84532) {
    return FREE_RPCS[84532];
  }
  // Ethereum Mainnet: use Alchemy if key provided, otherwise free RPC
  if (chainId === 1) {
    return ALCHEMY_API_KEY
      ? `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
      : FREE_RPCS[1];
  }
  // Fallback to free RPC if available
  return FREE_RPCS[chainId] || '';
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  shortName: string;
  contracts: {
    identityRegistry: `0x${string}`;
    reputationRegistry: `0x${string}`;
  };
  x402Supported: boolean;
  blockExplorer: string;
  blockExplorerName: string;
  // Reputation contract version: v1.1 uses score (uint8), v1.2 uses value/valueDecimals
  reputationVersion: 'v1.1' | 'v1.2';
  // 8004scan URL pattern
  scan8004Url: string;
  // RPC URL for blockchain queries
  rpcUrl: string;
  // First Meerkat Town agent ID on this network (null = no agents yet)
  firstMeerkatAgentId: number | null;
  // Minimum token ID for filtering Meerkat agents (null = show all)
  minimumMeerkatTokenId: number | null;
  // Block chunk size for eth_getLogs (ETH mainnet: 10,000, Base Sepolia: 1,000,000)
  blockChunkSize: number;
}

export const NETWORKS: Record<number, NetworkConfig> = {
  1: {
    // Ethereum Mainnet
    chainId: 1,
    name: 'Ethereum',
    shortName: 'ETH',
    contracts: {
      identityRegistry: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
      reputationRegistry: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
    },
    x402Supported: false,
    blockExplorer: 'https://etherscan.io',
    blockExplorerName: 'Etherscan',
    reputationVersion: 'v1.2',
    scan8004Url: 'https://www.8004scan.io/agents/ethereum',
    rpcUrl: buildRpcUrl(1),
    firstMeerkatAgentId: 12276, // First Meerkat agent minted on mainnet
    minimumMeerkatTokenId: 12276,
    blockChunkSize: 10000, // Alchemy limit for ETH mainnet
  },
  84532: {
    // Base Sepolia
    chainId: 84532,
    name: 'Base Sepolia',
    shortName: 'Base Sep',
    contracts: {
      identityRegistry: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
      reputationRegistry: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
    },
    x402Supported: true,
    blockExplorer: 'https://sepolia.basescan.org',
    blockExplorerName: 'BaseScan',
    reputationVersion: 'v1.1',
    scan8004Url: 'https://www.8004scan.io/agents/base-sepolia',
    rpcUrl: buildRpcUrl(84532),
    firstMeerkatAgentId: 16,
    minimumMeerkatTokenId: 16,
    blockChunkSize: 1000000, // Alchemy supports large ranges for Base Sepolia
  },
};

// Supported chains for Meerkat Town (in order of priority)
export const SUPPORTED_CHAIN_IDS = [1, 84532] as const;
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

// Default chain is Ethereum Mainnet
export const DEFAULT_CHAIN_ID: SupportedChainId = 1;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get network configuration for a chain ID
 */
export function getNetworkConfig(chainId: number): NetworkConfig | undefined {
  return NETWORKS[chainId];
}

/**
 * Get contract address for a specific network
 */
export function getContractAddress(
  chainId: number,
  contract: 'identityRegistry' | 'reputationRegistry'
): `0x${string}` {
  const network = NETWORKS[chainId];
  if (!network) {
    // Fallback to Base Sepolia if network not found
    console.warn(`[networks] Unknown chainId ${chainId}, falling back to Base Sepolia`);
    return NETWORKS[84532].contracts[contract];
  }
  return network.contracts[contract];
}

/**
 * Check if x402 payments are supported on the network
 */
export function isX402Supported(chainId: number): boolean {
  const network = NETWORKS[chainId];
  return network?.x402Supported ?? false;
}

/**
 * Check if a chain ID is supported by Meerkat Town
 */
export function isSupportedNetwork(chainId: number): boolean {
  return SUPPORTED_CHAIN_IDS.includes(chainId as SupportedChainId);
}

/**
 * Get reputation contract version for a network
 */
export function getReputationVersion(chainId: number): 'v1.1' | 'v1.2' {
  const network = NETWORKS[chainId];
  return network?.reputationVersion ?? 'v1.1';
}

/**
 * Get block explorer URL for an address
 */
export function getBlockExplorerAddressUrl(chainId: number, address: string): string {
  const network = NETWORKS[chainId];
  if (!network) return `https://etherscan.io/address/${address}`;
  return `${network.blockExplorer}/address/${address}`;
}

/**
 * Get block explorer URL for a transaction
 */
export function getBlockExplorerTxUrl(chainId: number, txHash: string): string {
  const network = NETWORKS[chainId];
  if (!network) return `https://etherscan.io/tx/${txHash}`;
  return `${network.blockExplorer}/tx/${txHash}`;
}

/**
 * Get 8004scan URL for an agent
 */
export function get8004ScanAgentUrl(chainId: number, agentId: number): string {
  const network = NETWORKS[chainId];
  if (!network) return `https://www.8004scan.io/agents/ethereum/${agentId}`;
  return `${network.scan8004Url}/${agentId}`;
}

/**
 * Get network name from chain ID
 */
export function getNetworkName(chainId: number): string {
  const network = NETWORKS[chainId];
  return network?.name ?? 'Unknown Network';
}

/**
 * Get RPC URL for a network
 */
export function getRpcUrl(chainId: number): string {
  const network = NETWORKS[chainId];
  if (!network) {
    console.warn(`[networks] Unknown chainId ${chainId}, falling back to Base Sepolia RPC`);
    return NETWORKS[84532].rpcUrl;
  }
  return network.rpcUrl;
}

// Alias for backwards compatibility
export const getAlchemyRpcUrl = getRpcUrl;

/**
 * Get first Meerkat agent ID for a network (null = no agents yet)
 */
export function getFirstMeerkatAgentId(chainId: number): number | null {
  const network = NETWORKS[chainId];
  return network?.firstMeerkatAgentId ?? null;
}

/**
 * Get minimum Meerkat token ID for filtering (null = show all)
 */
export function getMinimumMeerkatTokenId(chainId: number): number | null {
  const network = NETWORKS[chainId];
  return network?.minimumMeerkatTokenId ?? null;
}

/**
 * Get block chunk size for eth_getLogs queries
 * ETH mainnet requires 10,000, Base Sepolia supports 1,000,000
 */
export function getBlockChunkSize(chainId: number): number {
  const network = NETWORKS[chainId];
  // Default to 10,000 (safest for mainnet compatibility)
  return network?.blockChunkSize ?? 10000;
}

/**
 * Get CAIP-2 network identifier
 */
export function getCAIP2NetworkId(chainId: number): string {
  return `eip155:${chainId}`;
}

/**
 * Get CAIP-10 address format
 */
export function formatCAIP10(address: string, chainId: number): string {
  return `eip155:${chainId}:${address}`;
}
