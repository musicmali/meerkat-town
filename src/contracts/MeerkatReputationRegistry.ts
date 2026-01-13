// ERC-8004 Reputation Registry Contract - Base Sepolia
// Enables clients to give feedback to agents with scores, tags, and optional payment proofs

export const REPUTATION_REGISTRY_ADDRESS = '0x8004bd8daB57f14Ed299135749a5CB5c42d341BF' as const;

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
            { name: 'tag1', type: 'bytes32' },
            { name: 'tag2', type: 'bytes32' },
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
            { name: 'tag1', type: 'bytes32' },
            { name: 'tag2', type: 'bytes32' },
            { name: 'includeRevoked', type: 'bool' },
        ],
        outputs: [
            { name: 'clientAddresses', type: 'address[]' },
            { name: 'feedbackIndexes', type: 'uint64[]' },
            { name: 'scores', type: 'uint8[]' },
            { name: 'tag1s', type: 'bytes32[]' },
            { name: 'tag2s', type: 'bytes32[]' },
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
    // Correct signature: giveFeedback(uint256,uint8,bytes32,bytes32,string,bytes32,bytes) = 0x155e5bbd
    {
        name: 'giveFeedback',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'score', type: 'uint8' },
            { name: 'tag1', type: 'bytes32' },
            { name: 'tag2', type: 'bytes32' },
            { name: 'feedbackURI', type: 'string' },
            { name: 'feedbackHash', type: 'bytes32' },
            { name: 'feedbackAuth', type: 'bytes' },
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
            { name: 'score', type: 'uint8', indexed: false },
            { name: 'tag1', type: 'string', indexed: true },
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

// Helper constants
export const EMPTY_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as const;
