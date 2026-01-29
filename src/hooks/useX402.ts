import { useCallback, useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { getWalletClient } from 'wagmi/actions';
import { baseSepolia } from 'wagmi/chains';
import { config } from '../config/wagmi';
import { isX402Supported as checkX402Supported } from '../config/networks';

// Base Sepolia network identifier (x402 only supported here)
const BASE_SEPOLIA_NETWORK = 'eip155:84532';

// Lazy load x402 to avoid breaking the app if it fails
let x402Module: any = null;
let x402EvmModule: any = null;

async function loadX402Modules() {
    if (!x402Module) {
        try {
            console.log('[x402] Loading modules...');
            x402Module = await import('@x402/fetch');
            x402EvmModule = await import('@x402/evm');
            console.log('[x402] Modules loaded successfully:', Object.keys(x402EvmModule));
        } catch (error) {
            console.error('[x402] Failed to load modules:', error);
            throw error;
        }
    }
    return { x402Module, x402EvmModule };
}

export function useX402() {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();

    // Check if x402 is supported on current chain
    const isX402Supported = useMemo(() => checkX402Supported(chainId), [chainId]);

    // Debug log on every render
    console.log('[x402] Hook state:', {
        address,
        isConnected,
        chainId,
        isX402Supported,
        expectedChainId: baseSepolia.id,
    });

    const x402Fetch = useCallback(async (
        url: string,
        options: RequestInit = {}
    ): Promise<Response> => {
        console.log('[x402] x402Fetch called for:', url);

        // If not connected, use regular fetch
        if (!isConnected || !address) {
            console.log('[x402] Wallet not connected, falling back to regular fetch');
            return fetch(url, options);
        }

        // If x402 not supported on current chain, use regular fetch
        if (!checkX402Supported(chainId)) {
            console.log('[x402] x402 not supported on chain', chainId, ', using regular fetch');
            return fetch(url, options);
        }

        try {
            // Get wallet client for Base Sepolia (the only chain supporting x402)
            console.log('[x402] Getting wallet client for Base Sepolia...');
            const walletClient = await getWalletClient(config, { chainId: baseSepolia.id });
            console.log('[x402] Got wallet client:', !!walletClient, walletClient?.account?.address);

            if (!walletClient || !walletClient.account) {
                console.log('[x402] No wallet client available, falling back to regular fetch');
                return fetch(url, options);
            }

            // Lazy load x402 modules
            console.log('[x402] Loading x402 modules...');
            const { x402Module, x402EvmModule } = await loadX402Modules();

            const { wrapFetchWithPaymentFromConfig } = x402Module;
            const { ExactEvmScheme } = x402EvmModule;

            console.log('[x402] Creating signer for address:', walletClient.account.address);

            // Create signer adapter that matches x402 expected format
            const signer = {
                address: walletClient.account.address,
                signTypedData: async (args: any) => {
                    console.log('[x402] signTypedData called with domain:', args.domain);
                    return walletClient.signTypedData({
                        ...args,
                        account: walletClient.account,
                    });
                }
            };

            console.log('[x402] Signer created with address:', signer.address);

            // Create the wrapped fetch with payment handling
            const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
                schemes: [
                    {
                        network: BASE_SEPOLIA_NETWORK,
                        client: new ExactEvmScheme(signer),
                    },
                    {
                        network: 'eip155:*',
                        client: new ExactEvmScheme(signer),
                    },
                ],
            });

            console.log('[x402] Making payment-enabled request to:', url);
            const response = await fetchWithPayment(url, options);
            console.log('[x402] Response received, status:', response.status);
            return response;
        } catch (error) {
            console.error('[x402] Error in payment flow:', error);
            // Fall back to regular fetch if x402 fails
            console.log('[x402] Falling back to regular fetch due to error');
            return fetch(url, options);
        }
    }, [isConnected, address, chainId]);

    const isReady = useMemo(() => {
        // Only ready if connected and on x402-supported chain
        const ready = isConnected && !!address && isX402Supported;
        console.log('[x402] isReady:', ready, 'isX402Supported:', isX402Supported);
        return ready;
    }, [isConnected, address, isX402Supported]);

    return {
        x402Fetch,
        isReady,
        isX402Supported,
    };
}
