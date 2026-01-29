// RateAgent Component (v1.2 - Final Spec)
// ERC-8004 compliant feedback submission component with x402 payment proof integration
// v1.2 (Final): Uses value/valueDecimals instead of score

import { useState, useCallback } from 'react';
import { useGiveFeedback, createFeedbackData, computeFeedbackHash } from '../hooks/useERC8004Registries';
import { useAccount } from 'wagmi';
import './RateAgent.css';

interface RateAgentProps {
    agentId: number;
    agentName?: string;
    ownerAddress?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
    // Optional x402 payment proof from previous interaction
    paymentProof?: {
        txHash: string;
        amount: string;
        toAddress: string;
    };
}

export function RateAgent({ agentId, agentName, ownerAddress, onSuccess, onCancel, paymentProof }: RateAgentProps) {
    const [score, setScore] = useState<number>(80);
    const [reasoning, setReasoning] = useState('');
    const [tag1, setTag1] = useState('');
    const [tag2, setTag2] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const { address } = useAccount();
    const { giveFeedback, isPending, isConfirming, isSuccess, error } = useGiveFeedback();

    // Check if user is the owner (self-feedback not allowed)
    const isOwner = ownerAddress && address && ownerAddress.toLowerCase() === address.toLowerCase();

    const handleSubmit = useCallback(async () => {
        if (!address) return;

        try {
            // Create feedback data for off-chain storage
            const feedbackData = createFeedbackData(
                agentId,
                address,
                score,
                paymentProof,
                { reasoning, tag1: tag1 || undefined, tag2: tag2 || undefined }
            );

            // Compute hash for integrity verification
            const feedbackHash = computeFeedbackHash(feedbackData);

            // Create feedbackURI as data URI with comment (ERC-8004 format)
            const feedbackJson = {
                comment: reasoning || '',
                score,
                tag1: tag1 || '',
                tag2: tag2 || '',
                timestamp: Date.now(),
                version: '1.1',
            };
            const feedbackURI = reasoning
                ? `data:application/json;base64,${btoa(JSON.stringify(feedbackJson))}`
                : undefined;

            // v1.1: Direct submission - no authorization required
            await giveFeedback(agentId, score, {
                tag1: tag1 || undefined,
                tag2: tag2 || undefined,
                feedbackURI,
                feedbackHash,
                endpoint: '', // Optional endpoint tracking
            });
        } catch (e) {
            console.error('Failed to submit feedback:', e);
        }
    }, [agentId, address, score, reasoning, tag1, tag2, paymentProof, giveFeedback]);

    // Show success state
    if (isSuccess) {
        return (
            <div className="rate-agent rate-agent--success">
                <div className="rate-agent__success-icon">✓</div>
                <h3>Thank you for your feedback!</h3>
                <p>Your rating has been recorded on-chain.</p>
                {onSuccess && (
                    <button className="rate-agent__btn rate-agent__btn--primary" onClick={onSuccess}>
                        Done
                    </button>
                )}
            </div>
        );
    }

    // Show error for self-feedback
    if (isOwner) {
        return (
            <div className="rate-agent rate-agent--error">
                <div className="rate-agent__error-icon">⚠️</div>
                <h3>Cannot Rate Your Own Agent</h3>
                <p>Self-feedback is not allowed. You cannot rate agents you own.</p>
                {onCancel && (
                    <button className="rate-agent__btn rate-agent__btn--secondary" onClick={onCancel}>
                        Close
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="rate-agent">
            <div className="rate-agent__header">
                <h3>Rate {agentName || `Agent #${agentId}`}</h3>
                {paymentProof && (
                    <span className="rate-agent__payment-badge" title="Verified interaction">
                        💰 Verified payment
                    </span>
                )}
            </div>

            {/* Score Slider */}
            <div className="rate-agent__slider-container">
                <div className="rate-agent__slider-header">
                    <span className="rate-agent__slider-label">Score</span>
                    <span className="rate-agent__slider-value">{score}/100</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="rate-agent__slider"
                    style={{
                        background: `linear-gradient(to right, #f97316 0%, #f97316 ${score}%, #E4E4E7 ${score}%, #E4E4E7 100%)`
                    }}
                    disabled={isPending || isConfirming}
                />
                <div className="rate-agent__slider-labels">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                </div>
            </div>

            {/* Reasoning */}
            <div className="rate-agent__field">
                <label htmlFor="reasoning">Comment (optional)</label>
                <textarea
                    id="reasoning"
                    value={reasoning}
                    onChange={(e) => setReasoning(e.target.value)}
                    placeholder="Share your experience with this agent..."
                    maxLength={500}
                    disabled={isPending || isConfirming}
                />
            </div>

            {/* Advanced Options */}
            <button
                className="rate-agent__advanced-toggle"
                onClick={() => setShowAdvanced(!showAdvanced)}
                type="button"
            >
                {showAdvanced ? '▼' : '▶'} Advanced Options
            </button>

            {showAdvanced && (
                <div className="rate-agent__advanced">
                    <div className="rate-agent__field rate-agent__field--inline">
                        <label htmlFor="tag1">Tag 1</label>
                        <input
                            id="tag1"
                            type="text"
                            value={tag1}
                            onChange={(e) => setTag1(e.target.value)}
                            placeholder="e.g., defi, analytics"
                            maxLength={64}
                            disabled={isPending || isConfirming}
                        />
                    </div>
                    <div className="rate-agent__field rate-agent__field--inline">
                        <label htmlFor="tag2">Tag 2</label>
                        <input
                            id="tag2"
                            type="text"
                            value={tag2}
                            onChange={(e) => setTag2(e.target.value)}
                            placeholder="e.g., fast, accurate"
                            maxLength={64}
                            disabled={isPending || isConfirming}
                        />
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="rate-agent__error">
                    Failed to submit: {error.message}
                </div>
            )}

            {/* Actions */}
            <div className="rate-agent__actions">
                {onCancel && (
                    <button
                        className="rate-agent__btn rate-agent__btn--secondary"
                        onClick={onCancel}
                        disabled={isPending || isConfirming}
                        type="button"
                    >
                        Cancel
                    </button>
                )}
                <button
                    className="rate-agent__btn rate-agent__btn--primary"
                    onClick={handleSubmit}
                    disabled={isPending || isConfirming || !address}
                    type="button"
                >
                    {isPending ? 'Submitting...' : isConfirming ? 'Confirming...' : 'Submit Rating'}
                </button>
            </div>

            {!address && (
                <p className="rate-agent__connect-hint">Connect your wallet to submit feedback</p>
            )}
        </div>
    );
}

export default RateAgent;
