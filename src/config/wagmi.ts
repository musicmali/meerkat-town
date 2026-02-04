import { http, createConfig } from 'wagmi';
import { base, mainnet, baseSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { NETWORKS, SUPPORTED_CHAIN_IDS, DEFAULT_CHAIN_ID } from './networks';

// Supported chains for Meerkat Town (Base mainnet first = default, Ethereum mainnet, Base Sepolia)
const supportedChains = [base, mainnet, baseSepolia] as [typeof base, typeof mainnet, typeof baseSepolia];

// Create transports with configured RPCs for supported networks
const transports: Record<number, ReturnType<typeof http>> = {};
for (const chainId of SUPPORTED_CHAIN_IDS) {
    transports[chainId] = http(NETWORKS[chainId].rpcUrl);
}

// Configure wagmi with supported chains
export const config = createConfig({
    chains: supportedChains,
    connectors: [
        injected(), // This works with ANY browser wallet extension
    ],
    transports,
});

// Export chain info for use in components
export const SUPPORTED_CHAINS = {
    base: {
        id: base.id,
        name: 'Base',
        network: 'eip155:8453',
    },
    mainnet: {
        id: mainnet.id,
        name: 'Ethereum',
        network: 'eip155:1',
    },
    baseSepolia: {
        id: baseSepolia.id,
        name: 'Base Sepolia',
        network: 'eip155:84532',
    },
};

// Default chain is Base Mainnet
export const DEFAULT_CHAIN = DEFAULT_CHAIN_ID === 8453 ? base : DEFAULT_CHAIN_ID === 1 ? mainnet : baseSepolia;

// Re-export for backwards compatibility (deprecated - use networks.ts instead)
export const ERC8004_REGISTRIES = {
    identityRegistry: NETWORKS[84532].contracts.identityRegistry,
    reputationRegistry: NETWORKS[84532].contracts.reputationRegistry,
    validationRegistry: '0x8004C269D0A5647E51E121FeB226200ECE932d55',
    chainId: 84532,  // Base Sepolia
    network: 'eip155:84532',
} as const;

