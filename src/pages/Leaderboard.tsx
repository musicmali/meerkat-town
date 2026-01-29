import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect, usePublicClient, useChainId } from 'wagmi';
import { fetchMeerkatAgents, type RegisteredAgent } from '../hooks/useIdentityRegistry';
import { getReputationABI, getReputationRegistryAddress, parseReputationSummary } from '../hooks/useERC8004Registries';
import { getFromCache, setToCache, batchProcess } from '../utils/rpcUtils';
import { isSupportedNetwork, DEFAULT_CHAIN_ID, getBlockExplorerAddressUrl, get8004ScanAgentUrl, getNetworkName } from '../config/networks';
import TopBar from '../components/TopBar';
import MobileNav from '../components/MobileNav';
import MobileFooter from '../components/MobileFooter';
import LoadingSpinner from '../components/LoadingSpinner';
import './Dashboard.css'; // Reuse sidebar styles - import first
import './Leaderboard.css'; // Page-specific styles - import last to override

interface AgentWithScore extends RegisteredAgent {
    score: number;
    feedbackCount: number;
}

// Cache key is now chain-specific (v3: multi-network support)
const getLeaderboardCacheKey = (chainId: number) => `leaderboard_agents_v3_${chainId}`;
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

function Leaderboard() {
    const { address, isConnected } = useAccount();
    const { connect, connectors, isPending } = useConnect();
    const { disconnect } = useDisconnect();
    const chainId = useChainId();
    const effectiveChainId = isSupportedNetwork(chainId) ? chainId : DEFAULT_CHAIN_ID;
    const networkName = getNetworkName(effectiveChainId);
    const publicClient = usePublicClient({ chainId: effectiveChainId });

    const [rankedAgents, setRankedAgents] = useState<AgentWithScore[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Set page title
    useEffect(() => {
        document.title = 'Leaderboard | Meerkat Town';
    }, []);

    useEffect(() => {
        const loadLeaderboard = async () => {
            if (!publicClient) {
                setIsLoading(false);
                return;
            }

            const cacheKey = getLeaderboardCacheKey(effectiveChainId);

            // Try to load from cache first
            const cached = getFromCache<AgentWithScore[]>(cacheKey);
            if (cached && cached.length > 0) {
                console.log(`[Leaderboard] Using cached data for ${networkName}:`, cached.length, 'agents');
                setRankedAgents(cached);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // Fetch all meerkat agents
                console.log(`[Leaderboard] Fetching agents from ${networkName}...`);
                const agents = await fetchMeerkatAgents(publicClient, 50, effectiveChainId);

                if (agents.length === 0) {
                    setRankedAgents([]);
                    setIsLoading(false);
                    return;
                }

                // Get network-specific reputation config
                const reputationAddress = getReputationRegistryAddress(effectiveChainId);
                const reputationABI = getReputationABI(effectiveChainId);

                // Fetch scores in batches to avoid rate limiting
                console.log('[Leaderboard] Fetching scores for', agents.length, 'agents...');
                const agentsWithScores = await batchProcess(
                    agents,
                    async (agent) => {
                        try {
                            const result = await publicClient.readContract({
                                address: reputationAddress,
                                abi: reputationABI,
                                functionName: 'getSummary',
                                args: [BigInt(agent.agentId), [], '', ''],
                            }) as readonly unknown[];

                            // Parse based on network version (v1.1 vs v1.2)
                            const { count, score } = parseReputationSummary(result, effectiveChainId);

                            return {
                                ...agent,
                                feedbackCount: count,
                                score,
                            };
                        } catch {
                            return {
                                ...agent,
                                feedbackCount: 0,
                                score: 0,
                            };
                        }
                    },
                    2, // batch size of 2
                    300 // 300ms between batches
                );

                // Sort by score (descending), then by feedback count
                const sorted = agentsWithScores.sort((a, b) => {
                    if (b.score !== a.score) return b.score - a.score;
                    return b.feedbackCount - a.feedbackCount;
                });

                // Cache the sorted results
                setToCache(cacheKey, sorted, CACHE_TTL);
                console.log(`[Leaderboard] Loaded and cached ${sorted.length} agents from ${networkName}`);

                setRankedAgents(sorted);
            } catch (e) {
                console.error('[Leaderboard] Failed to load:', e);
            }
            setIsLoading(false);
        };

        loadLeaderboard();
    }, [publicClient, effectiveChainId, networkName]);

    const formatAddress = (addr: string) => {
        if (addr.length <= 10) return addr;
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const handleConnect = () => {
        const connector = connectors[0];
        if (connector) {
            connect({ connector });
        }
    };

    const getMedalIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <span className="medal medal-gold">1</span>;
            case 2:
                return <span className="medal medal-silver">2</span>;
            case 3:
                return <span className="medal medal-bronze">3</span>;
            default:
                return <span className="rank-number">#{rank}</span>;
        }
    };

    const top3 = rankedAgents.slice(0, 3);

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
                    <Link to="/dashboard" className="sidebar-link">
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
                    <Link to="/leaderboard" className="sidebar-link active">
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
                        <h1 className="heading-3">Agent Leaderboard</h1>
                        <p className="text-muted">Top-performing agents ranked by score and reviews</p>
                    </div>
                    <TopBar />
                </header>

                {isLoading ? (
                    <div className="leaderboard-loading">
                        <LoadingSpinner size="large" text="Loading leaderboard..." />
                    </div>
                ) : rankedAgents.length === 0 ? (
                    <div className="leaderboard-empty">
                        <p>No agents with ratings yet.</p>
                        <Link to="/dashboard" className="btn btn-primary">
                            Explore Agents
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Top 3 Podium */}
                        <section className="podium-section">
                            <div className="podium">
                                {top3.map((agent, index) => {
                                    const rank = index + 1;
                                    const meerkatId = agent.metadata?.meerkatId || 1;
                                    return (
                                        <Link
                                            to={`/chat/${agent.agentId}`}
                                            key={agent.agentId}
                                            className={`podium-card podium-${rank}`}
                                        >
                                            <div className="podium-rank">
                                                {rank === 1 && <span className="crown">&#128081;</span>}
                                                {getMedalIcon(rank)}
                                            </div>
                                            <img
                                                src={`/meerkats/meerkat_${meerkatId.toString().padStart(3, '0')}.png`}
                                                alt={agent.metadata?.name || `Agent #${agent.agentId}`}
                                                className="podium-avatar"
                                            />
                                            <div className="podium-info">
                                                <h3 className="podium-name">{agent.metadata?.name || `Agent #${agent.agentId}`}</h3>
                                                <div className="podium-score">
                                                    <span className="score-value">{agent.score}</span>
                                                    <span className="score-label">/100</span>
                                                </div>
                                                <p className="podium-reviews">{agent.feedbackCount} review{agent.feedbackCount !== 1 ? 's' : ''}</p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Full Rankings Table */}
                        <section className="rankings-section">
                            <h2 className="section-title">Full Rankings</h2>
                            <div className="rankings-table-wrapper">
                                <table className="rankings-table">
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Agent</th>
                                            <th>Score</th>
                                            <th>Reviews</th>
                                            <th>Owner</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rankedAgents.map((agent, index) => {
                                            const rank = index + 1;
                                            const meerkatId = agent.metadata?.meerkatId || 1;
                                            return (
                                                <tr key={agent.agentId} className={rank <= 3 ? `top-${rank}` : ''}>
                                                    <td className="col-rank">
                                                        {getMedalIcon(rank)}
                                                    </td>
                                                    <td className="col-agent">
                                                        <div className="agent-cell">
                                                            <img
                                                                src={`/meerkats/meerkat_${meerkatId.toString().padStart(3, '0')}.png`}
                                                                alt={agent.metadata?.name || `Agent #${meerkatId}`}
                                                                className="agent-mini-avatar"
                                                            />
                                                            <div className="agent-cell-info">
                                                                <span className="agent-cell-name">{agent.metadata?.name || `Agent #${meerkatId}`}</span>
                                                                <span className="agent-cell-id">#{meerkatId}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="col-score">
                                                        <span className={`score-badge-inline ${agent.score >= 80 ? 'high' : agent.score >= 50 ? 'medium' : 'low'}`}>
                                                            {agent.score > 0 ? agent.score : 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="col-reviews">
                                                        {agent.feedbackCount}
                                                    </td>
                                                    <td className="col-owner">
                                                        <a
                                                            href={getBlockExplorerAddressUrl(effectiveChainId, agent.owner)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="owner-link"
                                                        >
                                                            {formatAddress(agent.owner)}
                                                        </a>
                                                    </td>
                                                    <td className="col-actions">
                                                        <div className="table-actions">
                                                            <a
                                                                href={get8004ScanAgentUrl(effectiveChainId, agent.agentId)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn btn-8004scan btn-sm"
                                                            >
                                                                8004scan
                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                                    <polyline points="15 3 21 3 21 9" />
                                                                    <line x1="10" y1="14" x2="21" y2="3" />
                                                                </svg>
                                                            </a>
                                                            <Link to={`/chat/${agent.agentId}`} className="btn btn-sm btn-primary">
                                                                Chat
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}
                <MobileFooter />
            </main>

            <MobileNav />
        </div>
    );
}

export default Leaderboard;
