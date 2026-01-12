// ERC-8004 Validation Registry Contract - Base Sepolia
// Enables agents to request validation and validators to provide responses

export const VALIDATION_REGISTRY_ADDRESS = '0x8004C269D0A5647E51E121FeB226200ECE932d55' as const;

export const VALIDATION_REGISTRY_ABI = [
    // ========== READ FUNCTIONS ==========
    {
        name: 'getIdentityRegistry',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: 'identityRegistry', type: 'address' }],
    },
    {
        name: 'getValidationStatus',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'requestHash', type: 'bytes32' }],
        outputs: [
            { name: 'validatorAddress', type: 'address' },
            { name: 'agentId', type: 'uint256' },
            { name: 'response', type: 'uint8' },
            { name: 'tag', type: 'string' },
            { name: 'lastUpdate', type: 'uint256' },
        ],
    },
    {
        name: 'getSummary',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'validatorAddresses', type: 'address[]' },
            { name: 'tag', type: 'string' },
        ],
        outputs: [
            { name: 'count', type: 'uint64' },
            { name: 'averageResponse', type: 'uint8' },
        ],
    },
    {
        name: 'getAgentValidations',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'agentId', type: 'uint256' }],
        outputs: [{ name: 'requestHashes', type: 'bytes32[]' }],
    },
    {
        name: 'getValidatorRequests',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'validatorAddress', type: 'address' }],
        outputs: [{ name: 'requestHashes', type: 'bytes32[]' }],
    },

    // ========== WRITE FUNCTIONS ==========
    {
        name: 'validationRequest',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'validatorAddress', type: 'address' },
            { name: 'agentId', type: 'uint256' },
            { name: 'requestURI', type: 'string' },
            { name: 'requestHash', type: 'bytes32' },
        ],
        outputs: [],
    },
    {
        name: 'validationResponse',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'requestHash', type: 'bytes32' },
            { name: 'response', type: 'uint8' },
            { name: 'responseURI', type: 'string' },
            { name: 'responseHash', type: 'bytes32' },
            { name: 'tag', type: 'string' },
        ],
        outputs: [],
    },

    // ========== EVENTS ==========
    {
        name: 'ValidationRequest',
        type: 'event',
        inputs: [
            { name: 'validatorAddress', type: 'address', indexed: true },
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'requestURI', type: 'string', indexed: false },
            { name: 'requestHash', type: 'bytes32', indexed: true },
        ],
    },
    {
        name: 'ValidationResponse',
        type: 'event',
        inputs: [
            { name: 'validatorAddress', type: 'address', indexed: true },
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'requestHash', type: 'bytes32', indexed: true },
            { name: 'response', type: 'uint8', indexed: false },
            { name: 'responseURI', type: 'string', indexed: false },
            { name: 'responseHash', type: 'bytes32', indexed: false },
            { name: 'tag', type: 'string', indexed: false },
        ],
    },
] as const;
