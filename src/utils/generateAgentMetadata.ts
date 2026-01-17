// Generate ERC-8004 compliant agent metadata
// Based on https://best-practices.8004scan.io/docs/01-agent-metadata-standard.html
// Using official ERC-8004 Identity Registry only

import type {
    AgentMetadata,
    AgentFormData,
    AgentEndpoint,
    AgentRegistration,
} from '../types/agentMetadata';

import {
    ERC8004_TYPE,
    MCP_VERSION,
    A2A_VERSION,
    OASF_VERSION,
    OASF_ENDPOINT,
    BASE_SEPOLIA_CHAIN_ID,
} from '../types/agentMetadata';

// ERC-8004 Identity Registry on Base Sepolia
import { IDENTITY_REGISTRY_ADDRESS } from '../contracts/MeerkatIdentityRegistry';

// Base URL for hosted assets
const MEERKAT_CDN_URL = 'https://www.meerkat.town';
const MEERKAT_API_URL = 'https://meerkat.up.railway.app';

/**
 * Format a wallet address in CAIP-10 format
 * Example: eip155:84532:0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7
 */
export function formatCAIP10Address(address: string, chainId: number = BASE_SEPOLIA_CHAIN_ID): string {
    return `eip155:${chainId}:${address}`;
}

/**
 * Get the image URL for a meerkat
 */
export function getMeerkatImageUrl(meerkatNumber: number): string {
    const padded = meerkatNumber.toString().padStart(3, '0');
    return `${MEERKAT_CDN_URL}/meerkats/meerkat_${padded}.png`;
}

/**
 * Get the MCP endpoint URL for an agent
 */
export function getMCPEndpoint(agentId: string): string {
    return `${MEERKAT_API_URL}/mcp/${agentId}`;
}

/**
 * Get the A2A agent card URL
 */
export function getA2AEndpoint(agentId: string): string {
    return `${MEERKAT_API_URL}/agents/${agentId}/.well-known/agent-card.json`;
}

/**
 * Generate ERC-8004 compliant agent metadata from form data
 *
 * @param formData - Agent form data from the mint form
 * @param agentId - Optional agent ID (if known after registration in Identity Registry)
 * @returns ERC-8004 compliant metadata object
 */
export function generateAgentMetadata(
    formData: AgentFormData,
    agentId?: number
): AgentMetadata {
    // Use agentId if known, otherwise use meerkat number as temp identifier
    const tempAgentId = agentId !== undefined ? `${agentId}` : `meerkat-${formData.meerkatNumber}`;

    const endpoints: AgentEndpoint[] = [];

    // MCP Endpoint
    endpoints.push({
        name: 'MCP',
        endpoint: getMCPEndpoint(tempAgentId),
        version: MCP_VERSION,
        mcpTools: formData.mcpTools || ['chat', 'get_agent_info'],
        mcpPrompts: formData.mcpPrompts || ['greeting', 'help'],
    });

    // A2A Endpoint
    endpoints.push({
        name: 'A2A',
        endpoint: getA2AEndpoint(tempAgentId),
        version: A2A_VERSION,
        a2aSkills: formData.skills,
    });

    // OASF Endpoint (skills & domains)
    if (formData.skills.length > 0 || formData.domains.length > 0) {
        endpoints.push({
            name: 'OASF',
            endpoint: OASF_ENDPOINT,
            version: OASF_VERSION,
            skills: formData.skills,
            domains: formData.domains,
        });
    }

    // Agent Wallet (payment address on Base Sepolia)
    endpoints.push({
        name: 'agentWallet',
        endpoint: formatCAIP10Address(formData.ownerAddress),
    });

    // Build registrations array for bidirectional verification
    // Links off-chain metadata to on-chain NFT identity
    const registrations: AgentRegistration[] | undefined = agentId !== undefined ? [
        {
            agentId: agentId,
            agentRegistry: formatCAIP10Address(IDENTITY_REGISTRY_ADDRESS),
        },
    ] : undefined;

    // Determine price - default is free ("0")
    const price = formData.pricePerMessage || '0';
    const isFree = price === '0' || price === '';

    return {
        // Required ERC-8004 fields
        type: ERC8004_TYPE,
        name: formData.name,
        description: formData.description,
        image: getMeerkatImageUrl(formData.meerkatNumber),

        // Recommended ERC-8004 fields
        endpoints,
        registrations,

        // Optional ERC-8004 fields
        supportedTrust: ['reputation'],
        active: true,
        x402support: true, // Always enabled for all Meerkat Town agents
        updatedAt: Math.floor(Date.now() / 1000),

        // Meerkat Town specific extensions
        meerkatId: formData.meerkatNumber,
        pricePerMessage: isFree ? 'Free' : price,
    };
}

/**
 * Update metadata with agent ID after registration
 * Used to add the registrations field once we know the agentId
 */
export function addRegistrationToMetadata(
    metadata: AgentMetadata,
    agentId: number
): AgentMetadata {
    return {
        ...metadata,
        registrations: [
            ...(metadata.registrations || []),
            {
                agentId: agentId,
                agentRegistry: formatCAIP10Address(IDENTITY_REGISTRY_ADDRESS),
            },
        ],
        updatedAt: Math.floor(Date.now() / 1000),
    };
}

/**
 * Validate agent metadata according to ERC-8004 spec
 */
export function validateAgentMetadata(metadata: AgentMetadata): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!metadata.type || metadata.type !== ERC8004_TYPE) {
        errors.push('Invalid or missing type field');
    }
    if (!metadata.name || metadata.name.length < 3) {
        errors.push('Name must be at least 3 characters');
    }
    if (metadata.name && metadata.name.length > 200) {
        errors.push('Name must be less than 200 characters');
    }
    if (!metadata.description || metadata.description.length < 50) {
        errors.push('Description must be at least 50 characters');
    }
    if (metadata.description && metadata.description.length > 500) {
        errors.push('Description must be less than 500 characters');
    }
    if (!metadata.image) {
        errors.push('Image is required');
    }

    // Recommended fields
    if (!metadata.endpoints || metadata.endpoints.length === 0) {
        errors.push('At least one endpoint is required');
    }

    // Check for agentWallet (required for x402 support)
    const hasWallet = metadata.endpoints?.some(e => e.name === 'agentWallet');
    if (!hasWallet) {
        errors.push('agentWallet endpoint is required');
    }

    // Meerkat Town specific
    if (!metadata.meerkatId || metadata.meerkatId < 1 || metadata.meerkatId > 100) {
        errors.push('Meerkat ID must be between 1 and 100');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Format metadata as pretty JSON for preview
 */
export function formatMetadataJSON(metadata: AgentMetadata): string {
    return JSON.stringify(metadata, null, 2);
}

/**
 * Check if an agent is free to chat
 */
export function isAgentFree(metadata: AgentMetadata): boolean {
    return metadata.pricePerMessage === 'Free' || metadata.pricePerMessage === '0' || !metadata.pricePerMessage;
}
