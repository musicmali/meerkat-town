// ScoreBadge Component
// Displays agent score in a circular orange badge
// Final spec: getSummary returns [count, averageValue, valueDecimals]

import { useAgentReputation } from '../hooks/useERC8004Registries';
import './ScoreBadge.css';

interface ScoreBadgeProps {
    agentId: number;
    className?: string;
}

export function ScoreBadge({ agentId, className = '' }: ScoreBadgeProps) {
    const { data, isLoading, error } = useAgentReputation(agentId);

    // Always show the badge
    let score: string = 'N/A';
    let hasScore = false;

    if (!isLoading && !error && data) {
        const [count, averageScore] = data as [bigint, number];
        const feedbackCount = Number(count);

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
