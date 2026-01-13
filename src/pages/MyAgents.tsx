import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, usePublicClient, useConnect, useDisconnect } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { fetchAgentsByOwner, type RegisteredAgent } from '../hooks/useIdentityRegistry';
import AuthorizationRequests from '../components/AuthorizationRequests';
import TopBar from '../components/TopBar';
import './MyAgents.css';
import '../pages/Dashboard.css'; // Reuse sidebar styles

function MyAgents() {
    const { address, isConnected } = useAccount();
    const { connect, connectors, isPending } = useConnect();
    const { disconnect } = useDisconnect();
    const publicClient = usePublicClient({ chainId: baseSepolia.id });

    const [myAgents, setMyAgents] = useState<RegisteredAgent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch agents owned by connected wallet from Identity Registry
    useEffect(() => {
        const loadMyAgents = async () => {
            if (!publicClient || !address) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                console.log('Fetching agents owned by:', address);
                const owned = await fetchAgentsByOwner(address, publicClient, 50);
                console.log('Found owned agents:', owned);
                setMyAgents(owned);
            } catch (error) {
                console.error('Failed to load agents:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadMyAgents();
    }, [publicClient, address]);

    // Check if agent has registrations
    const hasRegistrations = (agent: RegisteredAgent): boolean => {
        return !!(agent.metadata?.registrations && agent.metadata.registrations.length > 0);
    };

    const handleConnect = () => {
        const connector = connectors[0];
        if (connector) {
            connect({ connector });
        }
    };

    const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    return (
        <div className="dashboard">
            {/* Sidebar - same as Dashboard */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <Link to="/">
                        <img src="/logo.png" alt="Meerkat Town" className="sidebar-logo" />
                    </Link>
                </div>

                <nav className="sidebar-nav">
                    <Link to="/dashboard" className="sidebar-link">
                        <span className="sidebar-icon">&#127968;</span>
                        Explore
                    </Link>
                    <Link to="/mint-agent" className="sidebar-link">
                        <span className="sidebar-icon">&#127912;</span>
                        Mint Agent
                    </Link>
                    <Link to="/my-agents" className="sidebar-link active">
                        <span className="sidebar-icon">&#129441;</span>
                        My Agents
                    </Link>
                    <Link to="/leaderboard" className="sidebar-link">
                        <span className="sidebar-icon">&#127942;</span>
                        Leaderboard
                    </Link>
                </nav>

                <div className="sidebar-footer">
                    {isConnected && address ? (
                        <div className="wallet-connected">
                            <div className="wallet-info">
                                <span className="wallet-indicator"></span>
                                <span className="wallet-address">{formatAddress(address)}</span>
                            </div>
                            <button onClick={() => disconnect()} className="btn btn-secondary wallet-btn">
                                Disconnect
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleConnect}
                            disabled={isPending}
                            className="btn btn-primary wallet-btn"
                        >
                            {isPending ? 'Connecting...' : 'Connect Wallet'}
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div>
                        <h1 className="heading-3">My Agents</h1>
                        <p className="text-muted">Your registered Meerkat agents on ERC-8004</p>
                    </div>
                    <TopBar />
                </header>

                {!isConnected ? (
                    <div className="empty-state">
                        <span className="empty-icon">&#128279;</span>
                        <h2>Connect Your Wallet</h2>
                        <p>Please connect your wallet to view your agents.</p>
                    </div>
                ) : isLoading ? (
                    <div className="loading-state">
                        <p>Loading your agents...</p>
                    </div>
                ) : myAgents.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">&#129441;</span>
                        <h2>No Agents Yet</h2>
                        <p>You haven't registered any agents yet.</p>
                        <Link to="/mint-agent" className="btn btn-primary">Register Your First Agent</Link>
                    </div>
                ) : (
                    <>
                        {/* Feedback Authorization Requests */}
                        <section className="auth-requests-section">
                            <AuthorizationRequests />
                        </section>

                        {/* Agents List */}
                        <div className="agents-list">
                            {myAgents.map(agent => {
                                const meerkatId = agent.metadata?.meerkatId || 1;
                                const name = agent.metadata?.name || `Meerkat Agent #${meerkatId}`;
                                const description = agent.metadata?.description || 'A unique Meerkat Agent.';
                                const pricePerMessage = agent.metadata?.pricePerMessage || 'Free';
                                const isFree = pricePerMessage === 'Free' || pricePerMessage === '0';

                                return (
                                    <div key={agent.agentId} className="agent-row">
                                        <img
                                            src={`/meerkats/meerkat_${meerkatId.toString().padStart(3, '0')}.png`}
                                            alt={name}
                                            className="agent-thumb"
                                        />

                                        <div className="agent-info">
                                            <div className="agent-main">
                                                <h3>{name}</h3>
                                                <span className="agent-id">Agent #{agent.agentId} | Meerkat #{meerkatId}</span>
                                            </div>
                                            <p className="agent-desc">{description}</p>
                                            <div className="agent-meta">
                                                <span className="meta-item">
                                                    {isFree ? 'Free to chat' : `$${pricePerMessage}/msg`}
                                                </span>
                                                <span className="meta-item">
                                                    x402: {agent.metadata?.x402support ? 'Enabled' : 'Disabled'}
                                                </span>
                                                <span className="meta-item" style={{ color: hasRegistrations(agent) ? 'var(--success)' : 'var(--text-muted)' }}>
                                                    Registrations: {hasRegistrations(agent) ? 'OK' : 'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="agent-actions">
                                            <Link to={`/chat/${agent.agentId}`} className="btn btn-primary btn-sm">
                                                Chat
                                            </Link>
                                            <a
                                                href={`https://sepolia.basescan.org/token/0x8004AA63c570c570eBF15376c0dB199918BFe9Fb?a=${agent.agentId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-secondary btn-sm"
                                            >
                                                View on Chain
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export default MyAgents;
