// ERC-8004 Registry Hooks (v1.2 - Final Spec)
// Hooks for interacting with Identity, Reputation, and Validation registries
// Supports both Base Sepolia (v1.1 score) and Ethereum mainnet (v1.2 value/valueDecimals)

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useChainId } from 'wagmi';
import { useAccount } from 'wagmi';
import { useCallback } from 'react';
import { keccak256, toHex } from 'viem';

// Import registry ABIs
import { IDENTITY_REGISTRY_ABI } from '../contracts/MeerkatIdentityRegistry';
import {
    REPUTATION_REGISTRY_ABI,
    REPUTATION_REGISTRY_ABI_V12,
    EMPTY_BYTES32,
} from '../contracts/MeerkatReputationRegistry';
import { VALIDATION_REGISTRY_ABI } from '../contracts/MeerkatValidationRegistry';

// Import network configuration
import {
    getContractAddress,
    getReputationVersion,
    DEFAULT_CHAIN_ID,
} from '../config/networks';

// Import types
import type { FeedbackData } from '../types/agentMetadata';

// Legacy exports for backwards compatibility
export const IDENTITY_REGISTRY_ADDRESS = getContractAddress(DEFAULT_CHAIN_ID, 'identityRegistry');
export const REPUTATION_REGISTRY_ADDRESS = getContractAddress(DEFAULT_CHAIN_ID, 'reputationRegistry');
export const VALIDATION_REGISTRY_ADDRESS = '0x8004C269D0A5647E51E121FeB226200ECE932d55' as const;

// ============================================================================
// IDENTITY REGISTRY HOOKS
// ============================================================================

/**
 * Get the agent URI (metadata URL) from the Identity Registry
 */
export function useAgentURI(agentId: number, enabled = true) {
    const chainId = useChainId();
    const address = getContractAddress(chainId, 'identityRegistry');

    return useReadContract({
        address,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'tokenURI',
        args: [BigInt(agentId)],
        chainId,
        query: { enabled },
    });
}

/**
 * Get the agent wallet address from the Identity Registry
 */
export function useAgentWallet(agentId: number, enabled = true) {
    const chainId = useChainId();
    const address = getContractAddress(chainId, 'identityRegistry');

    return useReadContract({
        address,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'getAgentWallet',
        args: [BigInt(agentId)],
        chainId,
        query: { enabled },
    });
}

/**
 * Get metadata for an agent by key
 */
export function useAgentMetadata(agentId: number, metadataKey: string, enabled = true) {
    const chainId = useChainId();
    const address = getContractAddress(chainId, 'identityRegistry');

    return useReadContract({
        address,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'getMetadata',
        args: [BigInt(agentId), metadataKey],
        chainId,
        query: { enabled },
    });
}

// ============================================================================
// REPUTATION REGISTRY HOOKS
// ============================================================================

/**
 * Get the ABI for reputation registry based on version
 */
function getReputationABI(chainId: number) {
    const version = getReputationVersion(chainId);
    return version === 'v1.2' ? REPUTATION_REGISTRY_ABI_V12 : REPUTATION_REGISTRY_ABI;
}

/**
 * Get list of clients who gave feedback to an agent
 */
export function useAgentClients(agentId: number, enabled = true) {
    const chainId = useChainId();
    const address = getContractAddress(chainId, 'reputationRegistry');
    const abi = getReputationABI(chainId);

    return useReadContract({
        address,
        abi,
        functionName: 'getClients',
        args: [BigInt(agentId)],
        chainId,
        query: { enabled },
    });
}

/**
 * Get agent reputation summary (count and average value)
 * v1.1 (Base Sepolia): Returns [count, averageScore] - accepts empty clientAddresses
 * v1.2 (ETH mainnet): Returns [count, summaryValue, summaryValueDecimals] - REQUIRES clientAddresses
 *
 * For v1.2, this hook first fetches the client addresses, then fetches the summary.
 * @param agentId - The agent's token ID
 * @param tag1 - Optional filter by tag1 (e.g., "starred", "uptime", "successRate")
 * @param tag2 - Optional filter by tag2 (e.g., time window: "day", "week", "month")
 */
export function useAgentReputation(
    agentId: number,
    clientAddresses: `0x${string}`[] = [],
    tag1: string = '',
    tag2: string = '',
    enabled = true
) {
    const chainId = useChainId();
    const address = getContractAddress(chainId, 'reputationRegistry');
    const abi = getReputationABI(chainId);
    const reputationVersion = getReputationVersion(chainId);

    // For v1.2, we need to fetch clients first (contract requires clientAddresses)
    const { data: clients, isLoading: isLoadingClients } = useReadContract({
        address,
        abi,
        functionName: 'getClients',
        args: [BigInt(agentId)],
        chainId,
        query: { enabled: enabled && reputationVersion === 'v1.2' && clientAddresses.length === 0 },
    });

    // Determine which client addresses to use
    // For v1.2: use fetched clients (or provided clientAddresses if given)
    // For v1.1: use provided clientAddresses (empty array is OK)
    const effectiveClients = reputationVersion === 'v1.2'
        ? (clientAddresses.length > 0 ? clientAddresses : (clients as `0x${string}`[] || []))
        : clientAddresses;

    // For v1.2, only call getSummary once we have clients
    const summaryEnabled = enabled && (
        reputationVersion === 'v1.1' ||
        clientAddresses.length > 0 ||
        (clients && (clients as `0x${string}`[]).length > 0)
    );

    const summaryResult = useReadContract({
        address,
        abi,
        functionName: 'getSummary',
        args: [BigInt(agentId), effectiveClients, tag1, tag2],
        chainId,
        query: { enabled: summaryEnabled },
    });

    // For v1.2 with no provided clients, combine loading states
    if (reputationVersion === 'v1.2' && clientAddresses.length === 0) {
        return {
            ...summaryResult,
            isLoading: isLoadingClients || summaryResult.isLoading,
        };
    }

    return summaryResult;
}

/**
 * Get the identity registry address from the reputation registry
 */
export function useReputationIdentityRegistry() {
    const chainId = useChainId();
    const address = getContractAddress(chainId, 'reputationRegistry');
    const abi = getReputationABI(chainId);

    return useReadContract({
        address,
        abi,
        functionName: 'getIdentityRegistry',
        chainId,
    });
}

/**
 * Hook to submit feedback for an agent
 * v1.1 (Base Sepolia): giveFeedback(agentId, score, tag1, tag2, endpoint, feedbackURI, feedbackHash)
 * v1.2 (ETH mainnet): giveFeedback(agentId, value, valueDecimals, tag1, tag2, endpoint, feedbackURI, feedbackHash)
 */
export function useGiveFeedback() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { address } = useAccount();
    const chainId = useChainId();
    const publicClient = usePublicClient({ chainId });
    const reputationVersion = getReputationVersion(chainId);

    const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
        hash,
    });

    const giveFeedback = useCallback(async (
        agentId: number,
        score: number,
        options?: {
            tag1?: string;
            tag2?: string;
            endpoint?: string;
            feedbackURI?: string;
            feedbackHash?: `0x${string}`;
        }
    ) => {
        if (score < 0 || score > 100) {
            throw new Error('Score must be between 0 and 100');
        }

        if (!address) {
            throw new Error('Wallet not connected');
        }

        if (!publicClient) {
            throw new Error('Public client not available');
        }

        const identityAddress = getContractAddress(chainId, 'identityRegistry');
        const reputationAddress = getContractAddress(chainId, 'reputationRegistry');

        // Check if connected wallet is the agent owner - self-feedback is not allowed
        const agentOwner = await publicClient.readContract({
            address: identityAddress,
            abi: IDENTITY_REGISTRY_ABI,
            functionName: 'ownerOf',
            args: [BigInt(agentId)],
        }) as `0x${string}`;

        const isOwner = agentOwner.toLowerCase() === address.toLowerCase();
        if (isOwner) {
            throw new Error('Cannot rate your own agent. Self-feedback is not allowed.');
        }

        // Use appropriate ABI and args based on version
        if (reputationVersion === 'v1.2') {
            // v1.2: Uses value (int128) and valueDecimals (uint8)
            writeContract({
                address: reputationAddress,
                abi: REPUTATION_REGISTRY_ABI_V12,
                functionName: 'giveFeedback',
                args: [
                    BigInt(agentId),
                    BigInt(score), // value as int128
                    0, // valueDecimals (score is 0-100, no decimals)
                    options?.tag1 || 'starred', // Default tag1 for star rating
                    options?.tag2 || '',
                    options?.endpoint || '',
                    options?.feedbackURI || '',
                    options?.feedbackHash || EMPTY_BYTES32,
                ],
                chainId,
            });
        } else {
            // v1.1: Uses score (uint8)
            writeContract({
                address: reputationAddress,
                abi: REPUTATION_REGISTRY_ABI,
                functionName: 'giveFeedback',
                args: [
                    BigInt(agentId),
                    score,
                    options?.tag1 || '',
                    options?.tag2 || '',
                    options?.endpoint || '',
                    options?.feedbackURI || '',
                    options?.feedbackHash || EMPTY_BYTES32,
                ],
                chainId,
            });
        }
    }, [writeContract, address, publicClient, chainId, reputationVersion]);

    return {
        giveFeedback,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        receipt,
        error,
        clientAddress: address,
    };
}

/**
 * Hook to revoke previously submitted feedback
 */
export function useRevokeFeedback() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const chainId = useChainId();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const revokeFeedback = useCallback((agentId: number, feedbackIndex: bigint) => {
        const address = getContractAddress(chainId, 'reputationRegistry');
        const abi = getReputationABI(chainId);

        writeContract({
            address,
            abi,
            functionName: 'revokeFeedback',
            args: [BigInt(agentId), feedbackIndex],
            chainId,
        });
    }, [writeContract, chainId]);

    return {
        revokeFeedback,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

// ============================================================================
// VALIDATION REGISTRY HOOKS
// ============================================================================

// Note: Validation registry is currently only on Base Sepolia
const BASE_SEPOLIA_VALIDATION_REGISTRY = '0x8004C269D0A5647E51E121FeB226200ECE932d55' as const;

/**
 * Get validation summary for an agent
 */
export function useAgentValidationSummary(
    agentId: number,
    validatorAddresses: `0x${string}`[] = [],
    tag = '',
    enabled = true
) {
    const chainId = useChainId();
    // Validation registry only on Base Sepolia for now
    const isSupported = chainId === 84532;

    return useReadContract({
        address: BASE_SEPOLIA_VALIDATION_REGISTRY,
        abi: VALIDATION_REGISTRY_ABI,
        functionName: 'getSummary',
        args: [BigInt(agentId), validatorAddresses, tag],
        chainId: 84532,
        query: { enabled: enabled && isSupported },
    });
}

/**
 * Get all validation request hashes for an agent
 */
export function useAgentValidations(agentId: number, enabled = true) {
    const chainId = useChainId();
    const isSupported = chainId === 84532;

    return useReadContract({
        address: BASE_SEPOLIA_VALIDATION_REGISTRY,
        abi: VALIDATION_REGISTRY_ABI,
        functionName: 'getAgentValidations',
        args: [BigInt(agentId)],
        chainId: 84532,
        query: { enabled: enabled && isSupported },
    });
}

/**
 * Get validation status for a specific request
 */
export function useValidationStatus(requestHash: `0x${string}`, enabled = true) {
    const chainId = useChainId();
    const isSupported = chainId === 84532;

    return useReadContract({
        address: BASE_SEPOLIA_VALIDATION_REGISTRY,
        abi: VALIDATION_REGISTRY_ABI,
        functionName: 'getValidationStatus',
        args: [requestHash],
        chainId: 84532,
        query: { enabled: enabled && isSupported },
    });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format a CAIP-10 address for use in feedback data
 */
export function formatCAIP10(address: string, chainId: number = DEFAULT_CHAIN_ID): string {
    return `eip155:${chainId}:${address}`;
}

/**
 * Create feedback data object with x402 payment proof
 */
export function createFeedbackData(
    agentId: number,
    clientAddress: string,
    score: number,
    paymentProof?: {
        txHash: string;
        amount: string;
        toAddress: string;
    },
    options?: {
        reasoning?: string;
        tag1?: string;
        tag2?: string;
        endpoint?: string;
        chainId?: number;
    }
): FeedbackData {
    const now = new Date().toISOString();
    const chainId = options?.chainId || DEFAULT_CHAIN_ID;
    const reputationAddress = getContractAddress(chainId, 'reputationRegistry');

    const feedback: FeedbackData = {
        agentRegistry: formatCAIP10(reputationAddress, chainId),
        agentId,
        clientAddress: formatCAIP10(clientAddress, chainId),
        createdAt: now,
        value: score,
        valueDecimals: 0,
        score, // Legacy field
        reasoning: options?.reasoning,
        tag1: options?.tag1,
        tag2: options?.tag2,
        endpoint: options?.endpoint,
    };

    if (paymentProof) {
        feedback.proof_of_payment = {
            fromAddress: formatCAIP10(clientAddress, chainId),
            toAddress: formatCAIP10(paymentProof.toAddress, chainId),
            chainId,
            txHash: paymentProof.txHash,
            amount: paymentProof.amount,
            currency: 'USDC',
            protocol: 'x402',
            timestamp: now,
        };
    }

    return feedback;
}

/**
 * Compute keccak256 hash of feedback JSON for on-chain integrity verification
 */
export function computeFeedbackHash(feedbackData: FeedbackData): `0x${string}` {
    const jsonString = JSON.stringify(feedbackData);
    return keccak256(toHex(jsonString));
}

// ============================================================================
// IDENTITY REGISTRY WRITE HOOKS
// ============================================================================

/**
 * Hook to register a new agent in the ERC-8004 Identity Registry
 * Returns the new agentId after successful registration
 */
export function useRegisterAgent() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { address } = useAccount();
    const chainId = useChainId();

    const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
        hash,
    });

    const register = useCallback((agentURI: string) => {
        const identityAddress = getContractAddress(chainId, 'identityRegistry');

        writeContract({
            address: identityAddress,
            abi: IDENTITY_REGISTRY_ABI,
            functionName: 'register',
            args: [agentURI],
            chainId,
        });
    }, [writeContract, chainId]);

    // Parse the agentId from transaction logs
    const getAgentIdFromReceipt = useCallback((): bigint | null => {
        if (!receipt?.logs) return null;

        // Look for the Registered event
        // event Registered(uint256 indexed agentId, string agentURI, address indexed owner)
        for (const log of receipt.logs) {
            // The agentId is the first indexed topic (after the event signature)
            if (log.topics.length >= 2) {
                try {
                    // topics[0] is event signature, topics[1] is agentId
                    const agentId = BigInt(log.topics[1] as string);
                    return agentId;
                } catch {
                    continue;
                }
            }
        }
        return null;
    }, [receipt]);

    return {
        register,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        receipt,
        error,
        ownerAddress: address,
        getAgentIdFromReceipt,
    };
}

/**
 * Hook to update an agent's URI in the Identity Registry
 */
export function useSetAgentURI() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const chainId = useChainId();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const setAgentURI = useCallback((agentId: number, newURI: string) => {
        const identityAddress = getContractAddress(chainId, 'identityRegistry');

        writeContract({
            address: identityAddress,
            abi: IDENTITY_REGISTRY_ABI,
            functionName: 'setAgentURI',
            args: [BigInt(agentId), newURI],
            chainId,
        });
    }, [writeContract, chainId]);

    return {
        setAgentURI,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}
