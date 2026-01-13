// ERC-8004 Registry Hooks
// Hooks for interacting with Identity, Reputation, and Validation registries on Base Sepolia

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { useAccount } from 'wagmi';
import { useCallback, useState } from 'react';
import { keccak256, toHex, stringToHex, concat, encodeAbiParameters } from 'viem';

// Import registry ABIs and addresses
import { IDENTITY_REGISTRY_ADDRESS, IDENTITY_REGISTRY_ABI } from '../contracts/MeerkatIdentityRegistry';
import { REPUTATION_REGISTRY_ADDRESS, REPUTATION_REGISTRY_ABI, EMPTY_BYTES32 } from '../contracts/MeerkatReputationRegistry';
import { VALIDATION_REGISTRY_ADDRESS, VALIDATION_REGISTRY_ABI } from '../contracts/MeerkatValidationRegistry';

// Import types
import type { FeedbackData } from '../types/agentMetadata';

// Chain ID for Base Sepolia
const BASE_SEPOLIA_CHAIN_ID = 84532;

// ============================================================================
// IDENTITY REGISTRY HOOKS
// ============================================================================

/**
 * Get the agent URI (metadata URL) from the Identity Registry
 */
export function useAgentURI(agentId: number, enabled = true) {
    return useReadContract({
        address: IDENTITY_REGISTRY_ADDRESS,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'tokenURI',
        args: [BigInt(agentId)],
        chainId: BASE_SEPOLIA_CHAIN_ID,
        query: { enabled },
    });
}

/**
 * Get the agent wallet address from the Identity Registry
 */
export function useAgentWallet(agentId: number, enabled = true) {
    return useReadContract({
        address: IDENTITY_REGISTRY_ADDRESS,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'getAgentWallet',
        args: [BigInt(agentId)],
        chainId: BASE_SEPOLIA_CHAIN_ID,
        query: { enabled },
    });
}

/**
 * Get metadata for an agent by key
 */
export function useAgentMetadata(agentId: number, metadataKey: string, enabled = true) {
    return useReadContract({
        address: IDENTITY_REGISTRY_ADDRESS,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'getMetadata',
        args: [BigInt(agentId), metadataKey],
        chainId: BASE_SEPOLIA_CHAIN_ID,
        query: { enabled },
    });
}

// ============================================================================
// REPUTATION REGISTRY HOOKS
// ============================================================================

/**
 * Get agent reputation summary (count and average score)
 * @param agentId - The agent's token ID
 * @param clientAddresses - Optional filter by specific client addresses
 * @param tag1 - Optional filter by tag1
 * @param tag2 - Optional filter by tag2
 */
export function useAgentReputation(
    agentId: number,
    clientAddresses: `0x${string}`[] = [],
    tag1: `0x${string}` = EMPTY_BYTES32,
    tag2: `0x${string}` = EMPTY_BYTES32,
    enabled = true
) {
    return useReadContract({
        address: REPUTATION_REGISTRY_ADDRESS,
        abi: REPUTATION_REGISTRY_ABI,
        functionName: 'getSummary',
        args: [BigInt(agentId), clientAddresses, tag1, tag2],
        chainId: BASE_SEPOLIA_CHAIN_ID,
        query: { enabled },
    });
}

/**
 * Get list of clients who gave feedback to an agent
 */
export function useAgentClients(agentId: number, enabled = true) {
    return useReadContract({
        address: REPUTATION_REGISTRY_ADDRESS,
        abi: REPUTATION_REGISTRY_ABI,
        functionName: 'getClients',
        args: [BigInt(agentId)],
        chainId: BASE_SEPOLIA_CHAIN_ID,
        query: { enabled },
    });
}

/**
 * Get the identity registry address from the reputation registry
 */
export function useReputationIdentityRegistry() {
    return useReadContract({
        address: REPUTATION_REGISTRY_ADDRESS,
        abi: REPUTATION_REGISTRY_ABI,
        functionName: 'getIdentityRegistry',
        chainId: BASE_SEPOLIA_CHAIN_ID,
    });
}

/**
 * Convert a string to bytes32 (padded right with zeros)
 */
function stringToBytes32(str: string): `0x${string}` {
    if (!str) return EMPTY_BYTES32;
    // Convert string to hex, then pad to 32 bytes
    const hex = stringToHex(str, { size: 32 });
    return hex;
}

/**
 * Pack the auth data with signature
 * Uses abi.encode for the auth struct (as per ERC-8004 spec)
 * Format: abi.encodePacked(abi.encode(auth), signature)
 */
function packFeedbackAuth(
    agentId: number,
    clientAddress: `0x${string}`,
    feedbackIndex: number,
    timestamp: number,
    chainId: number,
    identityRegistry: `0x${string}`,
    agentOwner: `0x${string}`,
    signature: `0x${string}`
): `0x${string}` {
    // Use abi.encode for the auth struct (each field padded to 32 bytes)
    const encodedAuth = encodeAbiParameters(
        [
            { type: 'uint256' },
            { type: 'address' },
            { type: 'uint256' },
            { type: 'uint256' },
            { type: 'uint256' },
            { type: 'address' },
            { type: 'address' },
        ],
        [
            BigInt(agentId),
            clientAddress,
            BigInt(feedbackIndex),
            BigInt(timestamp),
            BigInt(chainId),
            identityRegistry,
            agentOwner,
        ]
    );

    // Concatenate abi.encode(auth) + signature (65 bytes)
    const authData = concat([encodedAuth, signature]);
    return authData;
}

/**
 * Hook to submit feedback for an agent
 * Contract signature: giveFeedback(uint256,uint8,bytes32,bytes32,string,bytes32,bytes)
 */
export function useGiveFeedback() {
    const { writeContract, data: hash, isPending: isWritePending, error: writeError } = useWriteContract();
    const { address } = useAccount();
    const publicClient = usePublicClient({ chainId: BASE_SEPOLIA_CHAIN_ID });

    const [isSigningAuth, setIsSigningAuth] = useState(false);
    const [authError, setAuthError] = useState<Error | null>(null);

    const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
        hash,
    });

    const giveFeedback = useCallback(async (
        agentId: number,
        score: number,
        options?: {
            tag1?: string;
            tag2?: string;
            feedbackURI?: string;
            feedbackHash?: `0x${string}`;
            // Stored authorization from backend (owner's signature)
            storedAuth?: {
                signature: string;
                expiryTimestamp: number;
                feedbacksAllowed: number;
                feedbacksUsed: number;
                feedbackIndex: number;  // The feedback index that was signed
                ownerAddress: string;
            };
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

        setAuthError(null);
        setIsSigningAuth(true);

        try {
            // Step 1: Verify stored authorization exists
            if (!options?.storedAuth) {
                throw new Error('Authorization required. Please request authorization from the agent owner first.');
            }

            // Step 2: Get the next feedback index for this client from blockchain
            const lastIndex = await publicClient.readContract({
                address: REPUTATION_REGISTRY_ADDRESS,
                abi: REPUTATION_REGISTRY_ABI,
                functionName: 'getLastIndex',
                args: [BigInt(agentId), address],
            }) as bigint;
            const nextIndex = Number(lastIndex) + 1;

            // Step 3: Verify the stored feedbackIndex matches what the contract expects
            const storedFeedbackIndex = options.storedAuth.feedbackIndex;
            if (nextIndex !== storedFeedbackIndex) {
                throw new Error(`Authorization feedbackIndex mismatch. Expected ${nextIndex}, got ${storedFeedbackIndex}. Please request new authorization.`);
            }

            // Step 4: Get agent owner from Identity Registry
            const agentOwner = await publicClient.readContract({
                address: IDENTITY_REGISTRY_ADDRESS,
                abi: IDENTITY_REGISTRY_ABI,
                functionName: 'ownerOf',
                args: [BigInt(agentId)],
            }) as `0x${string}`;

            // Check if connected wallet is the agent owner - self-feedback is not allowed
            const isOwner = agentOwner.toLowerCase() === address.toLowerCase();
            if (isOwner) {
                throw new Error('Cannot rate your own agent. Self-feedback is not allowed.');
            }

            // Use the owner's stored authorization
            const expiryTimestamp = options.storedAuth.expiryTimestamp;
            const signature = options.storedAuth.signature as `0x${string}`;

            // Step 5: Pack the full auth using the owner's stored signature
            // IMPORTANT: Use the storedFeedbackIndex (what was signed), not nextIndex
            const feedbackAuth = packFeedbackAuth(
                agentId,
                address,
                storedFeedbackIndex,
                expiryTimestamp,
                BASE_SEPOLIA_CHAIN_ID,
                IDENTITY_REGISTRY_ADDRESS,
                agentOwner,
                signature
            );

            setIsSigningAuth(false);

            // Step 6: Convert string tags to bytes32
            const tag1Bytes = stringToBytes32(options?.tag1 || '');
            const tag2Bytes = stringToBytes32(options?.tag2 || '');
            const feedbackURI = options?.feedbackURI || '';
            const feedbackHash = options?.feedbackHash || EMPTY_BYTES32;

            // Step 7: Submit the feedback transaction
            writeContract({
                address: REPUTATION_REGISTRY_ADDRESS,
                abi: REPUTATION_REGISTRY_ABI,
                functionName: 'giveFeedback',
                args: [
                    BigInt(agentId),
                    score,
                    tag1Bytes,
                    tag2Bytes,
                    feedbackURI,
                    feedbackHash,
                    feedbackAuth,
                ],
                chainId: BASE_SEPOLIA_CHAIN_ID,
            });
        } catch (e) {
            setIsSigningAuth(false);
            setAuthError(e as Error);
            console.error('Failed to generate feedback auth:', e);
            throw e;
        }
    }, [writeContract, address, publicClient]);

    const isPending = isSigningAuth || isWritePending;
    const error = authError || writeError;

    return {
        giveFeedback,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        receipt,
        error,
        clientAddress: address,
        isSigningAuth,
    };
}

/**
 * Hook to revoke previously submitted feedback
 */
export function useRevokeFeedback() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const revokeFeedback = useCallback((agentId: number, feedbackIndex: bigint) => {
        writeContract({
            address: REPUTATION_REGISTRY_ADDRESS,
            abi: REPUTATION_REGISTRY_ABI,
            functionName: 'revokeFeedback',
            args: [BigInt(agentId), feedbackIndex],
            chainId: BASE_SEPOLIA_CHAIN_ID,
        });
    }, [writeContract]);

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
export function formatCAIP10(address: string, chainId: number = BASE_SEPOLIA_CHAIN_ID): string {
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
    }
): FeedbackData {
    const now = new Date().toISOString();

    const feedback: FeedbackData = {
        agentRegistry: formatCAIP10(REPUTATION_REGISTRY_ADDRESS),
        agentId,
        clientAddress: formatCAIP10(clientAddress),
        createdAt: now,
        score,
        reasoning: options?.reasoning,
        tag1: options?.tag1,
        tag2: options?.tag2,
    };

    if (paymentProof) {
        feedback.proof_of_payment = {
            fromAddress: formatCAIP10(clientAddress),
            toAddress: formatCAIP10(paymentProof.toAddress),
            chainId: BASE_SEPOLIA_CHAIN_ID,
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

    const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
        hash,
    });

    const register = useCallback((agentURI: string) => {
        writeContract({
            address: IDENTITY_REGISTRY_ADDRESS,
            abi: IDENTITY_REGISTRY_ABI,
            functionName: 'register',
            args: [agentURI],
            chainId: BASE_SEPOLIA_CHAIN_ID,
        });
    }, [writeContract]);

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

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const setAgentURI = useCallback((agentId: number, newURI: string) => {
        writeContract({
            address: IDENTITY_REGISTRY_ADDRESS,
            abi: IDENTITY_REGISTRY_ABI,
            functionName: 'setAgentURI',
            args: [BigInt(agentId), newURI],
            chainId: BASE_SEPOLIA_CHAIN_ID,
        });
    }, [writeContract]);

    return {
        setAgentURI,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

// Re-export addresses for convenience
export { IDENTITY_REGISTRY_ADDRESS, REPUTATION_REGISTRY_ADDRESS, VALIDATION_REGISTRY_ADDRESS };
