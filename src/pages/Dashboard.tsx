import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, usePublicClient } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { fetchMeerkatAgents, type RegisteredAgent } from '../hooks/useIdentityRegistry';
import AgentReputation from '../components/AgentReputation';
import './Dashboard.css';

interface Agent {
    id: string;
    name: string;
    title: string;
    description: string;
    avatar: string;
    specialty: string[];
    price: string;
    reputation?: number;
    deployedBy?: string;
}

// Legacy agents (Bob & Ana)
const legacyAgents: Agent[] = [
    {
        id: 'bob',
        name: 'Bob',
        title: 'Crypto Analyst',
        description: 'Expert in cryptocurrency market analysis, DeFi protocols, and technical analysis. Get data-driven insights on any token or project.',
        avatar: '/Bob.png',
        specialty: ['Market Analysis', 'DeFi', 'Technical Analysis'],
        price: '$0.001',
        reputation: 92,
        deployedBy: '0xf89009ce04A703B3',
    },
    {
        id: 'ana',
        name: 'Ana',
        title: 'Writing Assistant',
        description: 'Creative content specialist for blog posts, marketing copy, social media, and storytelling. Make your ideas shine!',
        avatar: '/Ana.png',
        specialty: ['Copywriting', 'Blog Posts', 'Social Media'],
        price: '$0.001',
        reputation: 95,
        deployedBy: '0xf89009ce04A703B3',
    },
];

function Dashboard() {
    const { address, isConnected } = useAccount();
    const { connect, connectors, isPending } = useConnect();
    const { disconnect } = useDisconnect();
    const chainId = useChainId();
    const { switchChain, isPending: isSwitching } = useSwitchChain();

    const isCorrectChain = chainId === baseSepolia.id;

    // Fetch agents from ERC-8004 Identity Registry
    const publicClient = usePublicClient({ chainId: baseSepolia.id });
    const [meerkatAgents, setMeerkatAgents] = useState<RegisteredAgent[]>([]);
    const [isLoadingAgents, setIsLoadingAgents] = useState(true);

    useEffect(() => {
        const loadAgents = async () => {
            if (!publicClient) {
                setIsLoadingAgents(false);
                return;
            }

            setIsLoadingAgents(true);
            try {
                console.log('Fetching Meerkat agents from Identity Registry...');
                const agents = await fetchMeerkatAgents(publicClient, 50); // Scan first 50 agent IDs
                console.log('Found Meerkat agents:', agents);
                setMeerkatAgents(agents);
            } catch (e) {
                console.error('Failed to fetch agents:', e);
            }
            setIsLoadingAgents(false);
        };
        loadAgents();
    }, [publicClient]);

    const formatAddress = (addr: string) => {
        if (addr.length <= 10) return addr;
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const formatDeployerAddress = (addr: string) => {
        if (addr.length <= 8) return addr;
        return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
    };

    const getBaseScanUrl = (addr: string) => {
        return `https://sepolia.basescan.org/address/${addr}`;
    };

    const handleConnect = () => {
        const connector = connectors[0];
        if (connector) {
            connect({ connector });
        }
    };

    const handleSwitchToBase = () => {
        switchChain({ chainId: baseSepolia.id });
    };

    return (
        <div className="dashboard">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <Link to="/">
                        <img src="/logo.png" alt="Meerkat Town" className="sidebar-logo" />
                    </Link>
                </div>

                <nav className="sidebar-nav">
                    <Link to="/dashboard" className="sidebar-link active">
                        <span className="sidebar-icon">&#127968;</span>
                        Explore
                    </Link>
                    <Link to="/mint-agent" className="sidebar-link">
                        <span className="sidebar-icon">&#127912;</span>
                        Mint Agent
                    </Link>
                    <Link to="/my-agents" className="sidebar-link">
                        <span className="sidebar-icon">&#129441;</span>
                        My Agents
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
                        <h1 className="heading-3">Welcome to Meerkat Town</h1>
                        <p className="text-muted">Choose an AI agent to start chatting</p>
                    </div>
                </header>

                {/* Connection Required Notice */}
                {!isConnected && (
                    <div className="notice">
                        <span className="notice-icon">&#9888;</span>
                        <span>Connect your wallet to start chatting with agents.</span>
                    </div>
                )}

                {/* Wrong Network Notice */}
                {isConnected && !isCorrectChain && (
                    <div className="notice" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: '#EF4444' }}>
                        <span className="notice-icon">&#9888;</span>
                        <span>Please switch to Base Sepolia network to use Meerkat Town.</span>
                        <button
                            onClick={handleSwitchToBase}
                            disabled={isSwitching}
                            className="btn btn-primary"
                            style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}
                        >
                            {isSwitching ? 'Switching...' : 'Switch to Base Sepolia'}
                        </button>
                    </div>
                )}

                {/* Legacy Agents Section */}
                <section className="agents-section">
                    <h2 className="section-title">Legacy Agents</h2>
                    <div className="agents-grid">
                        {legacyAgents.map((agent) => (
                            <div key={agent.id} className="agent-card">
                                {/* Large Artwork Section */}
                                <div className="agent-artwork">
                                    <img src={agent.avatar} alt={agent.name} className="agent-avatar-large" />
                                    {agent.reputation && (
                                        <div className="agent-reputation-badge">
                                            <span className="reputation-value">{agent.reputation}</span>
                                            <span className="reputation-text">Score</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info Section */}
                                <div className="agent-content">
                                    <div className="agent-header">
                                        <div className="agent-header-left">
                                            <h3 className="agent-name">{agent.name}</h3>
                                            <p className="agent-title">{agent.title}</p>
                                        </div>
                                        {agent.deployedBy && (
                                            <div className="deployer-badge">
                                                <span className="deployer-label">By:</span>
                                                <a
                                                    href={getBaseScanUrl(agent.deployedBy)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="deployer-address"
                                                >
                                                    {formatDeployerAddress(agent.deployedBy)}
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    <p className="agent-description">{agent.description}</p>

                                    <div className="agent-tags">
                                        {agent.specialty.map((tag) => (
                                            <span key={tag} className="tag">{tag}</span>
                                        ))}
                                    </div>

                                    <div className="agent-footer">
                                        <div className="agent-price">
                                            <span className="price-amount">{agent.price}</span>
                                            <span className="price-label">per message</span>
                                        </div>
                                        <Link
                                            to={`/chat/${agent.id}`}
                                            className={`btn btn-primary ${!isConnected ? 'btn-disabled' : ''}`}
                                            style={{ padding: 'var(--space-3) var(--space-6)', minWidth: 'auto', height: 'fit-content' }}
                                            onClick={(e) => !isConnected && e.preventDefault()}
                                        >
                                            Start Chat
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Meerkat Agents Section (from ERC-8004 Identity Registry) */}
                <section className="agents-section">
                    <h2 className="section-title">Meerkat Agents</h2>
                    {isLoadingAgents ? (
                        <div className="empty-section">
                            <p>Loading agents from Identity Registry...</p>
                        </div>
                    ) : meerkatAgents.length === 0 ? (
                        <div className="empty-section">
                            <p>&#129441; No Meerkat Agents registered yet!</p>
                            <p className="text-muted">Be the first to register your own agent.</p>
                            <Link to="/mint-agent" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                                Register Agent
                            </Link>
                        </div>
                    ) : (
                        <div className="agents-grid">
                            {meerkatAgents.map((agent) => {
                                const meerkatId = agent.metadata?.meerkatId || 1;
                                const pricePerMessage = agent.metadata?.pricePerMessage || 'Free';
                                const isFree = pricePerMessage === 'Free' || pricePerMessage === '0';

                                return (
                                    <div key={agent.agentId} className="agent-card">
                                        <div className="agent-artwork">
                                            <img
                                                src={`/meerkats/meerkat_${meerkatId.toString().padStart(3, '0')}.png`}
                                                alt={agent.metadata?.name || `Meerkat #${meerkatId}`}
                                                className="agent-avatar-large"
                                            />
                                            <div className="agent-reputation-badge">
                                                <span className="reputation-value">#{meerkatId}</span>
                                            </div>
                                        </div>
                                        <div className="agent-content">
                                            <div className="agent-header">
                                                <div className="agent-header-left">
                                                    <h3 className="agent-name">{agent.metadata?.name || `Meerkat Agent #${meerkatId}`}</h3>
                                                    {/* ERC-8004 Reputation */}
                                                    <AgentReputation agentId={agent.agentId} variant="compact" />
                                                </div>
                                                <div className="deployer-badge">
                                                    <span className="deployer-label">Owner:</span>
                                                    <a
                                                        href={getBaseScanUrl(agent.owner)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="deployer-address"
                                                    >
                                                        {formatDeployerAddress(agent.owner)}
                                                    </a>
                                                </div>
                                            </div>
                                            <p className="agent-description">
                                                {agent.metadata?.description || 'A unique Meerkat Agent on the ERC-8004 Identity Registry.'}
                                            </p>

                                            {/* Agent Traits - Domains Only */}
                                            <div className="agent-tags" style={{ marginBottom: 'auto', paddingBottom: 'var(--space-4)' }}>
                                                {(() => {
                                                    const domains: string[] = [];
                                                    if (agent.metadata?.endpoints) {
                                                        agent.metadata.endpoints.forEach(ep => {
                                                            if (ep.domains) domains.push(...ep.domains);
                                                        });
                                                    }
                                                    // Take top 3 unique domains and format them
                                                    return [...new Set(domains)]
                                                        .slice(0, 3)
                                                        .map(slug => {
                                                            // Get only the last part of the path
                                                            const lastPart = slug.split('/').pop() || slug;
                                                            // Format: replace underscores and capitalize
                                                            return lastPart.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                                                        })
                                                        .map(tag => (
                                                            <span key={tag} className="tag">{tag}</span>
                                                        ));
                                                })()}
                                            </div>

                                            <div className="agent-footer">
                                                <div className="agent-price">
                                                    {isFree ? (
                                                        <>
                                                            <span className="price-amount" style={{ color: 'var(--primary)' }}>Free</span>
                                                            <span className="price-label">to chat</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="price-amount">${pricePerMessage}</span>
                                                            <span className="price-label">per message</span>
                                                        </>
                                                    )}
                                                </div>
                                                <Link
                                                    to={`/chat/${agent.agentId}`}
                                                    className="btn btn-primary"
                                                    style={{ padding: 'var(--space-3) var(--space-6)', minWidth: 'auto', height: 'fit-content' }}
                                                >
                                                    Start Chat
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default Dashboard;
