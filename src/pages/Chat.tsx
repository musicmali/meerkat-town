import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAccount, useConnect, useChainId, usePublicClient } from 'wagmi';
import ReactMarkdown from 'react-markdown';
import { useX402 } from '../hooks/useX402';
import { fetchAgent } from '../hooks/useIdentityRegistry';
import { IDENTITY_REGISTRY_ABI } from '../contracts/MeerkatIdentityRegistry';
import {
    isX402Supported,
    getContractAddress,
    getNetworkName,
} from '../config/networks';
import RateAgent from '../components/RateAgent';
import './Chat.css';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Legacy agent configurations (Bob & Ana)
const legacyAgents: Record<string, { name: string; title: string; avatar: string; description: string }> = {
    bob: {
        name: 'Bob',
        title: 'Crypto Analyst',
        avatar: '/Bob.png',
        description: 'Expert in cryptocurrency market analysis, DeFi protocols, and blockchain technology.',
    },
    ana: {
        name: 'Ana',
        title: 'Writing Assistant',
        avatar: '/Ana.png',
        description: 'Creative content specialist for blog posts, marketing copy, and storytelling.',
    },
};

interface AgentInfo {
    name: string;
    title: string;
    avatar: string;
    description: string;
    systemPrompt?: string;
    isMintedAgent?: boolean;
    pricePerMessage?: string;
    agentId?: number;  // For ERC-8004 feedback submission
    ownerAddress?: string;  // Agent owner for feedback authorization
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

function Chat() {
    const { agentId } = useParams<{ agentId: string }>();

    // Wallet connection
    const { address, isConnected } = useAccount();
    const { connect, connectors, isPending: isConnectPending } = useConnect();

    // Chain management
    const chainId = useChainId();
    const x402NetworkSupported = isX402Supported(chainId);

    // Use current chain for fetching agent data
    const publicClient = usePublicClient({ chainId });

    // x402 payment support
    const { x402Fetch, isReady: isX402Ready, x402Available } = useX402();

    // Dynamic agent state
    const [agent, setAgent] = useState<AgentInfo | null>(null);
    const [isAgentLoading, setIsAgentLoading] = useState(true);

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showRating, setShowRating] = useState(false);  // Show rating after conversation

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Load agent details
    useEffect(() => {
        const loadAgent = async () => {
            setIsAgentLoading(true);
            if (!agentId) {
                setAgent(legacyAgents.bob);
                setIsAgentLoading(false);
                return;
            }

            // Check if legacy agent
            if (legacyAgents[agentId]) {
                setAgent(legacyAgents[agentId]);
                setIsAgentLoading(false);
                return;
            }

            // Fetch agent from ERC-8004 Identity Registry
            try {
                if (publicClient) {
                    const numericAgentId = parseInt(agentId, 10);
                    if (isNaN(numericAgentId)) {
                        setError('Invalid agent ID');
                        setAgent(null);
                        setIsAgentLoading(false);
                        return;
                    }

                    const found = await fetchAgent(numericAgentId, publicClient, chainId);

                    if (found && found.isMeerkatAgent) {
                        const meerkatId = found.metadata?.meerkatId || 1;

                        // Extract domains for description
                        // Support both "services" (new) and "endpoints" (legacy)
                        const domains: string[] = [];
                        const servicesList = found.metadata?.services || found.metadata?.endpoints || [];
                        servicesList.forEach(svc => {
                            if (svc.domains) {
                                svc.domains.forEach(d => {
                                    const lastPart = d.split('/').pop() || d;
                                    domains.push(lastPart.replace(/_/g, ' '));
                                });
                            }
                        });

                        // Fetch the agent owner from Identity Registry
                        let ownerAddress: string | undefined;
                        try {
                            const identityAddress = getContractAddress(chainId, 'identityRegistry');
                            const owner = await publicClient.readContract({
                                address: identityAddress,
                                abi: IDENTITY_REGISTRY_ABI,
                                functionName: 'ownerOf',
                                args: [BigInt(numericAgentId)],
                            }) as `0x${string}`;
                            ownerAddress = owner;
                        } catch (err) {
                            console.error('Failed to fetch agent owner:', err);
                        }

                        // Build system prompt from metadata
                        const networkName = getNetworkName(chainId);
                        const systemPrompt = `You are ${found.metadata?.name || 'a Meerkat Agent'}, a helpful AI assistant.
Description: ${found.metadata?.description || `A unique Meerkat Agent on ${networkName}.`}
Expertise: ${domains.join(', ') || 'General assistance'}
Be friendly, helpful, and concise in your responses.`;

                        // Get price from metadata - 'Free' or '0' means free
                        const price = found.metadata?.pricePerMessage || 'Free';
                        const isFreeAgent = price === 'Free' || price === '0' || price === '0.00' || parseFloat(price) === 0;

                        setAgent({
                            name: found.metadata?.name || `Meerkat #${meerkatId}`,
                            title: `Meerkat Agent #${meerkatId}`,
                            avatar: `/meerkats/meerkat_${meerkatId.toString().padStart(3, '0')}.png`,
                            description: found.metadata?.description || 'A unique Meerkat Agent.',
                            systemPrompt,
                            isMintedAgent: !isFreeAgent, // Only true if it's a PAID agent
                            pricePerMessage: isFreeAgent ? 'Free' : `$${price}`,
                            agentId: found.agentId, // For ERC-8004 feedback
                            ownerAddress, // For feedback authorization
                        });
                    } else {
                        setError('Agent not found');
                        setAgent(null);
                    }
                }
            } catch (err) {
                console.error('Failed to load agent:', err);
                setError('Failed to load agent');
            } finally {
                setIsAgentLoading(false);
            }
        };

        loadAgent();
    }, [agentId, publicClient, chainId]);


    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-resize textarea
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
    };

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const handleConnect = () => {
        const connector = connectors[0];
        if (connector) {
            connect({ connector });
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
        }

        try {
            // Use paid mode when wallet connected, on correct chain, and x402 is supported
            // Legacy agents (bob, ana) and paid minted agents all require payment
            const isLegacyAgent = agentId === 'bob' || agentId === 'ana';
            const isFreeAgent = agent?.pricePerMessage === 'Free';
            const shouldCharge = (isLegacyAgent || agent?.isMintedAgent) && !isFreeAgent;
            // Only use x402 if the network supports it
            const useX402 = shouldCharge && isConnected && isX402Ready && x402Available && x402NetworkSupported;

            // Choose endpoint: paid or demo
            const endpoint = useX402 ? `/agents/${agentId}` : `/demo/${agentId}`;

            // Use x402Fetch for paid mode, regular fetch for demo
            const fetchFn = useX402 ? x402Fetch : fetch;

            const response = await fetchFn(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    sessionId: address || 'demo-session',
                    systemPrompt: agent?.systemPrompt, // Pass system prompt for minted agents
                }),
            });

            const data = await response.json();

            if (response.status === 402) {
                setError(`Payment required. Make sure you have USDC on ${getNetworkName(chainId)} and try again.`);
                return;
            }

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get response');
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.message,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (err: any) {
            console.error('[Chat] Error:', err);
            setError(err.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Loading state
    if (isAgentLoading) {
        return (
            <div className="chat-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <p>Loading agent...</p>
                </div>
            </div>
        );
    }

    // Error state - agent not found
    if (!agent) {
        return (
            <div className="chat-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <h2>Agent Not Found</h2>
                    <p>{error || 'The requested agent could not be loaded.'}</p>
                    <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-page">
            {/* Header */}
            <header className="chat-header">
                <div className="chat-header-left">
                    <Link to="/dashboard" className="back-button">
                        ← Back
                    </Link>
                    <div className="chat-agent-info">
                        <img src={agent.avatar} alt={agent.name} className="chat-avatar" />
                        <div>
                            <h1 className="chat-agent-name">{agent.name}</h1>
                            <p className="chat-agent-title">{agent.title}</p>
                        </div>
                    </div>
                </div>
                <div className="chat-header-right">
                    {/* Demo-only mode warning (when x402 not supported) */}
                    {isConnected && !x402NetworkSupported && (
                        <span className="demo-badge" title="Paid chat available on Base or Base Sepolia">
                            Demo Mode
                        </span>
                    )}
                    {/* Price badge */}
                    <span className="price-badge">
                        {agent.pricePerMessage === 'Free' ? 'Free' : `${agent.pricePerMessage || '$0.001'} / msg`}
                    </span>
                    {isConnected && address ? (
                        <div className="wallet-badge connected">
                            <span className="wallet-dot"></span>
                            {formatAddress(address)}
                        </div>
                    ) : (
                        <button
                            onClick={handleConnect}
                            disabled={isConnectPending}
                            className="btn btn-primary btn-small"
                        >
                            {isConnectPending ? '...' : 'Connect'}
                        </button>
                    )}
                </div>
            </header>

            {/* Messages */}
            <main className="chat-messages">
                {messages.length === 0 && (
                    <div className="chat-empty">
                        <img src={agent.avatar} alt={agent.name} className="empty-avatar" />
                        <h2>Start chatting with {agent.name}</h2>
                        <p>
                            {agent.name === 'Bob'
                                ? 'Ask me about crypto markets, DeFi protocols, or any blockchain project!'
                                : 'I can help with writing, content creation, copywriting, and more!'}
                        </p>
                        {isConnected && !x402NetworkSupported && (
                            <p className="demo-notice" style={{ color: '#F97316' }}>
                                Free demo mode on {getNetworkName(chainId)}. Paid chat available on Base or Base Sepolia.
                            </p>
                        )}
                        {isConnected && x402NetworkSupported && (
                            <p className="demo-notice">
                                {agent.pricePerMessage === 'Free'
                                    ? '🆓 This agent is free to chat with!'
                                    : `💰 Each message costs ${agent.pricePerMessage || '$0.001'} USDC via x402`}
                            </p>
                        )}
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`message message-${msg.role}`}>
                        {msg.role === 'assistant' && (
                            <img src={agent.avatar} alt={agent.name} className="message-avatar" />
                        )}
                        <div className="message-content">
                            {msg.role === 'assistant' ? (
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            ) : (
                                <p>{msg.content}</p>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="message message-assistant">
                        <img src={agent.avatar} alt={agent.name} className="message-avatar" />
                        <div className="message-content typing">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="chat-error">
                        <span>⚠️ {error}</span>
                    </div>
                )}

                {/* Rate Agent Button - shows after at least one exchange */}
                {messages.length >= 2 && !showRating && agent.agentId && (
                    <div className="chat-rate-prompt">
                        <button
                            onClick={() => setShowRating(true)}
                            className="btn btn-primary"
                        >
                            ⭐ Rate this agent
                        </button>
                    </div>
                )}

                {/* Rating Component */}
                {showRating && agent.agentId && (
                    <RateAgent
                        agentId={agent.agentId}
                        agentName={agent.name}
                        ownerAddress={agent.ownerAddress}
                        onSuccess={() => setShowRating(false)}
                        onCancel={() => setShowRating(false)}
                    />
                )}

                <div ref={messagesEndRef} />
            </main>

            {/* Input */}
            <footer className="chat-input-container">
                <div
                    className="chat-input-wrapper"
                    onClick={() => inputRef.current?.focus()}
                >
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message ${agent.name}...`}
                        rows={1}
                        className="chat-input"
                        disabled={isLoading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        className="send-button"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />
                        </svg>
                    </button>
                </div>
                <p className="chat-disclaimer">
                    {agent.pricePerMessage === 'Free'
                        ? 'This agent is free to chat with.'
                        : x402NetworkSupported
                            ? `Each message costs ${agent.pricePerMessage || '$0.001'} USDC via x402.`
                            : `Demo mode - paid chat available on Base or Base Sepolia.`}
                </p>
            </footer>
        </div>
    );
}

export default Chat;
