// Hook for interacting with MeerkatAgents NFT contract
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { MEERKAT_AGENTS_ADDRESS, MEERKAT_AGENTS_ABI } from '../contracts/MeerkatAgents';

/**
 * Hook to check if a specific meerkat is available
 */
export function useIsMeerkatAvailable(meerkatId: number) {
    return useReadContract({
        address: MEERKAT_AGENTS_ADDRESS,
        abi: MEERKAT_AGENTS_ABI,
        functionName: 'isMeerkatAvailable',
        args: [BigInt(meerkatId)],
    });
}

/**
 * Hook to get available meerkat count
 */
export function useAvailableMeerkatCount() {
    return useReadContract({
        address: MEERKAT_AGENTS_ADDRESS,
        abi: MEERKAT_AGENTS_ABI,
        functionName: 'availableMeerkatCount',
    });
}

/**
 * Hook to get all available meerkat IDs
 */
export function useAvailableMeerkats() {
    return useReadContract({
        address: MEERKAT_AGENTS_ADDRESS,
        abi: MEERKAT_AGENTS_ABI,
        functionName: 'getAvailableMeerkats',
    });
}

/**
 * Hook to get max meerkat ID
 */
export function useMaxMeerkatId() {
    return useReadContract({
        address: MEERKAT_AGENTS_ADDRESS,
        abi: MEERKAT_AGENTS_ABI,
        functionName: 'maxMeerkatId',
        chainId: 84532, // Base mainnet
    });
}

/**
 * Hook to mint a new agent
 */
export function useMintAgent() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const mint = (meerkatId: number, metadataURI: string) => {
        writeContract({
            address: MEERKAT_AGENTS_ADDRESS,
            abi: MEERKAT_AGENTS_ABI,
            functionName: 'mintAgent',
            args: [BigInt(meerkatId), metadataURI],
        });
    };

    return {
        mint,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

/**
 * Hook to burn an agent
 */
export function useBurnAgent() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const burn = (tokenId: number) => {
        writeContract({
            address: MEERKAT_AGENTS_ADDRESS,
            abi: MEERKAT_AGENTS_ABI,
            functionName: 'burnAgent',
            args: [BigInt(tokenId)],
        });
    };

    return {
        burn,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

/**
 * Hook to get agent info by token ID
 */
export function useAgentInfo(tokenId: number) {
    return useReadContract({
        address: MEERKAT_AGENTS_ADDRESS,
        abi: MEERKAT_AGENTS_ABI,
        functionName: 'getAgentInfo',
        args: [BigInt(tokenId)],
    });
}

/**
 * Interface for a minted agent
 */
export interface MintedAgent {
    tokenId: number;
    meerkatId: number;
    owner: string;
    metadataUri: string;
    metadata?: {
        name?: string;
        description?: string;
        image?: string;
        endpoints?: {
            name: string;
            skills?: string[];
            domains?: string[];
            a2aSkills?: string[];
        }[];
    };
}

/**
 * Fetch all minted agents by comparing available vs total meerkats
 * Optimized to use fewer RPC calls with retry logic for reliability
 */
export async function fetchMintedAgents(
    maxMeerkatId: number,
    publicClient: any
): Promise<MintedAgent[]> {
    const agents: MintedAgent[] = [];

    // Helper function to retry RPC calls with exponential backoff
    async function withRetry<T>(
        fn: () => Promise<T>,
        retries = 3,
        delayMs = 500
    ): Promise<T | null> {
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                return await fn();
            } catch (e) {
                console.warn(`RPC attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`);
                if (attempt < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    delayMs *= 2; // Exponential backoff
                }
            }
        }
        return null;
    }

    // Helper to add delay between requests
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        // Get all available (non-minted) meerkats in one call
        const availableMeerkats = await withRetry(async () => {
            return await publicClient.readContract({
                address: MEERKAT_AGENTS_ADDRESS,
                abi: MEERKAT_AGENTS_ABI,
                functionName: 'getAvailableMeerkats',
            }) as bigint[];
        });

        if (!availableMeerkats) {
            console.error('Failed to get available meerkats after retries');
            return agents;
        }

        const availableSet = new Set(availableMeerkats.map(id => Number(id)));

        // Find minted meerkats (those NOT in available list)
        const mintedMeerkatIds: number[] = [];
        for (let i = 1; i <= maxMeerkatId; i++) {
            if (!availableSet.has(i)) {
                mintedMeerkatIds.push(i);
            }
        }

        console.log('Minted meerkat IDs:', mintedMeerkatIds);

        // Fetch details for each minted meerkat with delays to avoid rate limiting
        for (const meerkatId of mintedMeerkatIds) {
            let tokenId = 0;
            let owner = '';
            let metadataUri = '';
            let metadata;

            // Add small delay between agents to avoid rate limiting
            await delay(100);

            // Get the token ID for this meerkat with retry
            const tokenIdResult = await withRetry(async () => {
                return Number(await publicClient.readContract({
                    address: MEERKAT_AGENTS_ADDRESS,
                    abi: MEERKAT_AGENTS_ABI,
                    functionName: 'meerkatToToken',
                    args: [BigInt(meerkatId)],
                }));
            });
            if (tokenIdResult !== null) {
                tokenId = tokenIdResult;
            }

            await delay(100);

            // Get agent info with retry
            if (tokenId > 0) {
                const agentInfo = await withRetry(async () => {
                    return await publicClient.readContract({
                        address: MEERKAT_AGENTS_ADDRESS,
                        abi: MEERKAT_AGENTS_ABI,
                        functionName: 'getAgentInfo',
                        args: [BigInt(tokenId)],
                    }) as [bigint, string, string];
                });
                if (agentInfo) {
                    const [, agentOwner, agentMetadataUri] = agentInfo;
                    owner = agentOwner;
                    metadataUri = agentMetadataUri;
                }
            }

            // Try to fetch metadata from IPFS with retry
            if (metadataUri && metadataUri.startsWith('ipfs://')) {
                const gatewayUrl = metadataUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
                const metadataResult = await withRetry(async () => {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    const response = await fetch(gatewayUrl, { signal: controller.signal });
                    clearTimeout(timeoutId);
                    if (response.ok) {
                        return await response.json();
                    }
                    throw new Error('Metadata fetch failed');
                }, 2, 300);
                if (metadataResult) {
                    metadata = metadataResult;
                }
            }

            // Always add the agent - we at least know the meerkat ID is taken
            agents.push({
                tokenId,
                meerkatId,
                owner: owner || 'Unknown',
                metadataUri: metadataUri || '',
                metadata,
            });
        }
    } catch (e) {
        console.error('Failed to fetch available meerkats:', e);
    }

    return agents;
}


