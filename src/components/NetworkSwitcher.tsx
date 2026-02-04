// NetworkSwitcher Component
// Dropdown in header showing current network with switch capability

import { useState, useRef, useEffect } from 'react';
import { useChainId, useSwitchChain, useAccount } from 'wagmi';
import { NETWORKS, SUPPORTED_CHAIN_IDS, isSupportedNetwork, type SupportedChainId } from '../config/networks';
import './NetworkSwitcher.css';

// Network logos mapping
const NETWORK_LOGOS: Record<number, string> = {
  8453: '/base-logo-in-blue.png',  // Base mainnet
  1: '/ethereum-eth-logo.png',      // Ethereum mainnet
  84532: '/base-logo-in-blue.png',  // Base Sepolia (same logo as Base)
};

// Network icon component using image logos
const NetworkIcon = ({ chainId }: { chainId: number }) => {
  const logo = NETWORK_LOGOS[chainId];
  if (logo) {
    return <img src={logo} alt="" className="network-icon" />;
  }
  // Fallback for unknown networks
  return (
    <svg className="network-icon" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
};

export function NetworkSwitcher() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get current network config
  const currentNetwork = NETWORKS[chainId];
  const isSupported = isSupportedNetwork(chainId);

  const handleNetworkSwitch = async (targetChainId: SupportedChainId) => {
    if (targetChainId === chainId) {
      setIsOpen(false);
      return;
    }
    try {
      await switchChain({ chainId: targetChainId });
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  // Don't show if not connected
  if (!isConnected) {
    return null;
  }

  return (
    <div className="network-switcher" ref={dropdownRef}>
      <button
        className={`network-switcher-btn ${!isSupported ? 'unsupported' : ''} ${isPending ? 'switching' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        aria-label="Switch network"
      >
        {isPending ? (
          <span className="network-switching">Switching...</span>
        ) : isSupported && currentNetwork ? (
          <>
            <NetworkIcon chainId={chainId} />
            <span className="network-name">{currentNetwork.shortName}</span>
            <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </>
        ) : (
          <>
            <span className="network-warning">!</span>
            <span className="network-name">Unsupported</span>
            <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </>
        )}
      </button>

      {isOpen && (
        <div className="network-dropdown">
          <div className="network-dropdown-header">
            <span>Select Network</span>
          </div>
          <div className="network-dropdown-content">
            {SUPPORTED_CHAIN_IDS.map((networkChainId) => {
              const network = NETWORKS[networkChainId];
              const isCurrent = networkChainId === chainId;
              return (
                <button
                  key={networkChainId}
                  className={`network-option ${isCurrent ? 'active' : ''}`}
                  onClick={() => handleNetworkSwitch(networkChainId)}
                  disabled={isCurrent || isPending}
                >
                  <NetworkIcon chainId={networkChainId} />
                  <div className="network-option-info">
                    <span className="network-option-name">{network.name}</span>
                  </div>
                  {isCurrent && (
                    <svg className="network-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
          {!isSupported && (
            <div className="network-dropdown-footer">
              <span className="network-warning-text">
                Please switch to a supported network
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NetworkSwitcher;
