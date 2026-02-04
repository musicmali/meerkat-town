import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { fetchAgentsByOwner, type RegisteredAgent } from '../hooks/useIdentityRegistry';
import {
    get8004ScanAgentUrl,
    getNetworkName,
} from '../config/networks';
import AuthorizationRequests from '../components/AuthorizationRequests';
import TopBar from '../components/TopBar';
import MobileNav from '../components/MobileNav';
import MobileFooter from '../components/MobileFooter';
import LoadingSpinner from '../components/LoadingSpinner';
import './MyAgents.css';
import '../pages/Dashboard.css'; // Reuse sidebar styles

// Display order: Base (8453), Ethereum (1), Base Sepolia (84532)
const DISPLAY_CHAIN_ORDER = [8453, 1, 84532] as const;

// Extended agent type that includes the network chainId
interface NetworkAgent extends RegisteredAgent {
    chainId: number;
}

function MyAgents() {
    const { address, isConnected } = useAccount();
    const { connect, connectors, isPending } = useConnect();
    const { disconnect } = useDisconnect();

    const [agentsByNetwork, setAgentsByNetwork] = useState<Record<number, NetworkAgent[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Set page title
    useEffect(() => {
        document.title = 'My Agents | Meerkat Town';
    }, []);

    // Fetch agents owned by connected wallet from ALL networks
    useEffect(() => {
        const loadMyAgents = async () => {
            if (!address) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                console.log('Fetching agents owned by:', address, 'from all networks');

                // Fetch from all networks in parallel
                const results = await Promise.all(
                    DISPLAY_CHAIN_ORDER.map(async (networkChainId) => {
                        try {
                            const agents = await fetchAgentsByOwner(address, undefined, networkChainId, 50);
                            // Add chainId to each agent
                            const networkAgents: NetworkAgent[] = agents.map(agent => ({
                                ...agent,
                                chainId: networkChainId,
                            }));
                            return { chainId: networkChainId, agents: networkAgents };
                        } catch (error) {
                            console.error(`Failed to load agents from chain ${networkChainId}:`, error);
                            return { chainId: networkChainId, agents: [] };
                        }
                    })
                );

                // Build map by network
                const byNetwork: Record<number, NetworkAgent[]> = {};
                results.forEach(({ chainId, agents }) => {
                    byNetwork[chainId] = agents;
                    console.log(`Found ${agents.length} agents on ${getNetworkName(chainId)}`);
                });

                setAgentsByNetwork(byNetwork);
            } catch (error) {
                console.error('Failed to load agents:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadMyAgents();
    }, [address]);

    // Check if agent has registrations
    const hasRegistrations = (agent: RegisteredAgent): boolean => {
        return !!(agent.metadata?.registrations && agent.metadata.registrations.length > 0);
    };

    const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    const handleConnect = () => {
        const connector = connectors[0];
        if (connector) {
            connect({ connector });
        }
    };

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
                        <img src="/icons/planet-svgrepo-com.svg" alt="" className="sidebar-icon" />
                        Explore
                    </Link>
                    <Link to="/mint-agent" className="sidebar-link">
                        <img src="/icons/plus-svgrepo-com.svg" alt="" className="sidebar-icon" />
                        Mint Agent
                    </Link>
                    <Link to="/my-agents" className="sidebar-link active">
                        <img src="/icons/house-chimney-floor-svgrepo-com.svg" alt="" className="sidebar-icon" />
                        My Agents
                    </Link>
                    <Link to="/leaderboard" className="sidebar-link">
                        <img src="/icons/trophy-svgrepo-com.svg" alt="" className="sidebar-icon" />
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
                        <LoadingSpinner size="large" text="Loading your agents from all networks..." />
                    </div>
                ) : Object.values(agentsByNetwork).flat().length === 0 ? (
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

                        {/* Agents List - Grouped by Network */}
                        {DISPLAY_CHAIN_ORDER.map((networkChainId) => {
                            const networkAgents = agentsByNetwork[networkChainId] || [];
                            if (networkAgents.length === 0) return null;

                            return (
                                <div key={networkChainId} className="network-section">
                                    <h3 className="network-title">{getNetworkName(networkChainId)}</h3>
                                    <div className="agents-list">
                                        {networkAgents.map(agent => {
                                            const meerkatId = agent.metadata?.meerkatId || 1;
                                            const name = agent.metadata?.name || `Meerkat Agent #${meerkatId}`;
                                            const description = agent.metadata?.description || 'A unique Meerkat Agent.';
                                            const pricePerMessage = agent.metadata?.pricePerMessage || 'Free';
                                            const isFree = pricePerMessage === 'Free' || pricePerMessage === '0';

                                            return (
                                                <div key={`${agent.chainId}-${agent.agentId}`} className="agent-row">
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
                                                        <Link to={`/chat/${agent.agentId}?chain=${agent.chainId}`} className="btn btn-primary btn-sm">
                                                            Chat
                                                        </Link>
                                                        <a
                                                            href={get8004ScanAgentUrl(agent.chainId, agent.agentId)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-secondary btn-sm"
                                                        >
                                                            View on 8004scan
                                                        </a>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
                <MobileFooter />
            </main>

            <MobileNav />
        </div>
    );
}

export default MyAgents;
