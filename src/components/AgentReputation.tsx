// AgentReputation Component
// Displays ERC-8004 agent reputation summary (average value and feedback count)
// Supports both v1.1 (Base Sepolia) and v1.2 (ETH mainnet) contracts
// v1.1: getSummary returns [count, averageScore]
// v1.2: getSummary returns [count, summaryValue, summaryValueDecimals]

import { useChainId } from 'wagmi';
import { useAgentReputation } from '../hooks/useERC8004Registries';
import { getReputationVersion } from '../config/networks';
import './AgentReputation.css';

interface AgentReputationProps {
    agentId: number;
    variant?: 'badge' | 'full' | 'compact';
    showCount?: boolean;
    className?: string;
}

export function AgentReputation({
    agentId,
    variant = 'badge',
    showCount = true,
    className = ''
}: AgentReputationProps) {
    const chainId = useChainId();
    const reputationVersion = getReputationVersion(chainId);
    const { data, isLoading, error } = useAgentReputation(agentId);

    // Handle loading state
    if (isLoading) {
        return (
            <div className={`agent-reputation agent-reputation--${variant} agent-reputation--loading ${className}`}>
                <span className="agent-reputation__loading">...</span>
            </div>
        );
    }

    // Handle error or no data
    if (error || !data) {
        return null; // Silently hide if can't load reputation
    }

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
        const [count, score] = data as [bigint, number];
        feedbackCount = Number(count);
        averageScore = score;
    }

    // No feedback yet
    if (feedbackCount === 0) {
        if (variant === 'compact') {
            return null;
        }
        return (
            <div className={`agent-reputation agent-reputation--${variant} agent-reputation--no-data ${className}`}>
                <span className="agent-reputation__label">No ratings yet</span>
            </div>
        );
    }

    // Convert 0-100 score to stars (1-5)
    const stars = Math.round(averageScore / 20);
    const fullStars = Math.min(5, Math.max(0, stars));
    const emptyStars = 5 - fullStars;

    // Render based on variant
    if (variant === 'compact') {
        return (
            <div className={`agent-reputation agent-reputation--compact ${className}`} title={`${averageScore}/100 from ${feedbackCount} ratings`}>
                <span className="agent-reputation__star">★</span>
                <span className="agent-reputation__score-compact">{averageScore}</span>
            </div>
        );
    }

    if (variant === 'badge') {
        return (
            <div className={`agent-reputation agent-reputation--badge ${className}`}>
                <div className="agent-reputation__stars">
                    {'★'.repeat(fullStars)}
                    {'☆'.repeat(emptyStars)}
                </div>
                {showCount && (
                    <span className="agent-reputation__count">({feedbackCount})</span>
                )}
            </div>
        );
    }

    // Full variant
    return (
        <div className={`agent-reputation agent-reputation--full ${className}`}>
            <div className="agent-reputation__header">
                <span className="agent-reputation__title">Reputation</span>
                <span className="agent-reputation__score-label">{averageScore}/100</span>
            </div>
            <div className="agent-reputation__stars-row">
                <div className="agent-reputation__stars agent-reputation__stars--large">
                    {'★'.repeat(fullStars)}
                    {'☆'.repeat(emptyStars)}
                </div>
                {showCount && (
                    <span className="agent-reputation__count-full">{feedbackCount} review{feedbackCount !== 1 ? 's' : ''}</span>
                )}
            </div>
        </div>
    );
}

export default AgentReputation;
