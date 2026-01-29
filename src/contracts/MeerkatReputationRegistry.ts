// ERC-8004 Reputation Registry Contract
// Supports both v1.1 (Base Sepolia) and v1.2 (Ethereum Mainnet) ABIs
// v1.1: score (uint8) - Base Sepolia testnet
// v1.2: value (int128) + valueDecimals (uint8) - Ethereum Mainnet

import { getContractAddress, getReputationVersion } from '../config/networks';

// Base Sepolia address (for backwards compatibility)
export const REPUTATION_REGISTRY_ADDRESS = '0x8004B663056A597Dffe9eCcC1965A193B7388713' as const;

/**
 * Get reputation registry address for a specific chain
 */
export function getReputationRegistryAddress(chainId: number): `0x${string}` {
    return getContractAddress(chainId, 'reputationRegistry');
}

export const REPUTATION_REGISTRY_ABI = [
    // ========== READ FUNCTIONS ==========
    {
        name: 'getIdentityRegistry',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: 'identityRegistry', type: 'address' }],
    },
    {
        name: 'getSummary',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'clientAddresses', type: 'address[]' },
            { name: 'tag1', type: 'string' },
            { name: 'tag2', type: 'string' },
        ],
        outputs: [
            { name: 'count', type: 'uint64' },
            { name: 'averageScore', type: 'uint8' },
        ],
    },
    {
        name: 'readFeedback',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'clientAddress', type: 'address' },
            { name: 'feedbackIndex', type: 'uint64' },
        ],
        outputs: [
            { name: 'score', type: 'uint8' },
            { name: 'tag1', type: 'string' },
            { name: 'tag2', type: 'string' },
            { name: 'isRevoked', type: 'bool' },
        ],
    },
    {
        name: 'readAllFeedback',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'clientAddresses', type: 'address[]' },
            { name: 'tag1', type: 'string' },
            { name: 'tag2', type: 'string' },
            { name: 'includeRevoked', type: 'bool' },
        ],
        outputs: [
            { name: 'clientAddresses', type: 'address[]' },
            { name: 'feedbackIndexes', type: 'uint64[]' },
            { name: 'scores', type: 'uint8[]' },
            { name: 'tag1s', type: 'string[]' },
            { name: 'tag2s', type: 'string[]' },
            { name: 'revokedStatuses', type: 'bool[]' },
        ],
    },
    {
        name: 'getClients',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'agentId', type: 'uint256' }],
        outputs: [{ name: '', type: 'address[]' }],
    },
    {
        name: 'getLastIndex',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'clientAddress', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint64' }],
    },
    {
        name: 'getResponseCount',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'clientAddress', type: 'address' },
            { name: 'feedbackIndex', type: 'uint64' },
            { name: 'responders', type: 'address[]' },
        ],
        outputs: [{ name: '', type: 'uint64' }],
    },

    // ========== WRITE FUNCTIONS ==========
    // v1.1 signature: giveFeedback(uint256,uint8,string,string,string,string,bytes32)
    {
        name: 'giveFeedback',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'score', type: 'uint8' },
            { name: 'tag1', type: 'string' },
            { name: 'tag2', type: 'string' },
            { name: 'endpoint', type: 'string' },
            { name: 'feedbackURI', type: 'string' },
            { name: 'feedbackHash', type: 'bytes32' },
        ],
        outputs: [],
    },
    {
        name: 'revokeFeedback',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'feedbackIndex', type: 'uint64' },
        ],
        outputs: [],
    },
    {
        name: 'appendResponse',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'clientAddress', type: 'address' },
            { name: 'feedbackIndex', type: 'uint64' },
            { name: 'responseURI', type: 'string' },
            { name: 'responseHash', type: 'bytes32' },
        ],
        outputs: [],
    },

    // ========== EVENTS ==========
    // v1.1 event includes feedbackIndex and string tags
    {
        name: 'NewFeedback',
        type: 'event',
        inputs: [
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'clientAddress', type: 'address', indexed: true },
            { name: 'feedbackIndex', type: 'uint64', indexed: false },
            { name: 'score', type: 'uint8', indexed: false },
            { name: 'indexedTag1', type: 'string', indexed: true },
            { name: 'tag1', type: 'string', indexed: false },
            { name: 'tag2', type: 'string', indexed: false },
            { name: 'endpoint', type: 'string', indexed: false },
            { name: 'feedbackURI', type: 'string', indexed: false },
            { name: 'feedbackHash', type: 'bytes32', indexed: false },
        ],
    },
    {
        name: 'FeedbackRevoked',
        type: 'event',
        inputs: [
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'clientAddress', type: 'address', indexed: true },
            { name: 'feedbackIndex', type: 'uint64', indexed: true },
        ],
    },
    {
        name: 'ResponseAppended',
        type: 'event',
        inputs: [
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'clientAddress', type: 'address', indexed: true },
            { name: 'feedbackIndex', type: 'uint64', indexed: false },
            { name: 'responder', type: 'address', indexed: true },
            { name: 'responseURI', type: 'string', indexed: false },
        ],
    },
] as const;

// Helper constant for empty bytes32 hash
export const EMPTY_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as const;

// ============================================================================
// V1.2 ABI (Ethereum Mainnet) - Uses value/valueDecimals instead of score
// ============================================================================

export const REPUTATION_REGISTRY_ABI_V12 = [
    // ========== READ FUNCTIONS ==========
    {
        name: 'getIdentityRegistry',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: 'identityRegistry', type: 'address' }],
    },
    {
        name: 'getSummary',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'clientAddresses', type: 'address[]' },
            { name: 'tag1', type: 'string' },
            { name: 'tag2', type: 'string' },
        ],
        outputs: [
            { name: 'count', type: 'uint64' },
            { name: 'summaryValue', type: 'int128' },
            { name: 'summaryValueDecimals', type: 'uint8' },
        ],
    },
    {
        name: 'readFeedback',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'clientAddress', type: 'address' },
            { name: 'feedbackIndex', type: 'uint64' },
        ],
        outputs: [
            { name: 'value', type: 'int128' },
            { name: 'valueDecimals', type: 'uint8' },
            { name: 'tag1', type: 'string' },
            { name: 'tag2', type: 'string' },
            { name: 'isRevoked', type: 'bool' },
        ],
    },
    {
        name: 'getClients',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'agentId', type: 'uint256' }],
        outputs: [{ name: '', type: 'address[]' }],
    },
    {
        name: 'getLastIndex',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'clientAddress', type: 'address' },
        ],
        outputs: [{ name: '', type: 'uint64' }],
    },

    // ========== WRITE FUNCTIONS ==========
    // v1.2 signature: giveFeedback(uint256,int128,uint8,string,string,string,string,bytes32)
    {
        name: 'giveFeedback',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'value', type: 'int128' },
            { name: 'valueDecimals', type: 'uint8' },
            { name: 'tag1', type: 'string' },
            { name: 'tag2', type: 'string' },
            { name: 'endpoint', type: 'string' },
            { name: 'feedbackURI', type: 'string' },
            { name: 'feedbackHash', type: 'bytes32' },
        ],
        outputs: [],
    },
    {
        name: 'revokeFeedback',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'feedbackIndex', type: 'uint64' },
        ],
        outputs: [],
    },
    {
        name: 'appendResponse',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'clientAddress', type: 'address' },
            { name: 'feedbackIndex', type: 'uint64' },
            { name: 'responseURI', type: 'string' },
            { name: 'responseHash', type: 'bytes32' },
        ],
        outputs: [],
    },

    // ========== EVENTS ==========
    {
        name: 'NewFeedback',
        type: 'event',
        inputs: [
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'clientAddress', type: 'address', indexed: true },
            { name: 'feedbackIndex', type: 'uint64', indexed: false },
            { name: 'value', type: 'int128', indexed: false },
            { name: 'valueDecimals', type: 'uint8', indexed: false },
            { name: 'indexedTag1', type: 'string', indexed: true },
            { name: 'tag1', type: 'string', indexed: false },
            { name: 'tag2', type: 'string', indexed: false },
            { name: 'endpoint', type: 'string', indexed: false },
            { name: 'feedbackURI', type: 'string', indexed: false },
            { name: 'feedbackHash', type: 'bytes32', indexed: false },
        ],
    },
    {
        name: 'FeedbackRevoked',
        type: 'event',
        inputs: [
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'clientAddress', type: 'address', indexed: true },
            { name: 'feedbackIndex', type: 'uint64', indexed: true },
        ],
    },
] as const;

/**
 * Get the appropriate ABI for a chain's reputation version
 */
export function getReputationABI(chainId: number) {
    const version = getReputationVersion(chainId);
    return version === 'v1.2' ? REPUTATION_REGISTRY_ABI_V12 : REPUTATION_REGISTRY_ABI;
}

// Alias for backwards compatibility - v1.1 ABI
export const REPUTATION_REGISTRY_ABI_V11 = REPUTATION_REGISTRY_ABI;
