// ERC-8004 Reputation Registry Contract - Base Sepolia (v1.1)
// Enables clients to give feedback to agents with scores, tags, and optional endpoint tracking
// v1.1: FeedbackAuth removed, tags changed to strings, endpoint field added
//
// NOTE: When ERC-8004 final contracts are deployed, update this file:
// - score (uint8) will become value (int128) + valueDecimals (uint8)
// - getSummary will return [count, averageValue, valueDecimals] instead of [count, averageScore]

export const REPUTATION_REGISTRY_ADDRESS = '0x8004B663056A597Dffe9eCcC1965A193B7388713' as const;

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
