import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useDisconnect } from 'wagmi';
import './TopBar.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

interface AuthRequest {
    id: string;
    agentId: number;
    clientAddress: string;
    ownerAddress: string;
    createdAt: number;
    status: 'pending' | 'approved' | 'rejected';
    agentName?: string;
}

interface AuthResponse {
    id: string;
    agentId: number;
    clientAddress: string;
    ownerAddress: string;
    createdAt: number;
    status: 'approved' | 'rejected';
    readAt?: number;
}

function TopBar() {
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();

    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<AuthRequest[]>([]);
    const [authResponses, setAuthResponses] = useState<AuthResponse[]>([]);
    const [copied, setCopied] = useState(false);

    const notificationsRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Fetch notifications for the connected wallet
    useEffect(() => {
        const fetchNotifications = async () => {
            if (!address) {
                setPendingRequests([]);
                setAuthResponses([]);
                return;
            }

            try {
                // Fetch pending requests (for agent owners)
                const requestsResponse = await fetch(`${BACKEND_URL}/feedback-auth/requests/${address}`);
                if (requestsResponse.ok) {
                    const data = await requestsResponse.json();
                    const pending = (data.requests || []).filter(
                        (req: AuthRequest) => req.status === 'pending'
                    );
                    setPendingRequests(pending);
                }

                // Fetch responses to my requests (for clients who requested auth)
                const responsesResponse = await fetch(`${BACKEND_URL}/feedback-auth/responses/${address}`);
                if (responsesResponse.ok) {
                    const data = await responsesResponse.json();
                    // Only show unread responses
                    const unread = (data.responses || []).filter(
                        (res: AuthResponse) => !res.readAt
                    );
                    setAuthResponses(unread);
                }
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        };

        fetchNotifications();
        // Poll every 30 seconds for new notifications
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [address]);

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

    const formatTimeAgo = (timestamp: number | undefined) => {
        if (!timestamp || isNaN(timestamp)) return 'Just now';
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 0) return 'Just now';
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const markAsRead = async (requestId: string) => {
        try {
            await fetch(`${BACKEND_URL}/feedback-auth/mark-read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, readerAddress: address }),
            });
            // Remove from local state
            setAuthResponses(prev => prev.filter(r => r.id !== requestId));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await Promise.all(authResponses.map(r =>
                fetch(`${BACKEND_URL}/feedback-auth/mark-read`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requestId: r.id, readerAddress: address }),
                })
            ));
            setAuthResponses([]);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const totalNotifications = pendingRequests.length + authResponses.length;

    if (!isConnected) {
        return null;
    }

    return (
        <div className="topbar">
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
                    {totalNotifications > 0 && (
                        <span className="notification-badge">{totalNotifications}</span>
                    )}
                </button>

                {showNotifications && (
                    <div className="dropdown notifications-dropdown">
                        <div className="dropdown-header">
                            <span>Notifications</span>
                            {totalNotifications > 0 && (
                                <button className="mark-all-read" onClick={markAllAsRead}>
                                    Mark all read
                                </button>
                            )}
                        </div>
                        <div className="dropdown-content">
                            {totalNotifications === 0 ? (
                                <div className="dropdown-empty">
                                    <span>No new notifications</span>
                                </div>
                            ) : (
                                <>
                                    {/* Auth responses (for clients) - show approved/rejected */}
                                    {authResponses.map((res) => (
                                        <div key={res.id} className={`notification-item ${res.status === 'approved' ? 'notification-success' : 'notification-error'}`}>
                                            <div className={`notification-icon ${res.status === 'approved' ? 'icon-success' : 'icon-error'}`}>
                                                {res.status === 'approved' ? (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M20 6L9 17l-5-5" />
                                                    </svg>
                                                ) : (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M18 6L6 18M6 6l12 12" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="notification-content">
                                                <p className="notification-text">
                                                    Your feedback request for Agent #{res.agentId} was{' '}
                                                    <strong className={res.status === 'approved' ? 'text-success' : 'text-error'}>
                                                        {res.status}
                                                    </strong>
                                                </p>
                                                <span className="notification-time">{formatTimeAgo(res.createdAt)}</span>
                                            </div>
                                            <button
                                                className="notification-dismiss"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(res.id);
                                                }}
                                                aria-label="Dismiss"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M18 6L6 18M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}

                                    {/* Pending requests (for owners) */}
                                    {pendingRequests.map((req) => (
                                        <div key={req.id} className="notification-item">
                                            <div className="notification-icon">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                    <circle cx="9" cy="7" r="4" />
                                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                </svg>
                                            </div>
                                            <div className="notification-content">
                                                <p className="notification-text">
                                                    <strong>{formatAddress(req.clientAddress)}</strong> wants to give feedback on Agent #{req.agentId}
                                                </p>
                                                <span className="notification-time">{formatTimeAgo(req.createdAt)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                        {pendingRequests.length > 0 && (
                            <div className="dropdown-footer">
                                <Link
                                    to="/my-agents"
                                    className="dropdown-link"
                                    onClick={() => setShowNotifications(false)}
                                >
                                    View all requests
                                </Link>
                            </div>
                        )}
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
