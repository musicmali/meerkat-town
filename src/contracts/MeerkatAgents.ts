// MeerkatAgents NFT Contract - Frontend Integration
// Deployed on Base Sepolia (Chain ID: 84532)

export const MEERKAT_AGENTS_ADDRESS = '0x9c3fD900E053A14CF35d7900EFb2Fb8E7617A5E4' as const;

export const MEERKAT_AGENTS_ABI = [
    // Read functions
    {
        name: 'maxMeerkatId',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'uint256' }],
    },
    {
        name: 'isMeerkatAvailable',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'meerkatId', type: 'uint256' }],
        outputs: [{ type: 'bool' }],
    },
    {
        name: 'meerkatTaken',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'meerkatId', type: 'uint256' }],
        outputs: [{ type: 'bool' }],
    },
    {
        name: 'getAvailableMeerkats',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'uint256[]' }],
    },
    {
        name: 'availableMeerkatCount',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'uint256' }],
    },
    {
        name: 'tokenToMeerkat',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ type: 'uint256' }],
    },
    {
        name: 'meerkatToToken',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'meerkatId', type: 'uint256' }],
        outputs: [{ type: 'uint256' }],
    },
    {
        name: 'getAgentInfo',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [
            { name: 'meerkatId', type: 'uint256' },
            { name: 'owner', type: 'address' },
            { name: 'metadataURI', type: 'string' },
        ],
    },
    {
        name: 'ownerOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ type: 'address' }],
    },
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ type: 'uint256' }],
    },
    // Write functions
    {
        name: 'mintAgent',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'meerkatId', type: 'uint256' },
            { name: 'metadataURI', type: 'string' },
        ],
        outputs: [{ type: 'uint256' }],
    },
    {
        name: 'burnAgent',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [],
    },
    // Events
    {
        name: 'AgentMinted',
        type: 'event',
        inputs: [
            { name: 'owner', type: 'address', indexed: true },
            { name: 'tokenId', type: 'uint256', indexed: true },
            { name: 'meerkatId', type: 'uint256', indexed: true },
            { name: 'metadataURI', type: 'string', indexed: false },
        ],
    },
    {
        name: 'AgentBurned',
        type: 'event',
        inputs: [
            { name: 'owner', type: 'address', indexed: true },
            { name: 'tokenId', type: 'uint256', indexed: true },
            { name: 'meerkatId', type: 'uint256', indexed: true },
        ],
    },
] as const;
