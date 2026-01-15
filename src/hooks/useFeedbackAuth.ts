// Feedback Utilities for ERC-8004 v1.1
// v1.1: Authorization is no longer required - feedback can be submitted directly
// This file is kept for backward compatibility but most functions are simplified

import { useState, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { REPUTATION_REGISTRY_ADDRESS, REPUTATION_REGISTRY_ABI } from '../contracts/MeerkatReputationRegistry';

// Types (simplified for v1.1)
export interface FeedbackAuthRequest {
    id: string;
    agentId: number;
    clientAddress: string;
    ownerAddress: string;
    requestedFeedbacks: number;
    message?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: number;
}

export interface FeedbackAuthorization {
    agentId: number;
    clientAddress: string;
    ownerAddress: string;
    feedbacksAllowed: number;
    feedbacksUsed: number;
    feedbackIndex: number;
    expiryTimestamp: number;
    signature: string;
    createdAt: number;
}

/**
 * Hook to get the last feedback index for a client
 * Useful for tracking feedback history
 */
export function useGetLastFeedbackIndex(agentId: number | undefined) {
    const [lastIndex, setLastIndex] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { address } = useAccount();
    const publicClient = usePublicClient({ chainId: baseSepolia.id });

    const fetchLastIndex = useCallback(async () => {
        if (!address || !agentId || !publicClient) return null;

        setIsLoading(true);
        try {
            const index = await publicClient.readContract({
                address: REPUTATION_REGISTRY_ADDRESS,
                abi: REPUTATION_REGISTRY_ABI,
                functionName: 'getLastIndex',
                args: [BigInt(agentId), address as `0x${string}`],
            }) as bigint;
            setLastIndex(Number(index));
            return Number(index);
        } catch (e) {
            console.error('Failed to fetch last index:', e);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [address, agentId, publicClient]);

    return { lastIndex, fetchLastIndex, isLoading };
}

/**
 * @deprecated v1.1: Authorization is no longer required
 * Kept for backward compatibility - always returns success
 */
export function useRequestFeedbackAuth() {
    const [isLoading] = useState(false);
    const [error] = useState<string | null>(null);

    const requestAuthorization = useCallback(async () => {
        // v1.1: Authorization not required, return success
        return { success: true, message: 'Authorization not required in v1.1' };
    }, []);

    return { requestAuthorization, isLoading, error };
}

/**
 * @deprecated v1.1: Authorization is no longer required  
 * Kept for backward compatibility
 */
export function usePendingAuthRequests() {
    const [requests] = useState<FeedbackAuthRequest[]>([]);
    const [isLoading] = useState(false);
    const [error] = useState<string | null>(null);

    const fetchRequests = useCallback(async () => {
        // v1.1: No pending requests concept
        return [];
    }, []);

    return { requests, fetchRequests, isLoading, error };
}

/**
 * @deprecated v1.1: Authorization is no longer required
 * Kept for backward compatibility
 */
export function useGrantFeedbackAuth() {
    const [isLoading] = useState(false);
    const [error] = useState<string | null>(null);

    const grantAuthorization = useCallback(async () => {
        return { success: true, message: 'Authorization not required in v1.1' };
    }, []);

    const rejectAuthorization = useCallback(async () => {
        return { success: true };
    }, []);

    return { grantAuthorization, rejectAuthorization, isLoading, error };
}

/**
 * @deprecated v1.1: Authorization is no longer required
 * Returns null authorization - feedback can be submitted directly
 */
export function useFeedbackAuthorization(_agentId: number | undefined) {
    const [authorization] = useState<FeedbackAuthorization | null>(null);
    const [isLoading] = useState(false);
    const [error] = useState<string | null>(null);

    const checkAuthorization = useCallback(async () => {
        // v1.1: Always authorized
        return null;
    }, []);

    const markAsUsed = useCallback(async () => {
        // v1.1: No-op
    }, []);

    return {
        authorization,
        checkAuthorization,
        markAsUsed,
        isLoading,
        error,
        // v1.1: Always authorized
        isAuthorized: true,
    };
}
