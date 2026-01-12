// ERC-8004 Identity Registry Contract - Base Sepolia
// The Identity Registry uses ERC-721 with URIStorage extension for agent registration
// Our MeerkatAgents contract serves as the identity source, this registry is for protocol-level integration

export const IDENTITY_REGISTRY_ADDRESS = '0x8004AA63c570c570eBF15376c0dB199918BFe9Fb' as const;

export const IDENTITY_REGISTRY_ABI = [
    // ========== READ FUNCTIONS ==========
    {
        name: 'name',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'string' }],
    },
    {
        name: 'symbol',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'string' }],
    },
    {
        name: 'tokenURI',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'string' }],
    },
    {
        name: 'ownerOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'address' }],
    },
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'totalSupply',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'getMetadata',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'metadataKey', type: 'string' },
        ],
        outputs: [{ name: 'metadataValue', type: 'bytes' }],
    },
    {
        name: 'getAgentWallet',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'agentId', type: 'uint256' }],
        outputs: [{ name: '', type: 'address' }],
    },

    // ========== WRITE FUNCTIONS ==========
    {
        name: 'register',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'agentURI', type: 'string' }],
        outputs: [{ name: 'agentId', type: 'uint256' }],
    },
    {
        name: 'registerWithMetadata',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'agentURI', type: 'string' },
            {
                name: 'metadata',
                type: 'tuple[]',
                components: [
                    { name: 'metadataKey', type: 'string' },
                    { name: 'metadataValue', type: 'bytes' },
                ],
            },
        ],
        outputs: [{ name: 'agentId', type: 'uint256' }],
    },
    {
        name: 'setAgentURI',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'agentURI', type: 'string' },
        ],
        outputs: [],
    },
    {
        name: 'setMetadata',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'metadataKey', type: 'string' },
            { name: 'metadataValue', type: 'bytes' },
        ],
        outputs: [],
    },
    {
        name: 'setAgentWallet',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'newWallet', type: 'address' },
            { name: 'deadline', type: 'uint256' },
            { name: 'signature', type: 'bytes' },
        ],
        outputs: [],
    },

    // ========== EVENTS ==========
    {
        name: 'Registered',
        type: 'event',
        inputs: [
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'agentURI', type: 'string', indexed: false },
            { name: 'owner', type: 'address', indexed: true },
        ],
    },
    {
        name: 'URIUpdated',
        type: 'event',
        inputs: [
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'newURI', type: 'string', indexed: false },
        ],
    },
    {
        name: 'MetadataSet',
        type: 'event',
        inputs: [
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'indexedMetadataKey', type: 'string', indexed: true },
            { name: 'metadataKey', type: 'string', indexed: false },
            { name: 'metadataValue', type: 'bytes', indexed: false },
        ],
    },
    {
        name: 'Transfer',
        type: 'event',
        inputs: [
            { name: 'from', type: 'address', indexed: true },
            { name: 'to', type: 'address', indexed: true },
            { name: 'tokenId', type: 'uint256', indexed: true },
        ],
    },
] as const;
