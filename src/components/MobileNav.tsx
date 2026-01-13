import { Link, useLocation } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import './MobileNav.css';

function MobileNav() {
    const location = useLocation();
    const currentPath = location.pathname;
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnectAsync } = useDisconnect();

    const isActive = (path: string) => {
        if (path === '/dashboard') {
            return currentPath === '/' || currentPath === '/dashboard';
        }
        return currentPath.startsWith(path);
    };

    const formatAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-3)}`;

    const handleWalletClick = async () => {
        console.log('[MobileNav] Wallet clicked, isConnected:', isConnected, 'connectors:', connectors.length);
        if (isConnected) {
            await disconnectAsync();
        } else {
            // Find an available connector (prefer injected/metamask)
            const connector = connectors.find(c => c.ready) || connectors[0];
            console.log('[MobileNav] Using connector:', connector?.name, 'ready:', connector?.ready);
            if (connector) {
                connect({ connector });
            }
        }
    };

    return (
        <nav className="mobile-nav">
            <Link to="/dashboard" className={`mobile-nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
                <span className="mobile-nav-icon">&#127968;</span>
                <span className="mobile-nav-label">Explore</span>
            </Link>
            <Link to="/mint-agent" className={`mobile-nav-item ${isActive('/mint-agent') ? 'active' : ''}`}>
                <span className="mobile-nav-icon">&#127912;</span>
                <span className="mobile-nav-label">Mint</span>
            </Link>
            <Link to="/my-agents" className={`mobile-nav-item ${isActive('/my-agents') ? 'active' : ''}`}>
                <span className="mobile-nav-icon">&#129441;</span>
                <span className="mobile-nav-label">My Agents</span>
            </Link>
            <Link to="/leaderboard" className={`mobile-nav-item ${isActive('/leaderboard') ? 'active' : ''}`}>
                <span className="mobile-nav-icon">&#127942;</span>
                <span className="mobile-nav-label">Leaderboard</span>
            </Link>
            <button
                type="button"
                onClick={handleWalletClick}
                className={`mobile-nav-item mobile-nav-wallet ${isConnected ? 'connected' : ''}`}
            >
                <span className="mobile-nav-icon">{isConnected ? '🟢' : '🔗'}</span>
                <span className="mobile-nav-label">
                    {isConnected ? formatAddress(address!) : 'Wallet'}
                </span>
            </button>
        </nav>
    );
}

export default MobileNav;
