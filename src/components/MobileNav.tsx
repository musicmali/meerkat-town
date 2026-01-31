import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { NETWORKS, SUPPORTED_CHAIN_IDS, isSupportedNetwork, type SupportedChainId } from '../config/networks';
import './MobileNav.css';

// Network logos mapping
const NETWORK_LOGOS: Record<number, string> = {
    1: '/ethereum-eth-logo.png',
    84532: '/base-logo-in-blue.png',
};

function MobileNav() {
    const location = useLocation();
    const currentPath = location.pathname;
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnectAsync } = useDisconnect();
    const chainId = useChainId();
    const { switchChain, isPending: isSwitching } = useSwitchChain();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const isActive = (path: string) => {
        if (path === '/dashboard') {
            return currentPath === '/' || currentPath === '/dashboard';
        }
        return currentPath.startsWith(path);
    };

    const formatAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-3)}`;

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    const handleWalletClick = async () => {
        console.log('[MobileNav] Wallet clicked, isConnected:', isConnected, 'connectors:', connectors.length);
        if (isConnected) {
            // Show menu instead of disconnecting directly
            setIsMenuOpen(true);
        } else {
            // Connect wallet
            const connector = connectors.find(c => c.ready) || connectors[0];
            console.log('[MobileNav] Using connector:', connector?.name, 'ready:', connector?.ready);
            if (connector) {
                connect({ connector });
            }
        }
    };

    const handleNetworkSwitch = async (targetChainId: SupportedChainId) => {
        if (targetChainId === chainId) {
            setIsMenuOpen(false);
            return;
        }
        try {
            await switchChain({ chainId: targetChainId });
            setIsMenuOpen(false);
        } catch (error) {
            console.error('Failed to switch network:', error);
        }
    };

    const handleDisconnect = async () => {
        await disconnectAsync();
        setIsMenuOpen(false);
    };

    const currentNetwork = NETWORKS[chainId];
    const isSupported = isSupportedNetwork(chainId);

    return (
        <>
            <nav className="mobile-nav">
                <Link to="/dashboard" className={`mobile-nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
                    <img src="/icons/planet-svgrepo-com.svg" alt="" className="mobile-nav-icon" />
                    <span className="mobile-nav-label">Explore</span>
                </Link>
                <Link to="/mint-agent" className={`mobile-nav-item ${isActive('/mint-agent') ? 'active' : ''}`}>
                    <img src="/icons/plus-svgrepo-com.svg" alt="" className="mobile-nav-icon" />
                    <span className="mobile-nav-label">Mint</span>
                </Link>
                <Link to="/my-agents" className={`mobile-nav-item ${isActive('/my-agents') ? 'active' : ''}`}>
                    <img src="/icons/house-chimney-floor-svgrepo-com.svg" alt="" className="mobile-nav-icon" />
                    <span className="mobile-nav-label">My Agents</span>
                </Link>
                <Link to="/leaderboard" className={`mobile-nav-item ${isActive('/leaderboard') ? 'active' : ''}`}>
                    <img src="/icons/trophy-svgrepo-com.svg" alt="" className="mobile-nav-icon" />
                    <span className="mobile-nav-label">Leaderboard</span>
                </Link>
                <button
                    type="button"
                    onClick={handleWalletClick}
                    className={`mobile-nav-item mobile-nav-wallet ${isConnected ? 'connected' : ''}`}
                >
                    <img src="/icons/wallet-svgrepo-com.svg" alt="" className="mobile-nav-icon" />
                    <span className="mobile-nav-label">
                        {isConnected ? formatAddress(address!) : 'Wallet'}
                    </span>
                </button>
            </nav>

            {/* Wallet Menu Overlay */}
            {isMenuOpen && (
                <div className="mobile-wallet-overlay" onClick={() => setIsMenuOpen(false)}>
                    <div
                        className="mobile-wallet-menu"
                        ref={menuRef}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="mobile-wallet-header">
                            <span className="mobile-wallet-address">{formatAddress(address!)}</span>
                            <span className={`mobile-wallet-network ${!isSupported ? 'unsupported' : ''}`}>
                                {isSupported && currentNetwork ? currentNetwork.shortName : 'Unsupported'}
                            </span>
                        </div>

                        {/* Network Options */}
                        <div className="mobile-wallet-section">
                            <span className="mobile-wallet-section-title">Switch Network</span>
                            <div className="mobile-wallet-networks">
                                {SUPPORTED_CHAIN_IDS.map((networkChainId) => {
                                    const network = NETWORKS[networkChainId];
                                    const isCurrent = networkChainId === chainId;
                                    const logo = NETWORK_LOGOS[networkChainId];
                                    return (
                                        <button
                                            key={networkChainId}
                                            className={`mobile-network-option ${isCurrent ? 'active' : ''}`}
                                            onClick={() => handleNetworkSwitch(networkChainId)}
                                            disabled={isCurrent || isSwitching}
                                        >
                                            {logo && <img src={logo} alt="" className="mobile-network-logo" />}
                                            <span className="mobile-network-name">{network.name}</span>
                                            {isCurrent && (
                                                <svg className="mobile-network-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Disconnect Button */}
                        <button className="mobile-wallet-disconnect" onClick={handleDisconnect}>
                            Disconnect Wallet
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default MobileNav;
