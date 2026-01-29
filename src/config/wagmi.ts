import { http, createConfig } from 'wagmi';
import * as chains from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { SUPPORTED_CHAIN_IDS, DEFAULT_CHAIN_ID } from './networks';

// Get all available chains from wagmi
const allChains = Object.values(chains).filter(
    (chain) =>
        typeof chain === 'object' &&
        chain !== null &&
        'id' in chain &&
        'name' in chain
) as chains.Chain[];

// Order chains: Meerkat Town supported chains first, then others
const ethereumMainnet = allChains.find(c => c.id === 1) || chains.mainnet;
const baseSepoliaChain = allChains.find(c => c.id === 84532) || chains.baseSepolia;
const otherChains = allChains.filter(c => !SUPPORTED_CHAIN_IDS.includes(c.id as 1 | 84532));

// Default chain should be first (Ethereum Mainnet is the new default)
const orderedChains = DEFAULT_CHAIN_ID === 1
    ? [ethereumMainnet, baseSepoliaChain, ...otherChains] as [chains.Chain, ...chains.Chain[]]
    : [baseSepoliaChain, ethereumMainnet, ...otherChains] as [chains.Chain, ...chains.Chain[]];

// RPC endpoints for supported networks (Alchemy)
const ALCHEMY_ETH_MAINNET_RPC = 'https://eth-mainnet.g.alchemy.com/v2/XRfB1Htp32AuoMrXtblwO';
const ALCHEMY_BASE_SEPOLIA_RPC = 'https://base-sepolia.g.alchemy.com/v2/XRfB1Htp32AuoMrXtblwO';

// Create transports for all chains
const transports = Object.fromEntries(
    orderedChains.map(chain => [
        chain.id,
        chain.id === 1 ? http(ALCHEMY_ETH_MAINNET_RPC) :
        chain.id === 84532 ? http(ALCHEMY_BASE_SEPOLIA_RPC) : http()
    ])
) as Record<number, ReturnType<typeof http>>;

// Configure wagmi with ALL available chains
export const config = createConfig({
    chains: orderedChains,
    connectors: [
        injected(), // This works with ANY browser wallet extension
    ],
    transports,
});

// Export chain info for use in components
export const SUPPORTED_CHAINS = {
    mainnet: {
        id: chains.mainnet.id,
        name: 'Ethereum',
        network: 'eip155:1',
    },
    baseSepolia: {
        id: chains.baseSepolia.id,
        name: 'Base Sepolia',
        network: 'eip155:84532',
    },
};

// Default chain is now Ethereum Mainnet
export const DEFAULT_CHAIN = DEFAULT_CHAIN_ID === 1 ? chains.mainnet : chains.baseSepolia;

// Re-export network utilities from networks.ts
export { SUPPORTED_CHAIN_IDS, DEFAULT_CHAIN_ID } from './networks';

