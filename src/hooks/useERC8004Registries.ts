// ERC-8004 Registry Hooks (Multi-Network Support)
// Hooks for interacting with Identity, Reputation, and Validation registries
// Supports Ethereum Mainnet (v1.2) and Base Sepolia (v1.1)
// v1.2: value (int128) + valueDecimals (uint8) - Mainnet
// v1.1: score (uint8) - Base Sepolia

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useChainId } from 'wagmi';
import { useAccount } from 'wagmi';
import { useCallback } from 'react';
import { keccak256, toHex } from 'viem';

// Import registry ABIs and addresses
import { IDENTITY_REGISTRY_ABI, getIdentityRegistryAddress } from '../contracts/MeerkatIdentityRegistry';
import {
    REPUTATION_REGISTRY_ABI,
    REPUTATION_REGISTRY_ABI_V12,
    EMPTY_BYTES32,
    getReputationRegistryAddress,
    getReputationABI
} from '../contracts/MeerkatReputationRegistry';
import { VALIDATION_REGISTRY_ADDRESS, VALIDATION_REGISTRY_ABI } from '../contracts/MeerkatValidationRegistry';

// Import network config
import { isSupportedNetwork, DEFAULT_CHAIN_ID, getReputationVersion, formatCAIP10 as formatCAIP10Helper } from '../config/networks';

// Import types
import type { FeedbackData } from '../types/agentMetadata';

// ============================================================================
// IDENTITY REGISTRY HOOKS
// ============================================================================

/**
 * Get the agent URI (metadata URL) from the Identity Registry
 */
export function useAgentURI(agentId: number, enabled = true) {
    const chainId = useChainId();
    const effectiveChainId = isSupportedNetwork(chainId) ? chainId : DEFAULT_CHAIN_ID;
    const registryAddress = getIdentityRegistryAddress(effectiveChainId);

    return useReadContract({
        address: registryAddress,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'tokenURI',
        args: [BigInt(agentId)],
        chainId: effectiveChainId,
        query: { enabled },
    });
}

/**
 * Get the agent wallet address from the Identity Registry
 */
export function useAgentWallet(agentId: number, enabled = true) {
    const chainId = useChainId();
    const effectiveChainId = isSupportedNetwork(chainId) ? chainId : DEFAULT_CHAIN_ID;
    const registryAddress = getIdentityRegistryAddress(effectiveChainId);

    return useReadContract({
        address: registryAddress,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'getAgentWallet',
        args: [BigInt(agentId)],
        chainId: effectiveChainId,
        query: { enabled },
    });
}

/**
 * Get metadata for an agent by key
 */
export function useAgentMetadata(agentId: number, metadataKey: string, enabled = true) {
    const chainId = useChainId();
    const effectiveChainId = isSupportedNetwork(chainId) ? chainId : DEFAULT_CHAIN_ID;
    const registryAddress = getIdentityRegistryAddress(effectiveChainId);

    return useReadContract({
        address: registryAddress,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'getMetadata',
        args: [BigInt(agentId), metadataKey],
        chainId: effectiveChainId,
        query: { enabled },
    });
}

// ============================================================================
// REPUTATION REGISTRY HOOKS
// ============================================================================

/**
 * Get agent reputation summary
 * Network-aware: uses v1.1 ABI for Base Sepolia, v1.2 for Mainnet
 *
 * Returns:
 * - v1.1: [count, averageScore] where averageScore is uint8 (0-100)
 * - v1.2: [count, summaryValue, summaryValueDecimals] where value is int128
 */
export function useAgentReputation(
    agentId: number,
    clientAddresses: `0x${string}`[] = [],
    tag1: string = '',
    tag2: string = '',
    enabled = true
) {
    const chainId = useChainId();
    const effectiveChainId = isSupportedNetwork(chainId) ? chainId : DEFAULT_CHAIN_ID;
    const registryAddress = getReputationRegistryAddress(effectiveChainId);
    const abi = getReputationABI(effectiveChainId);

    return useReadContract({
        address: registryAddress,
        abi,
        functionName: 'getSummary',
        args: [BigInt(agentId), clientAddresses, tag1, tag2],
        chainId: effectiveChainId,
        query: { enabled },
    });
}

/**
 * Get list of clients who gave feedback to an agent
 */
export function useAgentClients(agentId: number, enabled = true) {
    const chainId = useChainId();
    const effectiveChainId = isSupportedNetwork(chainId) ? chainId : DEFAULT_CHAIN_ID;
    const registryAddress = getReputationRegistryAddress(effectiveChainId);
    const abi = getReputationABI(effectiveChainId);

    return useReadContract({
        address: registryAddress,
        abi,
        functionName: 'getClients',
        args: [BigInt(agentId)],
        chainId: effectiveChainId,
        query: { enabled },
    });
}

/**
 * Get the identity registry address from the reputation registry
 */
export function useReputationIdentityRegistry() {
    const chainId = useChainId();
    const effectiveChainId = isSupportedNetwork(chainId) ? chainId : DEFAULT_CHAIN_ID;
    const registryAddress = getReputationRegistryAddress(effectiveChainId);
    const abi = getReputationABI(effectiveChainId);

    return useReadContract({
        address: registryAddress,
        abi,
        functionName: 'getIdentityRegistry',
        chainId: effectiveChainId,
    });
}

/**
 * Hook to submit feedback for an agent
 * Network-aware: uses appropriate ABI based on chain
 * - v1.1 (Base Sepolia): giveFeedback(uint256,uint8,string,string,string,string,bytes32)
 * - v1.2 (Mainnet): giveFeedback(uint256,int128,uint8,string,string,string,string,bytes32)
 */
export function useGiveFeedback() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { address } = useAccount();
    const chainId = useChainId();
    const effectiveChainId = isSupportedNetwork(chainId) ? chainId : DEFAULT_CHAIN_ID;
    const publicClient = usePublicClient({ chainId: effectiveChainId });
    const reputationVersion = getReputationVersion(effectiveChainId);

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

        const registryAddress = getReputationRegistryAddress(effectiveChainId);
        const identityAddress = getIdentityRegistryAddress(effectiveChainId);

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

        // Use appropriate function signature based on version
        if (reputationVersion === 'v1.2') {
            // v1.2: value (int128) + valueDecimals (uint8)
            writeContract({
                address: registryAddress,
                abi: REPUTATION_REGISTRY_ABI_V12,
                functionName: 'giveFeedback',
                args: [
                    BigInt(agentId),
                    BigInt(score),           // value as int128
                    0,                        // valueDecimals = 0 (whole numbers)
                    options?.tag1 || 'starred', // default tag1 for quality ratings
                    options?.tag2 || '',
                    options?.endpoint || '',
                    options?.feedbackURI || '',
                    options?.feedbackHash || EMPTY_BYTES32,
                ],
                chainId: effectiveChainId,
            });
        } else {
            // v1.1: score (uint8)
            writeContract({
                address: registryAddress,
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
                chainId: effectiveChainId,
            });
        }
    }, [writeContract, address, publicClient, effectiveChainId, reputationVersion]);

    return {
        giveFeedback,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        receipt,
        error,
        clientAddress: address,
        reputationVersion,
    };
}

/**
 * Hook to revoke previously submitted feedback
 */
export function useRevokeFeedback() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const chainId = useChainId();
    const effectiveChainId = isSupportedNetwork(chainId) ? chainId : DEFAULT_CHAIN_ID;

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const revokeFeedback = useCallback((agentId: number, feedbackIndex: bigint) => {
        const registryAddress = getReputationRegistryAddress(effectiveChainId);
        const abi = getReputationABI(effectiveChainId);

        writeContract({
            address: registryAddress,
            abi,
            functionName: 'revokeFeedback',
            args: [BigInt(agentId), feedbackIndex],
            chainId: effectiveChainId,
        });
    }, [writeContract, effectiveChainId]);

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
// Note: Validation registry only exists on Base Sepolia for now
// ============================================================================

const BASE_SEPOLIA_CHAIN_ID = 84532;

/**
 * Get validation summary for an agent
 */
export function useAgentValidationSummary(
    agentId: number,
    validatorAddresses: `0x${string}`[] = [],
    tag = '',
    enabled = true
) {
    return useReadContract({
        address: VALIDATION_REGISTRY_ADDRESS,
        abi: VALIDATION_REGISTRY_ABI,
        functionName: 'getSummary',
        args: [BigInt(agentId), validatorAddresses, tag],
        chainId: BASE_SEPOLIA_CHAIN_ID,
        query: { enabled },
    });
}

/**
 * Get all validation request hashes for an agent
 */
export function useAgentValidations(agentId: number, enabled = true) {
    return useReadContract({
        address: VALIDATION_REGISTRY_ADDRESS,
        abi: VALIDATION_REGISTRY_ABI,
        functionName: 'getAgentValidations',
        args: [BigInt(agentId)],
        chainId: BASE_SEPOLIA_CHAIN_ID,
        query: { enabled },
    });
}

/**
 * Get validation status for a specific request
 */
export function useValidationStatus(requestHash: `0x${string}`, enabled = true) {
    return useReadContract({
        address: VALIDATION_REGISTRY_ADDRESS,
        abi: VALIDATION_REGISTRY_ABI,
        functionName: 'getValidationStatus',
        args: [requestHash],
        chainId: BASE_SEPOLIA_CHAIN_ID,
        query: { enabled },
    });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format a CAIP-10 address for use in feedback data
 */
export function formatCAIP10(address: string, chainId?: number): string {
    return formatCAIP10Helper(address, chainId ?? DEFAULT_CHAIN_ID);
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
    const chainId = options?.chainId ?? DEFAULT_CHAIN_ID;
    const registryAddress = getReputationRegistryAddress(chainId);

    const feedback: FeedbackData = {
        agentRegistry: formatCAIP10(registryAddress, chainId),
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

/**
 * Parse reputation summary data based on network version
 * Returns normalized score (0-100) and count
 */
export function parseReputationSummary(
    data: readonly unknown[] | undefined,
    chainId: number
): { count: number; score: number } {
    if (!data) return { count: 0, score: 0 };

    const version = getReputationVersion(chainId);

    if (version === 'v1.2') {
        // v1.2: [count, summaryValue, summaryValueDecimals]
        const [count, summaryValue, summaryValueDecimals] = data as [bigint, bigint, number];
        const countNum = Number(count);
        if (countNum === 0) return { count: 0, score: 0 };

        // Convert value with decimals to 0-100 score
        const divisor = Math.pow(10, summaryValueDecimals);
        const score = Number(summaryValue) / divisor;
        return { count: countNum, score: Math.round(score) };
    } else {
        // v1.1: [count, averageScore]
        const [count, averageScore] = data as [bigint, number];
        return { count: Number(count), score: averageScore };
    }
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
    const effectiveChainId = isSupportedNetwork(chainId) ? chainId : DEFAULT_CHAIN_ID;

    const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
        hash,
    });

    const register = useCallback((agentURI: string) => {
        const registryAddress = getIdentityRegistryAddress(effectiveChainId);

        writeContract({
            address: registryAddress,
            abi: IDENTITY_REGISTRY_ABI,
            functionName: 'register',
            args: [agentURI],
            chainId: effectiveChainId,
        });
    }, [writeContract, effectiveChainId]);

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
        chainId: effectiveChainId,
    };
}

/**
 * Hook to update an agent's URI in the Identity Registry
 */
export function useSetAgentURI() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const chainId = useChainId();
    const effectiveChainId = isSupportedNetwork(chainId) ? chainId : DEFAULT_CHAIN_ID;

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const setAgentURI = useCallback((agentId: number, newURI: string) => {
        const registryAddress = getIdentityRegistryAddress(effectiveChainId);

        writeContract({
            address: registryAddress,
            abi: IDENTITY_REGISTRY_ABI,
            functionName: 'setAgentURI',
            args: [BigInt(agentId), newURI],
            chainId: effectiveChainId,
        });
    }, [writeContract, effectiveChainId]);

    return {
        setAgentURI,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

// Re-export addresses and ABI helpers for convenience (dynamic versions)
export { getIdentityRegistryAddress, getReputationRegistryAddress };
export { VALIDATION_REGISTRY_ADDRESS };
export { getReputationABI } from '../contracts/MeerkatReputationRegistry';
