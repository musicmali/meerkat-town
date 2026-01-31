import { http } from 'wagmi';
import { mainnet, baseSepolia } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { NETWORKS, SUPPORTED_CHAIN_IDS, DEFAULT_CHAIN_ID } from './networks';

// Create transports with configured RPCs for supported networks
const transports: Record<number, ReturnType<typeof http>> = {};
for (const chainId of SUPPORTED_CHAIN_IDS) {
    transports[chainId] = http(NETWORKS[chainId].rpcUrl);
}

// Configure wagmi with RainbowKit (provides wallet selection modal)
export const config = getDefaultConfig({
    appName: 'Meerkat Town',
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'meerkat-town-dev',
    chains: [mainnet, baseSepolia],
    transports,
});

// Export chain info for use in components
export const SUPPORTED_CHAINS = {
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

// Default chain is Ethereum Mainnet
export const DEFAULT_CHAIN = DEFAULT_CHAIN_ID === 1 ? mainnet : baseSepolia;

// Re-export for backwards compatibility (deprecated - use networks.ts instead)
export const ERC8004_REGISTRIES = {
    identityRegistry: NETWORKS[84532].contracts.identityRegistry,
    reputationRegistry: NETWORKS[84532].contracts.reputationRegistry,
    validationRegistry: '0x8004C269D0A5647E51E121FeB226200ECE932d55',
    chainId: 84532,  // Base Sepolia
    network: 'eip155:84532',
} as const;

