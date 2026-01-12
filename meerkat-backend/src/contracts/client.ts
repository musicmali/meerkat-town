// ============================================================================
// MEERKAT CONTRACT CLIENT
// ============================================================================
// Viem client for interacting with deployed Meerkat contracts
// ============================================================================

// Load environment variables FIRST (before any other imports that might use them)
import { config } from 'dotenv';
config();

import { createPublicClient, createWalletClient, http, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import {
    IDENTITY_REGISTRY_ABI,
    REPUTATION_REGISTRY_ABI,
    MKAT_TOKEN_ABI,
} from './abis';

// ============================================================================
// CONFIGURATION
// ============================================================================

const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org';
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;

// Contract addresses from deployment
export const CONTRACTS = {
    identityRegistry: (process.env.IDENTITY_REGISTRY_ADDRESS || '0x374034f1f0D7Bba7e97d7392C5E3917501611fEF') as `0x${string}`,
    reputationRegistry: (process.env.REPUTATION_REGISTRY_ADDRESS || '0x61ec2b7b8a27cf0ace62830101791cdb46593259') as `0x${string}`,
    mkatToken: (process.env.MKAT_TOKEN_ADDRESS || '0x90cbb2f745efc70020ad44432b34f37fb027af2c') as `0x${string}`,
};

// ============================================================================
// CLIENTS
// ============================================================================

// Public client for reading from blockchain
export const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(RPC_URL),
});

// Wallet client for writing to blockchain
const account = privateKeyToAccount(PRIVATE_KEY);
export const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(RPC_URL),
});

export const walletAddress = account.address;

// ============================================================================
// IDENTITY REGISTRY FUNCTIONS
// ============================================================================

/**
 * Get total number of registered agents
 */
export async function getTotalAgents(): Promise<number> {
    const total = await publicClient.readContract({
        address: CONTRACTS.identityRegistry,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'totalAgents',
    });
    return Number(total);
}

/**
 * Get agent details by ID
 */
export async function getAgent(agentId: number): Promise<{
    id: number;
    tokenURI: string;
    owner: string;
    exists: boolean;
} | null> {
    try {
        const [tokenURI, owner, exists] = await Promise.all([
            publicClient.readContract({
                address: CONTRACTS.identityRegistry,
                abi: IDENTITY_REGISTRY_ABI,
                functionName: 'tokenURI',
                args: [BigInt(agentId)],
            }),
            publicClient.readContract({
                address: CONTRACTS.identityRegistry,
                abi: IDENTITY_REGISTRY_ABI,
                functionName: 'ownerOf',
                args: [BigInt(agentId)],
            }),
            publicClient.readContract({
                address: CONTRACTS.identityRegistry,
                abi: IDENTITY_REGISTRY_ABI,
                functionName: 'agentExists',
                args: [BigInt(agentId)],
            }),
        ]);

        return {
            id: agentId,
            tokenURI: tokenURI as string,
            owner: owner as string,
            exists: exists as boolean,
        };
    } catch (error) {
        return null;
    }
}

/**
 * Get agent on-chain metadata
 */
export async function getAgentMetadata(agentId: number, key: string): Promise<string | null> {
    try {
        const value = await publicClient.readContract({
            address: CONTRACTS.identityRegistry,
            abi: IDENTITY_REGISTRY_ABI,
            functionName: 'getMetadata',
            args: [BigInt(agentId), key],
        });

        // Convert bytes to string
        const bytes = value as `0x${string}`;
        if (bytes === '0x' || bytes.length <= 2) return null;

        // Decode hex to string
        const hex = bytes.slice(2);
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        return str;
    } catch {
        return null;
    }
}

/**
 * Get all registered agents
 */
export async function getAllAgents(): Promise<Array<{
    id: number;
    tokenURI: string;
    owner: string;
}>> {
    const total = await getTotalAgents();
    const agents = [];

    for (let i = 1; i <= total; i++) {
        const agent = await getAgent(i);
        if (agent && agent.exists) {
            agents.push(agent);
        }
    }

    return agents;
}

/**
 * Register a new agent (requires wallet)
 */
export async function registerAgent(tokenURI: string): Promise<{
    txHash: string;
    agentId?: number;
}> {
    const hash = await walletClient.writeContract({
        address: CONTRACTS.identityRegistry,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'register',
        args: [tokenURI],
    });

    // Wait for transaction
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Try to get agent ID from logs
    // The Registered event should contain the agentId
    let agentId: number | undefined;

    return { txHash: hash, agentId };
}

// ============================================================================
// REPUTATION REGISTRY FUNCTIONS
// ============================================================================

/**
 * Get agent reputation score
 */
export async function getAgentReputation(agentId: number): Promise<{
    averageScore: number;
    totalFeedback: number;
}> {
    const [avgScore, count] = await publicClient.readContract({
        address: CONTRACTS.reputationRegistry,
        abi: REPUTATION_REGISTRY_ABI,
        functionName: 'getAverageScore',
        args: [BigInt(agentId)],
    }) as [number, bigint];

    return {
        averageScore: avgScore,
        totalFeedback: Number(count),
    };
}

/**
 * Get feedback count from specific client
 */
export async function getFeedbackCount(agentId: number, clientAddress: string): Promise<number> {
    const count = await publicClient.readContract({
        address: CONTRACTS.reputationRegistry,
        abi: REPUTATION_REGISTRY_ABI,
        functionName: 'getFeedbackCount',
        args: [BigInt(agentId), clientAddress as `0x${string}`],
    });

    return Number(count);
}

// ============================================================================
// TOKEN FUNCTIONS
// ============================================================================

/**
 * Get MKAT token info
 */
export async function getTokenInfo(): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    circulatingSupply: string;
}> {
    const [name, symbol, decimals, totalSupply, circulatingSupply] = await Promise.all([
        publicClient.readContract({
            address: CONTRACTS.mkatToken,
            abi: MKAT_TOKEN_ABI,
            functionName: 'name',
        }),
        publicClient.readContract({
            address: CONTRACTS.mkatToken,
            abi: MKAT_TOKEN_ABI,
            functionName: 'symbol',
        }),
        publicClient.readContract({
            address: CONTRACTS.mkatToken,
            abi: MKAT_TOKEN_ABI,
            functionName: 'decimals',
        }),
        publicClient.readContract({
            address: CONTRACTS.mkatToken,
            abi: MKAT_TOKEN_ABI,
            functionName: 'totalSupply',
        }),
        publicClient.readContract({
            address: CONTRACTS.mkatToken,
            abi: MKAT_TOKEN_ABI,
            functionName: 'circulatingSupply',
        }),
    ]);

    return {
        name: name as string,
        symbol: symbol as string,
        decimals: decimals as number,
        totalSupply: formatUnits(totalSupply as bigint, decimals as number),
        circulatingSupply: formatUnits(circulatingSupply as bigint, decimals as number),
    };
}

/**
 * Get MKAT balance for an address
 */
export async function getTokenBalance(address: string): Promise<string> {
    const [balance, decimals] = await Promise.all([
        publicClient.readContract({
            address: CONTRACTS.mkatToken,
            abi: MKAT_TOKEN_ABI,
            functionName: 'balanceOf',
            args: [address as `0x${string}`],
        }),
        publicClient.readContract({
            address: CONTRACTS.mkatToken,
            abi: MKAT_TOKEN_ABI,
            functionName: 'decimals',
        }),
    ]);

    return formatUnits(balance as bigint, decimals as number);
}
