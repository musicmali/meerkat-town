// ScoreBadge Component
// Displays agent score in a circular orange badge
// Supports both v1.1 (Base Sepolia) and v1.2 (ETH mainnet) contracts
// v1.1: getSummary returns [count, averageScore]
// v1.2: getSummary returns [count, summaryValue, summaryValueDecimals]

import { useChainId } from 'wagmi';
import { useAgentReputation } from '../hooks/useERC8004Registries';
import { getReputationVersion } from '../config/networks';
import './ScoreBadge.css';

interface ScoreBadgeProps {
    agentId: number;
    className?: string;
}

export function ScoreBadge({ agentId, className = '' }: ScoreBadgeProps) {
    const chainId = useChainId();
    const reputationVersion = getReputationVersion(chainId);
    const { data, isLoading, error } = useAgentReputation(agentId);

    // Always show the badge
    let score: string = 'N/A';
    let hasScore = false;

    if (!isLoading && !error && data) {
        // Parse data based on contract version
        // v1.1: [count, averageScore]
        // v1.2: [count, summaryValue, summaryValueDecimals]
        let feedbackCount: number;
        let averageScore: number;

        if (reputationVersion === 'v1.2') {
            const [count, summaryValue] = data as [bigint, bigint, number];
            feedbackCount = Number(count);
            averageScore = Number(summaryValue);
        } else {
            const [count, scoreVal] = data as [bigint, number];
            feedbackCount = Number(count);
            averageScore = scoreVal;
        }

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
