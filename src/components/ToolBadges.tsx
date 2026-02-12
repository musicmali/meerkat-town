import './ToolBadges.css';

interface ToolUsed {
    name: string;
    args: Record<string, unknown>;
}

interface ToolBadgesProps {
    toolsUsed: ToolUsed[];
}

const TOOL_LABELS: Record<string, { label: string; icon: string }> = {
    get_crypto_price: { label: 'Crypto Price', icon: '📈' },
    get_dex_price: { label: 'DEX Price', icon: '📈' },
    get_wallet_balance: { label: 'Wallet Balance', icon: '💰' },
    get_gas_price: { label: 'Gas Price', icon: '⛽' },
    get_token_info: { label: 'Token Info', icon: '🪙' },
    get_block_number: { label: 'Block Data', icon: '🧱' },
    get_transaction: { label: 'Transaction', icon: '🔍' },
    search_web: { label: 'Web Search', icon: '🌐' },
    search_knowledge: { label: 'Knowledge Base', icon: '📚' },
    get_agent_reputation: { label: 'Reputation', icon: '⭐' },
    list_agents: { label: 'Agent List', icon: '🐾' },
    execute_calculation: { label: 'Calculation', icon: '🧮' },
    get_defi_protocol_stats: { label: 'DeFi Stats', icon: '📊' },
    get_token_holders: { label: 'Token Holders', icon: '🐋' },
    get_trending_tokens: { label: 'Trending', icon: '🔥' },
    swap_quote: { label: 'Swap Quote', icon: '🔄' },
    get_portfolio: { label: 'Portfolio', icon: '💼' },
};

function ToolBadges({ toolsUsed }: ToolBadgesProps) {
    if (!toolsUsed || toolsUsed.length === 0) return null;

    // Deduplicate by tool name
    const uniqueTools = Array.from(
        new Map(toolsUsed.map(t => [t.name, t])).values()
    );

    return (
        <div className="tool-badges">
            {uniqueTools.map((tool) => {
                const meta = TOOL_LABELS[tool.name] || { label: tool.name, icon: '🔧' };
                return (
                    <span key={tool.name} className="tool-badge" title={`Used: ${tool.name}`}>
                        <span className="tool-badge-icon">{meta.icon}</span>
                        {meta.label}
                    </span>
                );
            })}
        </div>
    );
}

export default ToolBadges;
