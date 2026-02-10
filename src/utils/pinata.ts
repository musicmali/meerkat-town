// IPFS Upload Utility
// Uploads metadata via the backend (which has the Pinata API key)

import type { AgentMetadata } from '../types/agentMetadata';
import { addRegistrationToMetadata } from './generateAgentMetadata';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

export interface UploadResponse {
    ipfsHash: string;
    ipfsUri: string;
    gatewayUrl: string;
}

/**
 * Upload JSON metadata to IPFS via the backend
 * @param metadata The JSON object to upload
 * @param name Optional name for the pin
 * @returns The IPFS URI (ipfs://...)
 */
export async function uploadToIPFS(
    metadata: object,
    name?: string
): Promise<UploadResponse> {
    const response = await fetch(`${BACKEND_URL}/upload-metadata`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metadata, name }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload to IPFS');
    }

    return response.json();
}

/**
 * Fetch metadata from IPFS
 * @param ipfsUri The IPFS URI (ipfs://...) or gateway URL
 * @returns The metadata object
 */
export async function fetchFromIPFS(ipfsUri: string): Promise<AgentMetadata> {
    let url = ipfsUri;
    if (ipfsUri.startsWith('ipfs://')) {
        const cid = ipfsUri.replace('ipfs://', '');
        url = `${IPFS_GATEWAY}/${cid}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch metadata from IPFS');
    }

    return response.json();
}

/**
 * Update an agent's metadata to add the registrations field
 * Returns the new IPFS URI with updated metadata
 * @param currentIpfsUri The current IPFS URI of the agent's metadata
 * @param agentId The agent's token ID
 * @returns The new IPFS URI with registrations added
 */
export async function updateMetadataWithRegistrations(
    currentIpfsUri: string,
    agentId: number
): Promise<UploadResponse> {
    // Fetch current metadata
    const currentMetadata = await fetchFromIPFS(currentIpfsUri);

    // Check if registrations already exist
    if (currentMetadata.registrations && currentMetadata.registrations.length > 0) {
        // Check if this agentId is already registered
        const hasRegistration = currentMetadata.registrations.some(r => r.agentId === agentId);
        if (hasRegistration) {
            throw new Error('Agent already has registrations field');
        }
    }

    // Add registrations field
    const updatedMetadata = addRegistrationToMetadata(currentMetadata, agentId);

    // Upload updated metadata to IPFS
    return uploadToIPFS(updatedMetadata, `meerkat-agent-${agentId}-updated`);
}

/**
 * Store an A2A agent card in the backend database
 * Should be called during the minting process
 */
export interface StoreAgentCardParams {
    meerkatId: number;
    name: string;
    description: string;
    image: string;
    skills: string[];  // OASF skill slugs
    price: string;
    ownerAddress: string;
}

export interface StoreAgentCardResponse {
    success: boolean;
    message: string;
    cardUrl: string;
}

export async function storeAgentCard(params: StoreAgentCardParams): Promise<StoreAgentCardResponse> {
    const response = await fetch(`${BACKEND_URL}/agent-cards`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to store agent card');
    }

    return response.json();
}

// ============================================================================
// AGENTS API (Database-backed agent storage for fast listing)
// ============================================================================

/**
 * Store an agent in the backend database after minting
 * This allows fast agent listing without expensive RPC calls
 */
export interface StoreAgentParams {
    chainId: number;
    agentId: number;
    ownerAddress: string;
    metadataUri?: string;
    meerkatId?: number;
    name?: string;
    description?: string;
    image?: string;
    pricePerMessage?: string;
    x402Support?: boolean;
    metadata?: Record<string, unknown>;
}

export interface StoreAgentResponse {
    success: boolean;
    message: string;
    agent: {
        chainId: number;
        agentId: number;
        name?: string;
        meerkatId?: number;
    };
}

export async function storeAgentInDatabase(params: StoreAgentParams): Promise<StoreAgentResponse> {
    const response = await fetch(`${BACKEND_URL}/api/agents`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to store agent');
    }

    return response.json();
}

/**
 * Fetch all agents for a chain from the backend database
 */
export interface FetchAgentsResponse {
    chainId: number;
    agents: Array<{
        agentId: number;
        owner: string;
        metadataUri?: string;
        metadata: {
            name?: string;
            description?: string;
            image?: string;
            meerkatId?: number;
            pricePerMessage?: string;
            x402support?: boolean;
            [key: string]: unknown;
        };
        isMeerkatAgent: boolean;
    }>;
    count: number;
    source: string;
}

export async function fetchAgentsFromDatabase(chainId: number): Promise<FetchAgentsResponse> {
    const response = await fetch(`${BACKEND_URL}/api/agents?chainId=${chainId}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch agents');
    }

    return response.json();
}

/**
 * Fetch agents owned by a specific address from the backend database
 */
export async function fetchAgentsByOwnerFromDatabase(
    chainId: number,
    ownerAddress: string
): Promise<FetchAgentsResponse> {
    const response = await fetch(`${BACKEND_URL}/api/agents/owner/${chainId}/${ownerAddress}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch agents by owner');
    }

    return response.json();
}

/**
 * Check if database has agents for a chain
 */
export interface AgentsStatusResponse {
    chainId: number;
    databaseAvailable: boolean;
    hasAgents: boolean;
    agentCount: number;
}

/**
 * Update an existing agent in the database (uses upsert under the hood)
 * Convenience wrapper for storeAgentInDatabase with update semantics
 */
export async function updateAgentInDatabase(params: StoreAgentParams): Promise<StoreAgentResponse> {
    return storeAgentInDatabase(params);
}

export async function checkAgentsStatus(chainId: number): Promise<AgentsStatusResponse> {
    const response = await fetch(`${BACKEND_URL}/api/agents/status/${chainId}`);

    if (!response.ok) {
        // If endpoint fails, assume database not available
        return {
            chainId,
            databaseAvailable: false,
            hasAgents: false,
            agentCount: 0,
        };
    }

    return response.json();
}
