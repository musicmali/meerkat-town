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
 * Fetch all Meerkat Town agents from Identity Registry
 * Uses direct contract reads (avoids eth_getLogs block limits on Alchemy free tier)
 */
export async function fetchMeerkatAgents(
    publicClient: ReturnType<typeof usePublicClient>,
    maxAgentsToScan: number = 100,
    chainId?: number
): Promise<RegisteredAgent[]> {
    if (!publicClient) return [];

    const effectiveChainId = chainId ?? DEFAULT_CHAIN_ID;
    const publicRpcClient = getPublicRpcClient(effectiveChainId);
    const minTokenId = MINIMUM_MEERKAT_TOKEN_ID[effectiveChainId] ?? 1;
    const blacklist = BLACKLISTED_AGENT_IDS[effectiveChainId] ?? [];

    let uniqueIds: number[] = [];

    try {
        // Use direct contract reads for all chains (Alchemy free tier limits getLogs to 10 blocks)
        console.log(`[fetchMeerkatAgents] Chain ${effectiveChainId}: Using direct contract reads to find agents`);

        const registryAddress = getIdentityRegistryAddress(effectiveChainId);

        // For Base Sepolia, start from minTokenId (16) since earlier IDs aren't Meerkat agents
        const startId = minTokenId;
        const endId = startId + maxAgentsToScan;

        // Check agents in parallel batches for faster loading
        const batchSize = 10;
        for (let batchStart = startId; batchStart <= endId; batchStart += batchSize) {
            const batchEnd = Math.min(batchStart + batchSize - 1, endId);
            const batchPromises: Promise<number | null>[] = [];

            for (let id = batchStart; id <= batchEnd; id++) {
                batchPromises.push(
                    publicRpcClient.readContract({
                        address: registryAddress,
                        abi: IDENTITY_REGISTRY_ABI,
                        functionName: 'tokenURI',
                        args: [BigInt(id)],
                    })
                        .then(() => id) // Token exists
                        .catch(() => null) // Token doesn't exist
                );
            }

            const results = await Promise.all(batchPromises);
            for (const id of results) {
                if (id !== null) {
                    uniqueIds.push(id);
                }
            }
        }

        console.log(`[fetchMeerkatAgents] Chain ${effectiveChainId}: Found ${uniqueIds.length} existing agents`);

        // Fetch agent details for each minted token
        const fetchPromises = uniqueIds.map(id => fetchAgent(id, publicClient, effectiveChainId));
        const results = await Promise.all(fetchPromises);

        // Filter for Meerkat Town agents only (excluding blacklisted test agents)
        const agents: RegisteredAgent[] = [];
        for (const agent of results) {
            if (agent && agent.isMeerkatAgent) {
                // Skip blacklisted agents by ID
                if (blacklist.includes(agent.agentId)) {
                    console.log(`[fetchMeerkatAgents] Skipping blacklisted agent: ${agent.agentId} - ${agent.metadata?.name}`);
                    continue;
                }
                console.log(`[fetchMeerkatAgents] Found Meerkat agent: ${agent.agentId} - ${agent.metadata?.name}`);
                agents.push(agent);
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
 * Predict the next agent ID by checking recent registrations
 * This is used to include registrations field in metadata BEFORE minting
 * (since this ERC-8004 registry has immutable URIs)
 */
export async function predictNextAgentId(
    publicClient: ReturnType<typeof usePublicClient>,
    chainId?: number
): Promise<number> {
    if (!publicClient) return 1;

    const effectiveChainId = chainId ?? DEFAULT_CHAIN_ID;
    const publicRpcClient = getPublicRpcClient(effectiveChainId);

    try {
        const registryAddress = getIdentityRegistryAddress(effectiveChainId);
        const minTokenId = MINIMUM_MEERKAT_TOKEN_ID[effectiveChainId] ?? 1;

        // Use direct contract reads (Alchemy free tier limits getLogs)
        // Find the highest existing agent ID by checking sequentially
        let maxId = minTokenId - 1;
        for (let id = minTokenId; id <= minTokenId + 100; id++) {
            try {
                await publicRpcClient.readContract({
                    address: registryAddress,
                    abi: IDENTITY_REGISTRY_ABI,
                    functionName: 'tokenURI',
                    args: [BigInt(id)],
                });
                maxId = id;
            } catch {
                // Token doesn't exist
            }
        }
        return maxId + 1;
    } catch (error) {
        console.error('[predictNextAgentId] Error:', error);
        return MINIMUM_MEERKAT_TOKEN_ID[effectiveChainId] ?? 1;
    }
}

// Re-export types
export type { AgentMetadata };
