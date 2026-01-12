// IPFS Upload Utility
// Uploads metadata via the backend (which has the Pinata API key)

import type { AgentMetadata } from '../types/agentMetadata';
import { addRegistrationToMetadata } from './generateAgentMetadata';

const BACKEND_URL = 'http://localhost:3000';
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
