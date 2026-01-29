// ERC-8004 Reputation Registry Contract ABIs
// Supports both v1.1 (Base Sepolia) and v1.2 (ETH mainnet) contracts
//
// v1.1 (Base Sepolia): Uses score (uint8)
// v1.2 (ETH mainnet): Uses value (int128) + valueDecimals (uint8)

// Default address for backwards compatibility (Base Sepolia)
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

// ============================================================================
// v1.2 ABI (Ethereum Mainnet) - Uses value/valueDecimals
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
            { name: 'values', type: 'int128[]' },
            { name: 'valueDecimalsArr', type: 'uint8[]' },
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
    // v1.2 event includes value/valueDecimals
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
