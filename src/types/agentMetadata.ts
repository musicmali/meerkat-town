// ERC-8004 Agent Metadata Types
// Based on https://best-practices.8004scan.io/docs/01-agent-metadata-standard.html

export interface AgentEndpoint {
    name: string;
    endpoint: string;
    version?: string;
    // MCP specific
    mcpTools?: string[];
    mcpPrompts?: string[];
    mcpResources?: string[];
    // A2A specific
    a2aSkills?: string[];
    // OASF specific
    skills?: string[];
    domains?: string[];
    // Custom description
    description?: string;
}

export interface AgentRegistration {
    agentId: number;
    agentRegistry: string; // CAIP-10 format: eip155:chainId:contractAddress
}

export interface AgentMetadata {
    // Required fields (ERC-8004)
    type: string;
    name: string;
    description: string;
    image: string;

    // Recommended fields (ERC-8004)
    endpoints: AgentEndpoint[];
    registrations?: AgentRegistration[];

    // Optional fields (ERC-8004)
    supportedTrust?: string[];
    active?: boolean;
    x402support?: boolean;  // Always true for Meerkat Town agents
    updatedAt?: number;

    // Meerkat Town specific extensions
    meerkatId?: number;      // Which meerkat avatar (1-100) this agent uses
    pricePerMessage?: string; // Price per message in USD (e.g., "0.001" or "0" for free)
}

// Form data from user input
export interface AgentFormData {
    // Basic info
    meerkatNumber: number;
    name: string;
    description: string;

    // OASF capabilities
    skills: string[];
    domains: string[];

    // Wallet
    ownerAddress: string;

    // Optional
    mcpTools?: string[];
    mcpPrompts?: string[];

    // Pricing
    pricePerMessage?: string; // Price per message, "0" = free
}

// Constants
export const ERC8004_TYPE = 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1';
export const MCP_VERSION = '2025-06-18';
export const A2A_VERSION = '0.3.0';
export const OASF_VERSION = 'v0.8.0';
export const OASF_ENDPOINT = 'https://github.com/agntcy/oasf/';
export const BASE_SEPOLIA_CHAIN_ID = 84532;

// ============================================================================
// ERC-8004 Feedback Types (Reputation Registry)
// Based on https://best-practices.8004scan.io/docs/02-feedback-standard.html
// ============================================================================

export interface ProofOfPayment {
    fromAddress: string;      // CAIP-10 format: eip155:chainId:address
    toAddress: string;        // CAIP-10 format
    chainId: number;          // e.g., 84532 for Base Sepolia
    txHash: string;           // Transaction hash (0x...)
    amount?: string;          // Payment amount in smallest unit (wei/smallest ERC20 unit)
    currency?: string;        // Currency symbol (e.g., "ETH", "USDC")
    tokenAddress?: string;    // CAIP-10 format for ERC20 tokens
    protocol?: string;        // Payment protocol (e.g., "x402")
    timestamp?: string;       // ISO 8601 timestamp
}

export interface FeedbackAttachment {
    name: string;
    uri: string;              // IPFS or HTTPS URI
    mimeType: string;
    size?: number;
    description?: string;
    uploadedAt?: string;      // ISO 8601
}

export interface FeedbackData {
    // Required fields
    agentRegistry: string;    // CAIP-10 format: eip155:chainId:contractAddress
    agentId: number;
    clientAddress: string;    // CAIP-10 format
    createdAt: string;        // ISO 8601
    score: number;            // 0-100

    // Recommended fields
    reasoning?: string;
    tag1?: string;
    tag2?: string;

    // Protocol-specific fields
    skill?: string;           // OASF/A2A skill used
    context?: string;         // A2A context
    task?: string;            // A2A task description
    capability?: string;      // MCP: "prompts", "resources", "tools", "completions"
    name?: string;            // MCP: tool/prompt name

    // Payment proof
    proof_of_payment?: ProofOfPayment;

    // Attachments
    attachments?: FeedbackAttachment[];

    // Custom extensions
    rating_breakdown?: Record<string, number>;
    interaction_id?: string;
}

// ============================================================================
// ERC-8004 Validation Types (Validation Registry)
// Based on https://best-practices.8004scan.io/docs/03-validation-standard.html
// ============================================================================

export interface ValidationRequest {
    agentRegistry: string;    // CAIP-10 format
    agentId: number;
    validatorAddress: string; // CAIP-10 format
    createdAt: string;        // ISO 8601
    validationType: 'crypto-economic' | 'tee-attestation' | 'zkml-proof' | string;
    reasoning?: string;
    deadline?: string;        // ISO 8601
    requestHash?: string;     // bytes32 commitment
}

export interface ValidationResponse {
    requestHash: string;
    response: number;         // 0-100 (0 = failed, 100 = passed)
    responseURI?: string;
    tag?: string;
    lastUpdate?: number;
}

