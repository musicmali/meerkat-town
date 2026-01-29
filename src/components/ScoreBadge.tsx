// ScoreBadge Component
// Displays agent score in a circular orange badge
// Supports both v1.1 (Base Sepolia) and v1.2 (Mainnet) formats

import { useChainId } from 'wagmi';
import { useAgentReputation, parseReputationSummary } from '../hooks/useERC8004Registries';
import { isSupportedNetwork, DEFAULT_CHAIN_ID } from '../config/networks';
import './ScoreBadge.css';

interface ScoreBadgeProps {
    agentId: number;
    className?: string;
}

export function ScoreBadge({ agentId, className = '' }: ScoreBadgeProps) {
    const chainId = useChainId();
    const effectiveChainId = isSupportedNetwork(chainId) ? chainId : DEFAULT_CHAIN_ID;
    const { data, isLoading, error } = useAgentReputation(agentId);

    // Always show the badge
    let score: string = 'N/A';
    let hasScore = false;

    if (!isLoading && !error && data) {
        const { count: feedbackCount, score: averageScore } = parseReputationSummary(data, effectiveChainId);

        if (feedbackCount > 0) {
            score = String(averageScore);
            hasScore = true;
        }
    }

    return (
        <div className={`score-badge ${className}`}>
            <span className="score-badge__text">Score</span>
            <span className="score-badge__value">{isLoading ? '...' : score}</span>
            {hasScore && <span className="score-badge__label">/100</span>}
        </div>
    );
}

export default ScoreBadge;
