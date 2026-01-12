import { http, createConfig } from 'wagmi';
import * as chains from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Get all available chains from wagmi
const allChains = Object.values(chains).filter(
    (chain) =>
        typeof chain === 'object' &&
        chain !== null &&
        'id' in chain &&
        'name' in chain
) as chains.Chain[];

// Base Sepolia should be first (our main chain for x402)
const baseSepoliaChain = allChains.find(c => c.id === 84532) || chains.baseSepolia;
const otherChains = allChains.filter(c => c.id !== 84532);
const orderedChains = [baseSepoliaChain, ...otherChains] as [chains.Chain, ...chains.Chain[]];

// Alchemy RPC for Base Sepolia (faster & more reliable)
const ALCHEMY_BASE_SEPOLIA_RPC = 'https://base-sepolia.g.alchemy.com/v2/XRfB1Htp32AuoMrXtblwO';

// Create transports for all chains (use Alchemy for Base Sepolia)
const transports = Object.fromEntries(
    orderedChains.map(chain => [
        chain.id,
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
    baseSepolia: {
        id: chains.baseSepolia.id,
        name: 'Base Sepolia',
        network: 'eip155:84532',
    },
};

// Default chain is Base Sepolia
export const DEFAULT_CHAIN = chains.baseSepolia;

// ERC-8004 Registry Addresses on Base Sepolia
export const ERC8004_REGISTRIES = {
    identityRegistry: '0x8004AA63c570c570eBF15376c0dB199918BFe9Fb',
    reputationRegistry: '0x8004bd8daB57f14Ed299135749a5CB5c42d341BF',
    validationRegistry: '0x8004C269D0A5647E51E121FeB226200ECE932d55',
    chainId: 84532,  // Base Sepolia
    network: 'eip155:84532',
} as const;

