// Hooks for fetching agents from ERC-8004 Identity Registry
// These agents are identified as Meerkat Town agents by the meerkatId field in metadata
// Supports multiple networks (Ethereum Mainnet, Base Sepolia)

import { useReadContract, usePublicClient, useAccount, useChainId } from 'wagmi';
import { createPublicClient, http, type Chain } from 'viem';
import { baseSepolia, mainnet } from 'viem/chains';
import { IDENTITY_REGISTRY_ABI, getIdentityRegistryAddress } from '../contracts/MeerkatIdentityRegistry';
import { isSupportedNetwork, DEFAULT_CHAIN_ID } from '../config/networks';
import type { AgentMetadata } from '../types/agentMetadata';

// Chain configurations for public RPC
const CHAIN_CONFIGS: Record<number, Chain> = {
    1: mainnet,
    84532: baseSepolia,
};

// Blacklisted agent IDs per network (test agents that shouldn't appear in the dashboard)
const BLACKLISTED_AGENT_IDS: Record<number, number[]> = {
    1: [],      // Ethereum Mainnet
    84532: [],  // Base Sepolia
};

// Minimum token ID for Meerkat Town agents per network
const MINIMUM_MEERKAT_TOKEN_ID: Record<number, number> = {
    1: 1,       // Ethereum Mainnet - starts from 1
    84532: 16,  // Base Sepolia - v1.1 starts from #16
};

// Contract deployment blocks (for efficient event log scanning)
const CONTRACT_DEPLOYMENT_BLOCK: Record<number, bigint> = {
    1: 21887265n,      // ETH Mainnet Identity Registry deployment
    84532: 20550000n,  // Base Sepolia Identity Registry deployment (approximate)
};

// Block chunk size for eth_getLogs (Alchemy paid tier supports 2000+ blocks)
const LOG_CHUNK_SIZE = 2000n;

// ERC-721 Transfer event signature: Transfer(address,address,uint256)
const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// Zero address topic for mint events (from = 0x0)
const ZERO_ADDRESS_TOPIC = '0x0000000000000000000000000000000000000000000000000000000000000000';

// Alchemy RPC endpoints for reliable access
const ALCHEMY_ETH_MAINNET_RPC = 'https://eth-mainnet.g.alchemy.com/v2/XRfB1Htp32AuoMrXtblwO';
const ALCHEMY_BASE_SEPOLIA_RPC = 'https://base-sepolia.g.alchemy.com/v2/XRfB1Htp32AuoMrXtblwO';

// Create public RPC client for a specific chain
function getPublicRpcClient(chainId: number) {
    const chain = CHAIN_CONFIGS[chainId];
    if (!chain) {
        // Default to Base Sepolia if chain not found
        return createPublicClient({
            chain: baseSepolia,
            transport: http(ALCHEMY_BASE_SEPOLIA_RPC),
        });
    }

    // Use Alchemy RPC endpoints for supported chains
    const rpcUrl = chainId === 1
        ? ALCHEMY_ETH_MAINNET_RPC
        : chainId === 84532
            ? ALCHEMY_BASE_SEPOLIA_RPC
            : undefined;

    return createPublicClient({
        chain,
        transport: http(rpcUrl),
    });
}

// Interface for a registered agent
export interface RegisteredAgent {
    agentId: number;
    owner: string;
    metadataUri: string;
    metadata: AgentMetadata | null;
    isMeerkatAgent: boolean; // True if metadata contains meerkatId
    chainId?: number; // The chain this agent was found on
}

/**
 * Fetch metadata from IPFS gateway
 */
async function fetchMetadataFromIPFS(ipfsUri: string): Promise<AgentMetadata | null> {
    try {
        // Convert IPFS URI to HTTP gateway URL
        let url = ipfsUri;
        if (ipfsUri.startsWith('ipfs://')) {
            const cid = ipfsUri.replace('ipfs://', '');
            url = `https://gateway.pinata.cloud/ipfs/${cid}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            // Silently return null for 404s (expected for non-Meerkat agents)
            return null;
        }

        const metadata = await response.json();
        return metadata as AgentMetadata;
    } catch {
        // Silently return null for fetch errors (expected for non-Meerkat agents)
        return null;
    }
}

/**
 * Check if metadata belongs to a Meerkat Town agent
 */
function isMeerkatTownAgent(metadata: AgentMetadata | null): boolean {
    if (!metadata) return false;

    // Check for meerkatId field (Meerkat Town specific)
    if (metadata.meerkatId !== undefined && metadata.meerkatId >= 1 && metadata.meerkatId <= 100) {
        return true;
    }

    // Fallback: check if image URL contains meerkat.town or meerkattown
    if (metadata.image && (metadata.image.includes('meerkat.town') || metadata.image.includes('meerkattown'))) {
        return true;
    }

    return false;
}

/**
 * Fetch a single agent by ID from Identity Registry
 */
export async function fetchAgent(
    agentId: number,
    publicClient: ReturnType<typeof usePublicClient>,
    chainId?: number
): Promise<RegisteredAgent | null> {
    if (!publicClient) return null;

    const effectiveChainId = chainId ?? DEFAULT_CHAIN_ID;
    const registryAddress = getIdentityRegistryAddress(effectiveChainId);

    try {
        // Get token URI
        const tokenUri = await publicClient.readContract({
            address: registryAddress,
            abi: IDENTITY_REGISTRY_ABI,
            functionName: 'tokenURI',
            args: [BigInt(agentId)],
        }) as string;

        // Get owner
        const owner = await publicClient.readContract({
            address: registryAddress,
            abi: IDENTITY_REGISTRY_ABI,
            functionName: 'ownerOf',
            args: [BigInt(agentId)],
        }) as string;

        // Fetch metadata from IPFS
        const metadata = await fetchMetadataFromIPFS(tokenUri);

        return {
            agentId,
            owner,
            metadataUri: tokenUri,
            metadata,
            isMeerkatAgent: isMeerkatTownAgent(metadata),
            chainId: effectiveChainId,
        };
    } catch (error) {
        // Token doesn't exist or other error
        return null;
    }
}

/**
 * Fetch Transfer event logs backwards from the latest block
 * Used to find all minted tokens (Transfer from 0x0)
 */
async function fetchTransferLogsBackwards(
    publicClient: any,  // viem public client
    registryAddress: `0x${string}`,
    fromBlock: bigint,
    toBlock: bigint,
    maxAgents: number = 500
): Promise<number[]> {
    const agentIds: Set<number> = new Set();
    let currentToBlock = toBlock;

    console.log(`[fetchTransferLogs] Scanning from block ${fromBlock} to ${toBlock}`);

    while (currentToBlock > fromBlock && agentIds.size < maxAgents) {
        const currentFromBlock = currentToBlock - LOG_CHUNK_SIZE > fromBlock
            ? currentToBlock - LOG_CHUNK_SIZE
            : fromBlock;

        try {
            const logs = await publicClient.request({
                method: 'eth_getLogs',
                params: [{
                    address: registryAddress,
                    topics: [
                        TRANSFER_EVENT_SIGNATURE,
                        ZERO_ADDRESS_TOPIC, // from = 0x0 (mint events only)
                    ],
                    fromBlock: `0x${currentFromBlock.toString(16)}`,
                    toBlock: `0x${currentToBlock.toString(16)}`,
                }],
            });

            if (Array.isArray(logs)) {
                for (const log of logs) {
                    // Token ID is in the 3rd topic (index 2) for Transfer events
                    // But in ERC-721, tokenId might be in topics[3] or data depending on implementation
                    // For standard ERC-721: Transfer(from, to, tokenId) - tokenId is topics[3]
                    if (log.topics && log.topics.length >= 4 && log.topics[3]) {
                        const tokenIdHex = log.topics[3] as string;
                        const tokenId = parseInt(tokenIdHex, 16);
                        if (!isNaN(tokenId) && tokenId > 0) {
                            agentIds.add(tokenId);
                        }
                    }
                }
            }

            console.log(`[fetchTransferLogs] Scanned blocks ${currentFromBlock}-${currentToBlock}, found ${agentIds.size} mints so far`);
        } catch (error) {
            console.warn(`[fetchTransferLogs] Error scanning blocks ${currentFromBlock}-${currentToBlock}:`, error);
            // Continue with next chunk even if this one failed
        }

        currentToBlock = currentFromBlock - 1n;
    }

    return Array.from(agentIds).sort((a, b) => a - b);
}

/**
 * Fetch all Meerkat Town agents from Identity Registry
 * Uses event logs to find minted agents, then filters for Meerkat Town agents
 */
export async function fetchMeerkatAgents(
    publicClient: ReturnType<typeof usePublicClient>,
    maxAgentsToScan: number = 500,
    chainId?: number
): Promise<RegisteredAgent[]> {
    if (!publicClient) return [];

    const effectiveChainId = chainId ?? DEFAULT_CHAIN_ID;
    const publicRpcClient = getPublicRpcClient(effectiveChainId);
    const blacklist = BLACKLISTED_AGENT_IDS[effectiveChainId] ?? [];
    const registryAddress = getIdentityRegistryAddress(effectiveChainId);
    const deploymentBlock = CONTRACT_DEPLOYMENT_BLOCK[effectiveChainId] ?? 0n;

    try {
        // Get current block number
        const currentBlock = await publicRpcClient.getBlockNumber();
        console.log(`[fetchMeerkatAgents] Chain ${effectiveChainId}: Current block ${currentBlock}, deployment block ${deploymentBlock}`);

        // Use event logs to find all minted tokens
        console.log(`[fetchMeerkatAgents] Chain ${effectiveChainId}: Using event logs to find agents`);

        const allMintedIds = await fetchTransferLogsBackwards(
            publicRpcClient,
            registryAddress,
            deploymentBlock,
            currentBlock,
            maxAgentsToScan
        );

        console.log(`[fetchMeerkatAgents] Chain ${effectiveChainId}: Found ${allMintedIds.length} minted tokens via event logs`);

        if (allMintedIds.length === 0) {
            console.log(`[fetchMeerkatAgents] Chain ${effectiveChainId}: No minted tokens found`);
            return [];
        }

        // Fetch agent details for each minted token (in parallel batches for performance)
        const batchSize = 20;
        const agents: RegisteredAgent[] = [];

        for (let i = 0; i < allMintedIds.length; i += batchSize) {
            const batchIds = allMintedIds.slice(i, i + batchSize);
            const fetchPromises = batchIds.map(id => fetchAgent(id, publicClient, effectiveChainId));
            const results = await Promise.all(fetchPromises);

            for (const agent of results) {
                if (agent && agent.isMeerkatAgent) {
                    // Skip blacklisted agents by ID
                    if (blacklist.includes(agent.agentId)) {
                        console.log(`[fetchMeerkatAgents] Skipping blacklisted agent: ${agent.agentId} - ${agent.metadata?.name}`);
                        continue;
                    }
                    console.log(`[fetchMeerkatAgents] Found Meerkat agent: ${agent.agentId} - ${agent.metadata?.name}`);
                    agents.push(agent);

                    // Early exit if we've found all 100 possible Meerkat agents
                    if (agents.length >= 100) {
                        console.log(`[fetchMeerkatAgents] Found all 100 Meerkat agents, stopping scan`);
                        break;
                    }
                }
            }

            // Early exit if we've found all 100 possible Meerkat agents
            if (agents.length >= 100) {
                break;
            }
        }

        console.log(`[fetchMeerkatAgents] Chain ${effectiveChainId}: Total Meerkat Town agents found: ${agents.length}`);
        return agents;
    } catch (error) {
        console.error('[fetchMeerkatAgents] Error:', error);
        return [];
    }
}

/**
 * Fetch agents owned by a specific address
 * Uses fetchMeerkatAgents and filters by owner - more reliable than event log searching
 */
export async function fetchAgentsByOwner(
    ownerAddress: string,
    publicClient: ReturnType<typeof usePublicClient>,
    maxAgents: number = 100,
    chainId?: number
): Promise<RegisteredAgent[]> {
    if (!publicClient || !ownerAddress) return [];

    const effectiveChainId = chainId ?? DEFAULT_CHAIN_ID;

    try {
        console.log(`[fetchAgentsByOwner] Chain ${effectiveChainId}: Fetching all agents and filtering by owner: ${ownerAddress}`);

        // Fetch all meerkat agents (same as Dashboard)
        const allAgents = await fetchMeerkatAgents(publicClient, maxAgents, effectiveChainId);

        // Filter by owner
        const ownedAgents = allAgents.filter(
            agent => agent.owner.toLowerCase() === ownerAddress.toLowerCase()
        );

        console.log(`[fetchAgentsByOwner] Found ${ownedAgents.length} agents owned by ${ownerAddress}`);
        return ownedAgents;
    } catch (error) {
        console.error('[fetchAgentsByOwner] Error:', error);
        return [];
    }
}

/**
 * Hook to get the balance (number of agents) for the connected account
 */
export function useAgentBalance() {
    const { address } = useAccount();
    const chainId = useChainId();
    const effectiveChainId = isSupportedNetwork(chainId) ? chainId : DEFAULT_CHAIN_ID;
    const registryAddress = getIdentityRegistryAddress(effectiveChainId);

    const { data, isLoading, error, refetch } = useReadContract({
        address: registryAddress,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        chainId: effectiveChainId,
        query: {
            enabled: !!address,
        },
    });

    return {
        balance: data as bigint | undefined,
        isLoading,
        error,
        refetch,
    };
}

/**
 * Hook to get token URI for a specific agent
 */
export function useAgentTokenURI(agentId: number | undefined) {
    const chainId = useChainId();
    const effectiveChainId = isSupportedNetwork(chainId) ? chainId : DEFAULT_CHAIN_ID;
    const registryAddress = getIdentityRegistryAddress(effectiveChainId);

    const { data, isLoading, error } = useReadContract({
        address: registryAddress,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'tokenURI',
        args: agentId !== undefined ? [BigInt(agentId)] : undefined,
        chainId: effectiveChainId,
        query: {
            enabled: agentId !== undefined,
        },
    });

    return {
        tokenUri: data as string | undefined,
        isLoading,
        error,
    };
}

/**
 * Hook to get owner of a specific agent
 */
export function useAgentOwner(agentId: number | undefined) {
    const chainId = useChainId();
    const effectiveChainId = isSupportedNetwork(chainId) ? chainId : DEFAULT_CHAIN_ID;
    const registryAddress = getIdentityRegistryAddress(effectiveChainId);

    const { data, isLoading, error } = useReadContract({
        address: registryAddress,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'ownerOf',
        args: agentId !== undefined ? [BigInt(agentId)] : undefined,
        chainId: effectiveChainId,
        query: {
            enabled: agentId !== undefined,
        },
    });

    return {
        owner: data as string | undefined,
        isLoading,
        error,
    };
}

/**
 * Predict the next agent ID by calling totalSupply() on the Identity Registry
 * This is used to include registrations field in metadata BEFORE minting
 * (since this ERC-8004 registry has immutable URIs)
 *
 * The Identity Registry uses sequential IDs starting from 1, so next ID = totalSupply + 1
 */
export async function predictNextAgentId(
    publicClient: ReturnType<typeof usePublicClient>,
    chainId?: number
): Promise<number> {
    if (!publicClient) return 1;

    const effectiveChainId = chainId ?? DEFAULT_CHAIN_ID;
    const publicRpcClient = getPublicRpcClient(effectiveChainId);
    const registryAddress = getIdentityRegistryAddress(effectiveChainId);

    // Log detailed info for debugging
    console.log(`[predictNextAgentId] ========================================`);
    console.log(`[predictNextAgentId] Input chainId: ${chainId}`);
    console.log(`[predictNextAgentId] Effective chainId: ${effectiveChainId}`);
    console.log(`[predictNextAgentId] Registry address: ${registryAddress}`);
    console.log(`[predictNextAgentId] Expected ETH Mainnet: 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`);
    console.log(`[predictNextAgentId] Expected Base Sepolia: 0x8004A818BFB912233c491871b3d84c89A494BD9e`);
    console.log(`[predictNextAgentId] ========================================`);

    try {
        // Call totalSupply() to get the count of minted tokens
        const totalSupply = await publicRpcClient.readContract({
            address: registryAddress,
            abi: IDENTITY_REGISTRY_ABI,
            functionName: 'totalSupply',
        }) as bigint;

        const nextId = Number(totalSupply) + 1;
        console.log(`[predictNextAgentId] SUCCESS: totalSupply=${totalSupply}, nextId=${nextId}`);
        return nextId;
    } catch (error) {
        console.error('[predictNextAgentId] ERROR calling totalSupply:', error);
        // Fallback to minimum token ID for the chain
        const fallback = MINIMUM_MEERKAT_TOKEN_ID[effectiveChainId] ?? 1;
        console.log(`[predictNextAgentId] Using fallback: ${fallback}`);
        return fallback;
    }
}

// Re-export types
export type { AgentMetadata };
