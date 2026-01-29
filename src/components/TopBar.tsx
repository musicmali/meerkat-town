import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useDisconnect } from 'wagmi';
import NetworkSwitcher from './NetworkSwitcher';
import './TopBar.css';

// v1.1: Removed feedback-auth polling - authorization is no longer required

function TopBar() {
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();

    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [copied, setCopied] = useState(false);

    const notificationsRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    const copyAddress = async () => {
        if (address) {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isConnected) {
        return null;
    }

    return (
        <div className="topbar">
            {/* Network Switcher */}
            <NetworkSwitcher />

            {/* Notifications */}
            <div className="topbar-item" ref={notificationsRef}>
                <button
                    className="topbar-btn"
                    onClick={() => {
                        setShowNotifications(!showNotifications);
                        setShowUserMenu(false);
                    }}
                    aria-label="Notifications"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                </button>

                {showNotifications && (
                    <div className="dropdown notifications-dropdown">
                        <div className="dropdown-header">
                            <span>Notifications</span>
                        </div>
                        <div className="dropdown-content">
                            <div className="dropdown-empty">
                                <span>No new notifications</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* User Menu */}
            <div className="topbar-item" ref={userMenuRef}>
                <button
                    className="topbar-btn user-btn"
                    onClick={() => {
                        setShowUserMenu(!showUserMenu);
                        setShowNotifications(false);
                    }}
                    aria-label="User menu"
                >
                    <div className="user-avatar">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                </button>

                {showUserMenu && (
                    <div className="dropdown user-dropdown">
                        <div className="dropdown-header user-header">
                            <span className="user-label">Connected</span>
                        </div>
                        <div className="dropdown-content">
                            <button className="dropdown-item" onClick={copyAddress}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                                <span>{formatAddress(address || '')}</span>
                                {copied && <span className="copied-badge">Copied!</span>}
                            </button>
                            <Link
                                to="/my-agents"
                                className="dropdown-item"
                                onClick={() => setShowUserMenu(false)}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                <span>My Agents</span>
                            </Link>
                            <div className="dropdown-divider" />
                            <button
                                className="dropdown-item dropdown-item-danger"
                                onClick={() => {
                                    disconnect();
                                    setShowUserMenu(false);
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                <span>Disconnect</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TopBar;
