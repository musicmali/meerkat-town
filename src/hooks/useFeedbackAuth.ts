// Hook for managing feedback authorization requests and approvals
// Interacts with the backend API for storing auth data

import { useState, useCallback } from 'react';
import { useAccount, useSignMessage, usePublicClient } from 'wagmi';
import { encodeAbiParameters, keccak256 } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { REPUTATION_REGISTRY_ADDRESS, REPUTATION_REGISTRY_ABI } from '../contracts/MeerkatReputationRegistry';

const BACKEND_URL = 'http://localhost:3000';
const BASE_SEPOLIA_CHAIN_ID = 84532;
const IDENTITY_REGISTRY_ADDRESS = '0x8004AA63c570c570eBF15376c0dB199918BFe9Fb';

// Types
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
    feedbackIndex: number;  // The feedback index this authorization is valid for
    expiryTimestamp: number;
    signature: string;
    createdAt: number;
}

/**
 * Hook for clients to request feedback authorization
 */
export function useRequestFeedbackAuth() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { address } = useAccount();

    const requestAuthorization = useCallback(async (
        agentId: number,
        ownerAddress: string,
        requestedFeedbacks: number = 5,
        message?: string
    ) => {
        if (!address) {
            throw new Error('Wallet not connected');
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${BACKEND_URL}/feedback-auth/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId,
                    clientAddress: address,
                    ownerAddress,
                    requestedFeedbacks,
                    message,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit request');
            }

            return data;
        } catch (e: any) {
            setError(e.message);
            throw e;
        } finally {
            setIsLoading(false);
        }
    }, [address]);

    return { requestAuthorization, isLoading, error };
}

/**
 * Hook for owners to get pending authorization requests
 */
export function usePendingAuthRequests() {
    const [requests, setRequests] = useState<FeedbackAuthRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { address } = useAccount();

    const fetchRequests = useCallback(async () => {
        if (!address) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${BACKEND_URL}/feedback-auth/requests/${address}`);
            const data = await response.json();
            setRequests(data.requests || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [address]);

    return { requests, fetchRequests, isLoading, error };
}

/**
 * Hook for owners to grant or reject authorization requests
 */
export function useGrantFeedbackAuth() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { signMessageAsync } = useSignMessage();
    const { address } = useAccount();
    const publicClient = usePublicClient({ chainId: baseSepolia.id });

    /**
     * Build the authorization struct hash for signing
     * Uses abi.encode (not encodePacked) as per ERC-8004 spec
     * The contract expects: keccak256(abi.encode(auth struct))
     */
    const buildAuthStructHash = (
        agentId: number,
        clientAddress: string,
        feedbackIndex: number,
        expiryTimestamp: number,
        chainId: number,
        identityRegistry: string,
        ownerAddress: string
    ): `0x${string}` => {
        // Use abi.encode (encodeAbiParameters) - each value is padded to 32 bytes
        const encoded = encodeAbiParameters(
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
                clientAddress as `0x${string}`,
                BigInt(feedbackIndex),
                BigInt(expiryTimestamp),
                BigInt(chainId),
                identityRegistry as `0x${string}`,
                ownerAddress as `0x${string}`,
            ]
        );
        // Return the keccak256 hash of the encoded struct
        return keccak256(encoded);
    };

    const grantAuthorization = useCallback(async (
        request: FeedbackAuthRequest,
        feedbacksAllowed: number = 5,
        expiryDays: number = 30
    ) => {
        if (!address) {
            throw new Error('Wallet not connected');
        }

        if (!publicClient) {
            throw new Error('Public client not available');
        }

        setIsLoading(true);
        setError(null);

        try {
            // Get the client's current feedback index from the blockchain
            const lastIndex = await publicClient.readContract({
                address: REPUTATION_REGISTRY_ADDRESS,
                abi: REPUTATION_REGISTRY_ABI,
                functionName: 'getLastIndex',
                args: [BigInt(request.agentId), request.clientAddress as `0x${string}`],
            }) as bigint;
            const nextFeedbackIndex = Number(lastIndex) + 1;

            console.log('Signing authorization for feedbackIndex:', nextFeedbackIndex);

            // Calculate expiry timestamp
            const expiryTimestamp = Math.floor(Date.now() / 1000) + (expiryDays * 24 * 60 * 60);

            // Build the struct hash (keccak256 of abi.encode(auth))
            const structHash = buildAuthStructHash(
                request.agentId,
                request.clientAddress,
                nextFeedbackIndex,
                expiryTimestamp,
                BASE_SEPOLIA_CHAIN_ID,
                IDENTITY_REGISTRY_ADDRESS,
                address
            );

            console.log('Struct hash to sign:', structHash);

            // Sign the struct hash using EIP-191 (personal_sign)
            // signMessage adds "\x19Ethereum Signed Message:\n32" prefix automatically
            const signature = await signMessageAsync({
                message: { raw: structHash },
            });

            // Submit to backend with the feedbackIndex
            const response = await fetch(`${BACKEND_URL}/feedback-auth/grant`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId: request.id,
                    feedbacksAllowed,
                    expiryDays,
                    signature,
                    feedbackIndex: nextFeedbackIndex,
                    expiryTimestamp,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to grant authorization');
            }

            return data;
        } catch (e: any) {
            setError(e.message);
            throw e;
        } finally {
            setIsLoading(false);
        }
    }, [address, signMessageAsync, publicClient]);

    const rejectAuthorization = useCallback(async (requestId: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${BACKEND_URL}/feedback-auth/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to reject request');
            }

            return data;
        } catch (e: any) {
            setError(e.message);
            throw e;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { grantAuthorization, rejectAuthorization, isLoading, error };
}

/**
 * Hook to check if a client has valid authorization for an agent
 */
export function useFeedbackAuthorization(agentId: number | undefined) {
    const [authorization, setAuthorization] = useState<FeedbackAuthorization | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { address } = useAccount();

    const checkAuthorization = useCallback(async () => {
        if (!address || !agentId) return null;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${BACKEND_URL}/feedback-auth/${agentId}/${address}`);
            const data = await response.json();

            if (data.authorized) {
                setAuthorization(data.authorization);
                return data.authorization;
            } else {
                setAuthorization(null);
                setError(data.error);
                return null;
            }
        } catch (e: any) {
            setError(e.message);
            setAuthorization(null);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [address, agentId]);

    const markAsUsed = useCallback(async () => {
        if (!address || !agentId) return;

        try {
            await fetch(`${BACKEND_URL}/feedback-auth/use`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId, clientAddress: address }),
            });
        } catch (e) {
            console.error('Failed to mark feedback as used:', e);
        }
    }, [address, agentId]);

    return { authorization, checkAuthorization, markAsUsed, isLoading, error };
}
