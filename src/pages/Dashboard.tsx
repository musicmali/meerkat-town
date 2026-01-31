import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect, useChainId, usePublicClient } from 'wagmi';
import { fetchMeerkatAgents, type RegisteredAgent } from '../hooks/useIdentityRegistry';
import { REPUTATION_REGISTRY_ABI, REPUTATION_REGISTRY_ABI_V12 } from '../contracts/MeerkatReputationRegistry';
import { getFromCache, setToCache, clearCache, batchProcess } from '../utils/rpcUtils';
import {
    isSupportedNetwork,
    getContractAddress,
    getBlockExplorerAddressUrl,
    get8004ScanAgentUrl,
    getNetworkName,
    getFirstMeerkatAgentId,
    getReputationVersion,
} from '../config/networks';
import AgentReputation from '../components/AgentReputation';
import ScoreBadge from '../components/ScoreBadge';
import TopBar from '../components/TopBar';
import MobileNav from '../components/MobileNav';
import MobileFooter from '../components/MobileFooter';
import LoadingSpinner from '../components/LoadingSpinner';
import './Dashboard.css';

type SortOrder = 'newest' | 'score' | 'reviews';

interface AgentWithScore extends RegisteredAgent {
    score: number;
    feedbackCount: number;
}

const AGENTS_CACHE_KEY = 'dashboard_agents_v2'; // v2: invalidate old cache for v1.1 contracts
const SCORES_CACHE_KEY = 'dashboard_scores_v2'; // v2: invalidate old cache for v1.1 contracts
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

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

    // Check if on a supported network
    const isCorrectChain = isSupportedNetwork(chainId);
    const firstMeerkatAgentId = getFirstMeerkatAgentId(chainId);
    const noMeerkatAgentsYet = firstMeerkatAgentId === null;

    // Fetch agents from ERC-8004 Identity Registry for current chain
    const publicClient = usePublicClient({ chainId });
    const [meerkatAgents, setMeerkatAgents] = useState<AgentWithScore[]>([]);
    const [isLoadingAgents, setIsLoadingAgents] = useState(true);
    const [, setIsLoadingScores] = useState(false);

    // View mode toggle for Meerkat Agents (grid or list)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Sort order for agents
    const [sortOrder, setSortOrder] = useState<SortOrder>('score');

    // Refresh state
    const [isRefreshing, setIsRefreshing] = useState(false);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

    // Fetch score for a single agent
    const fetchAgentScore = useCallback(async (agentId: number): Promise<{ score: number; feedbackCount: number }> => {
        if (!publicClient) return { score: 0, feedbackCount: 0 };

        const reputationAddress = getContractAddress(chainId, 'reputationRegistry');
        const reputationVersion = getReputationVersion(chainId);
        const abi = reputationVersion === 'v1.2' ? REPUTATION_REGISTRY_ABI_V12 : REPUTATION_REGISTRY_ABI;

        try {
            // For v1.2, we need to fetch clients first (contract REQUIRES clientAddresses)
            let clientAddresses: `0x${string}`[] = [];
            if (reputationVersion === 'v1.2') {
                const clients = await publicClient.readContract({
                    address: reputationAddress,
                    abi,
                    functionName: 'getClients',
                    args: [BigInt(agentId)],
                }) as `0x${string}`[];
                clientAddresses = clients;

                // If no clients, no feedback yet
                if (clientAddresses.length === 0) {
                    return { score: 0, feedbackCount: 0 };
                }
            }

            const result = await publicClient.readContract({
                address: reputationAddress,
                abi,
                functionName: 'getSummary',
                args: [BigInt(agentId), clientAddresses, '', ''],
            });

            // v1.1: [count, averageScore]
            // v1.2: [count, summaryValue, summaryValueDecimals]
            if (reputationVersion === 'v1.2') {
                const [count, summaryValue] = result as [bigint, bigint, number];
                return {
                    feedbackCount: Number(count),
                    score: Number(summaryValue), // summaryValue is the average score (0-100)
                };
            } else {
                const [count, averageScore] = result as [bigint, number];
                return {
                    feedbackCount: Number(count),
                    score: averageScore,
                };
            }
        } catch (error) {
            console.error(`[Dashboard] Error fetching score for agent ${agentId}:`, error);
            return { score: 0, feedbackCount: 0 };
        }
    }, [publicClient, chainId]);

    // Set page title
    useEffect(() => {
        document.title = 'Explore | Meerkat Town';
    }, []);

    // Load agents (with caching)
    useEffect(() => {
        const loadAgents = async () => {
            if (!publicClient) {
                setIsLoadingAgents(false);
                return;
            }

            // Use chain-specific cache keys
            const agentsCacheKey = `${AGENTS_CACHE_KEY}_${chainId}`;
            const scoresCacheKey = `${SCORES_CACHE_KEY}_${chainId}`;

            // Try to load from cache first
            const cachedAgents = getFromCache<AgentWithScore[]>(agentsCacheKey);
            if (cachedAgents && cachedAgents.length > 0) {
                console.log('[Dashboard] Using cached agents:', cachedAgents.length);
                setMeerkatAgents(cachedAgents);
                setIsLoadingAgents(false);
                return;
            }

            setIsLoadingAgents(true);
            try {
                console.log(`[Dashboard] Fetching agents from blockchain (chain ${chainId})...`);
                const agents = await fetchMeerkatAgents(publicClient, chainId, 50);

                if (agents.length === 0) {
                    console.log('[Dashboard] No agents found');
                    setMeerkatAgents([]);
                    setIsLoadingAgents(false);
                    return;
                }

                // First, show agents without scores (faster initial load)
                const agentsWithDefaultScores: AgentWithScore[] = agents.map(agent => ({
                    ...agent,
                    score: 0,
                    feedbackCount: 0,
                }));
                setMeerkatAgents(agentsWithDefaultScores);
                setIsLoadingAgents(false);

                // Then fetch scores in batches (slower, but won't overload RPC)
                setIsLoadingScores(true);
                console.log('[Dashboard] Fetching scores for', agents.length, 'agents...');

                // Check for cached scores (chain-specific)
                const cachedScores = getFromCache<Record<number, { score: number; feedbackCount: number }>>(scoresCacheKey);

                const agentsWithScores: AgentWithScore[] = await batchProcess(
                    agents,
                    async (agent) => {
                        // Use cached score if available
                        if (cachedScores && cachedScores[agent.agentId]) {
                            return {
                                ...agent,
                                ...cachedScores[agent.agentId],
                            };
                        }
                        const scoreData = await fetchAgentScore(agent.agentId);
                        return {
                            ...agent,
                            ...scoreData,
                        };
                    },
                    2, // batch size of 2
                    300 // 300ms between batches
                );

                // Cache the results (chain-specific)
                const scoresMap: Record<number, { score: number; feedbackCount: number }> = {};
                agentsWithScores.forEach(agent => {
                    scoresMap[agent.agentId] = { score: agent.score, feedbackCount: agent.feedbackCount };
                });
                setToCache(scoresCacheKey, scoresMap, CACHE_TTL);
                setToCache(agentsCacheKey, agentsWithScores, CACHE_TTL);

                console.log('[Dashboard] Scores loaded:', agentsWithScores.length);
                setMeerkatAgents(agentsWithScores);
                setIsLoadingScores(false);
            } catch (e) {
                console.error('[Dashboard] Failed to fetch agents:', e);
                setIsLoadingAgents(false);
                setIsLoadingScores(false);
            }
        };

        loadAgents();
    }, [publicClient, chainId, fetchAgentScore]);

    // Sort agents based on selected order
    const sortedAgents = useMemo(() => {
        const sorted = [...meerkatAgents];
        switch (sortOrder) {
            case 'score':
                return sorted.sort((a, b) => {
                    if (b.score !== a.score) return b.score - a.score;
                    return b.feedbackCount - a.feedbackCount;
                });
            case 'reviews':
                return sorted.sort((a, b) => b.feedbackCount - a.feedbackCount);
            case 'newest':
            default:
                // Newest = highest agentId first (most recently minted)
                return sorted.sort((a, b) => b.agentId - a.agentId);
        }
    }, [meerkatAgents, sortOrder]);

    // Refresh agents from backend
    const handleRefresh = async () => {
        setIsRefreshing(true);

        // Use chain-specific cache keys
        const agentsCacheKey = `${AGENTS_CACHE_KEY}_${chainId}`;
        const scoresCacheKey = `${SCORES_CACHE_KEY}_${chainId}`;

        try {
            // Tell backend to refresh its cache from blockchain
            await fetch(`${BACKEND_URL}/agents/refresh-cache`, { method: 'POST' });

            // Clear local caches
            clearCache(agentsCacheKey);
            clearCache(scoresCacheKey);

            // Reload agents
            setIsLoadingAgents(true);
            const agents = await fetchMeerkatAgents(publicClient, chainId, 50);

            const agentsWithDefaultScores: AgentWithScore[] = agents.map(agent => ({
                ...agent,
                score: 0,
                feedbackCount: 0,
            }));
            setMeerkatAgents(agentsWithDefaultScores);
            setIsLoadingAgents(false);

            // Fetch scores in background
            setIsLoadingScores(true);
            const agentsWithScores = await batchProcess(
                agents,
                async (agent) => {
                    const scoreData = await fetchAgentScore(agent.agentId);
                    return { ...agent, ...scoreData };
                },
                2,
                300
            );
            setMeerkatAgents(agentsWithScores);
            setToCache(agentsCacheKey, agentsWithScores, CACHE_TTL);
        } catch (e) {
            console.error('[Dashboard] Refresh failed:', e);
        } finally {
            setIsRefreshing(false);
            setIsLoadingScores(false);
        }
    };

    const formatAddress = (addr: string) => {
        if (addr.length <= 10) return addr;
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const formatDeployerAddress = (addr: string) => {
        if (addr.length <= 8) return addr;
        return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
    };

    const getBlockExplorerUrl = (addr: string) => {
        return getBlockExplorerAddressUrl(chainId, addr);
    };

    const handleConnect = () => {
        const connector = connectors[0];
        if (connector) {
            connect({ connector });
        }
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
                        <img src="/icons/planet-svgrepo-com.svg" alt="" className="sidebar-icon" />
                        Explore
                    </Link>
                    <Link to="/mint-agent" className="sidebar-link">
                        <img src="/icons/plus-svgrepo-com.svg" alt="" className="sidebar-icon" />
                        Mint Agent
                    </Link>
                    <Link to="/my-agents" className="sidebar-link">
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
                        <h1 className="heading-3">Welcome to Meerkat Town</h1>
                        <p className="text-muted">Choose an AI agent to start chatting</p>
                    </div>
                    <TopBar />
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
                        <span>Please switch to a supported network (Ethereum or Base Sepolia).</span>
                    </div>
                )}

                {/* No Meerkat Agents Yet Notice */}
                {isConnected && isCorrectChain && noMeerkatAgentsYet && !isLoadingAgents && (
                    <div className="notice" style={{ background: 'rgba(249, 115, 22, 0.1)', borderColor: '#F97316' }}>
                        <span className="notice-icon">&#129441;</span>
                        <span>No Meerkat Town agents on {getNetworkName(chainId)} yet. Be the first to mint one!</span>
                        <Link
                            to="/mint-agent"
                            className="btn btn-primary"
                            style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}
                        >
                            Mint Agent
                        </Link>
                    </div>
                )}

                {/* Meerkat Agents Section (from ERC-8004 Identity Registry) */}
                <section className="agents-section">
                    <div className="section-header">
                        <h2 className="section-title">Meerkat Agents</h2>
                        {meerkatAgents.length > 0 && (
                            <div className="section-controls">
                                <div className="sort-dropdown">
                                    <label htmlFor="sort-order">Sort by:</label>
                                    <select
                                        id="sort-order"
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                                        className="sort-select"
                                    >
                                        <option value="newest">Newest</option>
                                        <option value="score">Highest Score</option>
                                        <option value="reviews">Most Reviews</option>
                                    </select>
                                </div>
                                <div className="view-toggle">
                                    <button
                                        className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                        onClick={() => setViewMode('grid')}
                                        aria-label="Grid view"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                            <rect x="1" y="1" width="6" height="6" rx="1" />
                                            <rect x="9" y="1" width="6" height="6" rx="1" />
                                            <rect x="1" y="9" width="6" height="6" rx="1" />
                                            <rect x="9" y="9" width="6" height="6" rx="1" />
                                        </svg>
                                    </button>
                                    <button
                                        className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                                        onClick={() => setViewMode('list')}
                                        aria-label="List view"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                            <rect x="1" y="1" width="14" height="3" rx="1" />
                                            <rect x="1" y="6.5" width="14" height="3" rx="1" />
                                            <rect x="1" y="12" width="14" height="3" rx="1" />
                                        </svg>
                                    </button>
                                </div>
                                <button
                                    className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
                                    onClick={handleRefresh}
                                    disabled={isRefreshing || isLoadingAgents}
                                    aria-label="Refresh agents"
                                    title="Refresh agents from blockchain"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                        <path d="M3 3v5h5" />
                                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                                        <path d="M16 21h5v-5" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                    {isLoadingAgents ? (
                        <div className="empty-section">
                            <LoadingSpinner size="large" text="Loading agents from Identity Registry..." />
                        </div>
                    ) : meerkatAgents.length === 0 ? (
                        <div className="empty-section">
                            <p>&#129441; No Meerkat Agents registered yet!</p>
                            <p className="text-muted">Be the first to register your own agent.</p>
                            <Link to="/mint-agent" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                                Register Agent
                            </Link>
                        </div>
                    ) : viewMode === 'list' ? (
                        <div className="agents-list">
                            {sortedAgents.map((agent) => {
                                const meerkatId = agent.metadata?.meerkatId || 1;
                                const pricePerMessage = agent.metadata?.pricePerMessage || 'Free';
                                const isFree = pricePerMessage === 'Free' || pricePerMessage === '0';
                                const domains: string[] = [];
                                // Support both "services" (new) and "endpoints" (legacy)
                                const servicesList = agent.metadata?.services || agent.metadata?.endpoints || [];
                                servicesList.forEach(svc => {
                                    if (svc.domains) domains.push(...svc.domains);
                                });

                                return (
                                    <div key={agent.agentId} className="agent-row">
                                        <img
                                            src={`/meerkats/meerkat_${meerkatId.toString().padStart(3, '0')}.png`}
                                            alt={agent.metadata?.name || `Meerkat #${meerkatId}`}
                                            className="agent-thumb"
                                        />
                                        <div className="agent-info">
                                            <div className="agent-main">
                                                <h3>{agent.metadata?.name || `Meerkat Agent #${meerkatId}`}</h3>
                                                <span className="agent-id">#{meerkatId}</span>
                                            </div>
                                            <p className="agent-desc">
                                                {agent.metadata?.description || 'A unique Meerkat Agent on the ERC-8004 Identity Registry.'}
                                            </p>
                                            <div className="agent-meta">
                                                <span className="meta-item">
                                                    {isFree ? 'Free to chat' : `$${pricePerMessage}/msg`}
                                                </span>
                                                <span className="meta-item">
                                                    Owner: <a
                                                        href={getBlockExplorerUrl(agent.owner)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="owner-link"
                                                    >
                                                        {formatDeployerAddress(agent.owner)}
                                                    </a>
                                                </span>
                                                {[...new Set(domains)].slice(0, 2).map(slug => {
                                                    const lastPart = slug.split('/').pop() || slug;
                                                    return lastPart.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                                                }).map(tag => (
                                                    <span key={tag} className="meta-item tag-inline">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="agent-actions">
                                            <a
                                                href={get8004ScanAgentUrl(chainId, agent.agentId)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-8004scan btn-sm"
                                            >
                                                View on 8004scan
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                    <polyline points="15 3 21 3 21 9" />
                                                    <line x1="10" y1="14" x2="21" y2="3" />
                                                </svg>
                                            </a>
                                            <Link to={`/chat/${agent.agentId}`} className="btn btn-primary btn-sm">
                                                Chat
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="agents-grid">
                            {sortedAgents.map((agent) => {
                                const meerkatId = agent.metadata?.meerkatId || 1;
                                const pricePerMessage = agent.metadata?.pricePerMessage || 'Free';
                                const isFree = pricePerMessage === 'Free' || pricePerMessage === '0';

                                return (
                                    <div key={agent.agentId} className="agent-card">
                                        {/* Score Badge - Upper Left of Card */}
                                        <div className="agent-score-badge">
                                            <ScoreBadge agentId={agent.agentId} />
                                        </div>
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
                                                        href={getBlockExplorerUrl(agent.owner)}
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
                                                    // Support both "services" (new) and "endpoints" (legacy)
                                                    const servicesList = agent.metadata?.services || agent.metadata?.endpoints || [];
                                                    servicesList.forEach(svc => {
                                                        if (svc.domains) domains.push(...svc.domains);
                                                    });
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
                                                <div className="agent-actions-grid">
                                                    <a
                                                        href={get8004ScanAgentUrl(chainId, agent.agentId)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-8004scan"
                                                    >
                                                        View on 8004scan
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                            <polyline points="15 3 21 3 21 9" />
                                                            <line x1="10" y1="14" x2="21" y2="3" />
                                                        </svg>
                                                    </a>
                                                    <Link
                                                        to={`/chat/${agent.agentId}`}
                                                        className="btn btn-primary"
                                                    >
                                                        Start Chat
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                    }
                </section>

                {/* Legacy Agents Section */}
                <section className="agents-section">
                    <div className="section-header">
                        <div>
                            <h2 className="section-title">Legacy Agents</h2>
                            <p className="text-muted">Agents created to test x402 payments. Try chat with them!</p>
                        </div>
                    </div>
                    <div className="agents-grid">
                        {legacyAgents.map((agent) => (
                            <div key={agent.id} className="agent-card">
                                {/* Large Artwork Section */}
                                <div className="agent-artwork">
                                    <img src={agent.avatar} alt={agent.name} className="agent-avatar-large" />
                                </div>

                                {/* Info Section */}
                                <div className="agent-content">
                                    <div className="agent-header">
                                        <div className="agent-header-left">
                                            <h3 className="agent-name">{agent.name}</h3>
                                            <p className="agent-title">{agent.title}</p>
                                        </div>
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
                <MobileFooter />
            </main>

            <MobileNav />
        </div>
    );
}

export default Dashboard;
