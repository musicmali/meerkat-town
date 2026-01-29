// Hooks for fetching agents from ERC-8004 Identity Registry
// These agents are identified as Meerkat Town agents by the meerkatId field in metadata

import { useReadContract, usePublicClient, useAccount, useChainId } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { mainnet, baseSepolia } from 'viem/chains';
import { IDENTITY_REGISTRY_ABI } from '../contracts/MeerkatIdentityRegistry';
import {
    getContractAddress,
    getAlchemyRpcUrl,
    getFirstMeerkatAgentId,
    getMinimumMeerkatTokenId,
    getBlockChunkSize,
    DEFAULT_CHAIN_ID,
} from '../config/networks';
import type { AgentMetadata } from '../types/agentMetadata';

// Blacklisted agent IDs (test agents that shouldn't appear in the dashboard)
// v1.1: Fresh contract, no blacklisted agents yet
const BLACKLISTED_AGENT_IDS: number[] = [];

// ERC-721 Transfer event signature
const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const ZERO_ADDRESS_TOPIC = '0x0000000000000000000000000000000000000000000000000000000000000000';

// Cache for RPC clients per chain
// Using 'any' to avoid complex viem type incompatibilities between mainnet and baseSepolia
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpcClientCache: Record<number, any> = {};

/**
 * Get or create RPC client for a specific chain
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRpcClient(chainId: number): any {
    if (!rpcClientCache[chainId]) {
        const rpcUrl = getAlchemyRpcUrl(chainId);
        const chain = chainId === 1 ? mainnet : baseSepolia;
        rpcClientCache[chainId] = createPublicClient({
            chain,
            transport: http(rpcUrl),
        });
    }
    return rpcClientCache[chainId];
}

// Interface for a registered agent
export interface RegisteredAgent {
    agentId: number;
    owner: string;
    metadataUri: string;
    metadata: AgentMetadata | null;
    isMeerkatAgent: boolean; // True if metadata contains meerkatId
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
    chainId: number = DEFAULT_CHAIN_ID
): Promise<RegisteredAgent | null> {
    if (!publicClient) return null;

    const identityRegistryAddress = getContractAddress(chainId, 'identityRegistry');

    try {
        // Get token URI
        const tokenUri = await publicClient.readContract({
            address: identityRegistryAddress,
            abi: IDENTITY_REGISTRY_ABI,
            functionName: 'tokenURI',
            args: [BigInt(agentId)],
        }) as string;

        // Get owner
        const owner = await publicClient.readContract({
            address: identityRegistryAddress,
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
        };
    } catch (error) {
        // Token doesn't exist or other error
        return null;
    }
}

/**
 * Fetch Transfer event logs using raw topics and Alchemy RPC
 * Searches BACKWARDS from toBlock to fromBlock, stopping early if stopAtTokenId is found
 */
async function fetchTransferLogsBackwards(
    fromBlock: bigint,
    toBlock: bigint,
    chainId: number,
    filterByMint: boolean = true,
    ownerAddress?: string,
    stopAtTokenId?: number
): Promise<{ tokenId: number; to: string }[]> {
    // Use network-specific chunk size (ETH mainnet: 10k, Base Sepolia: 1M)
    const CHUNK_SIZE = BigInt(getBlockChunkSize(chainId));
    const allTokenIds: { tokenId: number; to: string }[] = [];
    const foundTokenIds = new Set<number>();
    const identityRegistryAddress = getContractAddress(chainId, 'identityRegistry');
    const rpcClient = getRpcClient(chainId);

    // Start from toBlock and work backwards
    let currentTo = toBlock;
    while (currentTo >= fromBlock) {
        const currentFrom = currentTo - CHUNK_SIZE < fromBlock ? fromBlock : currentTo - CHUNK_SIZE;

        try {
            // Build topics array
            const topics: (`0x${string}` | null)[] = [
                TRANSFER_EVENT_SIGNATURE as `0x${string}`,
                filterByMint ? ZERO_ADDRESS_TOPIC as `0x${string}` : null,
                ownerAddress ? `0x000000000000000000000000${ownerAddress.slice(2).toLowerCase()}` as `0x${string}` : null,
            ];

            // Use RPC client for this chain
            const logs = await rpcClient.request({
                method: 'eth_getLogs',
                params: [{
                    address: identityRegistryAddress,
                    topics,
                    fromBlock: `0x${currentFrom.toString(16)}`,
                    toBlock: `0x${currentTo.toString(16)}`,
                }],
            });

            // Parse token IDs from logs
            for (const log of logs) {
                if (log.topics && log.topics[3]) {
                    const tokenId = parseInt(log.topics[3], 16);
                    const to = '0x' + log.topics[2]?.slice(26);
                    allTokenIds.push({ tokenId, to });
                    foundTokenIds.add(tokenId);
                }
            }

            // Early exit: if we found the target token ID, we have all agents
            if (stopAtTokenId !== undefined && foundTokenIds.has(stopAtTokenId)) {
                console.log(`[fetchTransferLogsBackwards] Found target token ${stopAtTokenId}, stopping search`);
                break;
            }
        } catch (error) {
            console.warn(`Error fetching logs for blocks ${currentFrom}-${currentTo}:`, error);
        }

        // Move backwards
        currentTo = currentFrom - 1n;

        // Safety: don't go below block 0
        if (currentTo < 0n) break;
    }

    return allTokenIds;
}

/**
 * Fetch all Meerkat Town agents from Identity Registry using event logs
 * Searches BACKWARDS from current block until finding the first Meerkat agent
 */
export async function fetchMeerkatAgents(
    publicClient: ReturnType<typeof usePublicClient>,
    chainId: number = DEFAULT_CHAIN_ID,
    _maxAgentsToScan: number = 100 // Kept for backwards compatibility but not used
): Promise<RegisteredAgent[]> {
    if (!publicClient) return [];

    // Get network-specific values
    const firstAgentId = getFirstMeerkatAgentId(chainId);
    const minimumTokenId = getMinimumMeerkatTokenId(chainId);

    // Handle "no Meerkat agents yet" case
    if (firstAgentId === null) {
        console.log(`[fetchMeerkatAgents] No Meerkat agents on chain ${chainId} yet`);
        return [];
    }

    const rpcClient = getRpcClient(chainId);

    try {
        // Get current block number using RPC client for this chain
        const currentBlock = await rpcClient.getBlockNumber();

        console.log(`[fetchMeerkatAgents] Chain ${chainId}: Searching backwards from block ${currentBlock} until finding agent ${firstAgentId}`);

        // Search backwards from current block to block 0, stopping when we find first Meerkat agent
        const mintEvents = await fetchTransferLogsBackwards(
            0n, // Search all the way back if needed
            currentBlock,
            chainId,
            true, // filter by mint (from = 0x0)
            undefined,
            firstAgentId // Stop when we find the first Meerkat agent
        );

        console.log(`[fetchMeerkatAgents] Found ${mintEvents.length} mint events`);

        // Extract unique agent IDs and filter by minimum token ID if set
        const uniqueIds = [...new Set(mintEvents.map(e => e.tokenId))]
            .filter(id => minimumTokenId === null || id >= minimumTokenId);
        console.log(`[fetchMeerkatAgents] Meerkat token IDs${minimumTokenId !== null ? ` (>= ${minimumTokenId})` : ''}:`, uniqueIds);

        // Fetch agent details for each minted token
        const fetchPromises = uniqueIds.map(id => fetchAgent(id, publicClient, chainId));
        const results = await Promise.all(fetchPromises);

        // Filter for Meerkat Town agents only (excluding blacklisted test agents)
        const agents: RegisteredAgent[] = [];
        for (const agent of results) {
            if (agent && agent.isMeerkatAgent) {
                // Skip blacklisted agents by ID
                if (BLACKLISTED_AGENT_IDS.includes(agent.agentId)) {
                    console.log(`[fetchMeerkatAgents] Skipping blacklisted agent: ${agent.agentId} - ${agent.metadata?.name}`);
                    continue;
                }
                console.log(`[fetchMeerkatAgents] Found Meerkat agent: ${agent.agentId} - ${agent.metadata?.name}`);
                agents.push(agent);
            }
        }

        console.log(`[fetchMeerkatAgents] Total Meerkat Town agents found: ${agents.length}`);
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
    chainId: number = DEFAULT_CHAIN_ID,
    maxAgents: number = 100
): Promise<RegisteredAgent[]> {
    if (!publicClient || !ownerAddress) return [];

    try {
        console.log(`[fetchAgentsByOwner] Fetching all agents and filtering by owner: ${ownerAddress}`);

        // Fetch all meerkat agents (same as Dashboard)
        const allAgents = await fetchMeerkatAgents(publicClient, chainId, maxAgents);

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
    const identityRegistryAddress = getContractAddress(chainId, 'identityRegistry');

    const { data, isLoading, error, refetch } = useReadContract({
        address: identityRegistryAddress,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        chainId: chainId,
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
    const identityRegistryAddress = getContractAddress(chainId, 'identityRegistry');

    const { data, isLoading, error } = useReadContract({
        address: identityRegistryAddress,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'tokenURI',
        args: agentId !== undefined ? [BigInt(agentId)] : undefined,
        chainId: chainId,
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
    const identityRegistryAddress = getContractAddress(chainId, 'identityRegistry');

    const { data, isLoading, error } = useReadContract({
        address: identityRegistryAddress,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'ownerOf',
        args: agentId !== undefined ? [BigInt(agentId)] : undefined,
        chainId: chainId,
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
    chainId: number = DEFAULT_CHAIN_ID
): Promise<number> {
    if (!publicClient) return 1;

    const rpcClient = getRpcClient(chainId);

    try {
        // Get current block
        const currentBlock = await rpcClient.getBlockNumber();
        // Approximate block time: ETH ~12s, Base ~2s, use 200000 blocks
        const fromBlock = currentBlock - BigInt(200000);

        // Get recent mint events (search backwards)
        const mintEvents = await fetchTransferLogsBackwards(
            fromBlock > 0n ? fromBlock : 0n,
            currentBlock,
            chainId,
            true // filter by mint (from = 0x0)
        );

        if (mintEvents.length === 0) {
            return 1; // First agent
        }

        // Find the highest agent ID
        const maxId = Math.max(...mintEvents.map(e => e.tokenId));
        return maxId + 1;
    } catch (error) {
        console.error('[predictNextAgentId] Error:', error);
        return 1;
    }
}

// Re-export types
export type { AgentMetadata };
