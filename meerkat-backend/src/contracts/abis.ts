// ============================================================================
// CONTRACT ABIs
// ============================================================================
// ABIs extracted from compiled Meerkat contracts
// ============================================================================

export const IDENTITY_REGISTRY_ABI = [
    // Read functions
    {
        name: 'totalAgents',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'uint256' }],
    },
    {
        name: 'ownerOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ type: 'address' }],
    },
    {
        name: 'tokenURI',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ type: 'string' }],
    },
    {
        name: 'getMetadata',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'key', type: 'string' },
        ],
        outputs: [{ type: 'bytes' }],
    },
    {
        name: 'agentExists',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'agentId', type: 'uint256' }],
        outputs: [{ type: 'bool' }],
    },
    // Write functions
    {
        name: 'register',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'tokenURI', type: 'string' }],
        outputs: [{ name: 'agentId', type: 'uint256' }],
    },
    {
        name: 'setMetadata',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'key', type: 'string' },
            { name: 'value', type: 'bytes' },
        ],
        outputs: [],
    },
    // Events
    {
        name: 'Registered',
        type: 'event',
        inputs: [
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'tokenURI', type: 'string', indexed: false },
            { name: 'owner', type: 'address', indexed: true },
        ],
    },
] as const;

export const REPUTATION_REGISTRY_ABI = [
    // Read functions
    {
        name: 'getAverageScore',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'agentId', type: 'uint256' }],
        outputs: [
            { name: 'averageScore', type: 'uint8' },
            { name: 'count', type: 'uint256' },
        ],
    },
    {
        name: 'getFeedback',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'clientAddress', type: 'address' },
            { name: 'feedbackIndex', type: 'uint64' },
        ],
        outputs: [
            {
                type: 'tuple',
                components: [
                    { name: 'score', type: 'uint8' },
                    { name: 'tag1', type: 'bytes32' },
                    { name: 'tag2', type: 'bytes32' },
                    { name: 'fileUri', type: 'string' },
                    { name: 'timestamp', type: 'uint64' },
                    { name: 'revoked', type: 'bool' },
                ],
            },
        ],
    },
    {
        name: 'getFeedbackCount',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'clientAddress', type: 'address' },
        ],
        outputs: [{ type: 'uint64' }],
    },
    {
        name: 'getIdentityRegistry',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'address' }],
    },
    // Write functions
    {
        name: 'giveFeedbackSimple',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'score', type: 'uint8' },
            { name: 'tag1', type: 'bytes32' },
            { name: 'tag2', type: 'bytes32' },
        ],
        outputs: [],
    },
    // Events
    {
        name: 'NewFeedback',
        type: 'event',
        inputs: [
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'clientAddress', type: 'address', indexed: true },
            { name: 'score', type: 'uint8', indexed: false },
            { name: 'tag1', type: 'bytes32', indexed: true },
            { name: 'tag2', type: 'bytes32', indexed: false },
            { name: 'fileUri', type: 'string', indexed: false },
        ],
    },
] as const;

export const MKAT_TOKEN_ABI = [
    {
        name: 'name',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'string' }],
    },
    {
        name: 'symbol',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'string' }],
    },
    {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'uint8' }],
    },
    {
        name: 'totalSupply',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'uint256' }],
    },
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ type: 'uint256' }],
    },
    {
        name: 'circulatingSupply',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'uint256' }],
    },
    {
        name: 'TOTAL_SUPPLY',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'uint256' }],
    },
] as const;
