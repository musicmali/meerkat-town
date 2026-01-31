import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import './MobileNav.css';

function MobileNav() {
    const location = useLocation();
    const currentPath = location.pathname;

    const isActive = (path: string) => {
        if (path === '/dashboard') {
            return currentPath === '/' || currentPath === '/dashboard';
        }
        return currentPath.startsWith(path);
    };

    return (
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
            <ConnectButton.Custom>
                {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
                    const connected = mounted && account && chain;
                    return (
                        <button
                            type="button"
                            onClick={connected ? openAccountModal : openConnectModal}
                            className={`mobile-nav-item mobile-nav-wallet ${connected ? 'connected' : ''}`}
                        >
                            <img src="/icons/wallet-svgrepo-com.svg" alt="" className="mobile-nav-icon" />
                            <span className="mobile-nav-label">
                                {connected ? `${account.address.slice(0, 4)}...${account.address.slice(-3)}` : 'Wallet'}
                            </span>
                        </button>
                    );
                }}
            </ConnectButton.Custom>
        </nav>
    );
}

export default MobileNav;
