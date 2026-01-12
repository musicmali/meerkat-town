// RateAgent Component
// ERC-8004 compliant feedback submission component with x402 payment proof integration
// Now includes authorization flow - users must be authorized by agent owner to give feedback

import { useState, useCallback, useEffect } from 'react';
import { useGiveFeedback, createFeedbackData, computeFeedbackHash } from '../hooks/useERC8004Registries';
import { useFeedbackAuthorization } from '../hooks/useFeedbackAuth';
import { useAccount } from 'wagmi';
import RequestFeedbackAuth from './RequestFeedbackAuth';
import './RateAgent.css';

interface RateAgentProps {
    agentId: number;
    agentName?: string;
    ownerAddress?: string;  // Agent owner address (required for authorization)
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
    const [hoverScore, setHoverScore] = useState<number | null>(null);
    const [reasoning, setReasoning] = useState('');
    const [tag1, setTag1] = useState('');
    const [tag2, setTag2] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showAuthRequest, setShowAuthRequest] = useState(false);

    const { address } = useAccount();
    const { giveFeedback, isPending, isConfirming, isSuccess, error } = useGiveFeedback();
    const { authorization, checkAuthorization, markAsUsed, isLoading: isCheckingAuth } = useFeedbackAuthorization(agentId);

    // Check authorization status on mount
    useEffect(() => {
        if (address && agentId) {
            checkAuthorization();
        }
    }, [address, agentId, checkAuthorization]);

    // Check if user is the owner (self-feedback not allowed)
    const isOwner = ownerAddress && address && ownerAddress.toLowerCase() === address.toLowerCase();

    // Convert 5-star rating to 0-100 score
    const starToScore = (stars: number) => Math.round(stars * 20);
    const scoreToStar = (score: number) => Math.round(score / 20);

    const currentDisplayScore = hoverScore !== null ? hoverScore : score;
    const currentStars = scoreToStar(currentDisplayScore);

    const handleSubmit = useCallback(async () => {
        if (!address) return;
        if (!authorization) {
            setShowAuthRequest(true);
            return;
        }

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
            // This is how comments appear in 8004scan
            const feedbackJson = {
                comment: reasoning || '',
                score,
                tag1: tag1 || '',
                tag2: tag2 || '',
                timestamp: Date.now(),
                version: '1.0',
            };
            const feedbackURI = reasoning
                ? `data:application/json;base64,${btoa(JSON.stringify(feedbackJson))}`
                : undefined;

            // Submit on-chain feedback with stored authorization
            await giveFeedback(agentId, score, {
                tag1: tag1 || undefined,
                tag2: tag2 || undefined,
                feedbackURI,
                feedbackHash,
                storedAuth: authorization,  // Pass the stored authorization
            });

            // Mark the authorization as used
            await markAsUsed();
        } catch (e) {
            console.error('Failed to submit feedback:', e);
        }
    }, [agentId, address, score, reasoning, tag1, tag2, paymentProof, giveFeedback, authorization, markAsUsed]);

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

    // Show loading while checking auth
    if (isCheckingAuth) {
        return (
            <div className="rate-agent rate-agent--loading">
                <p>Checking authorization status...</p>
            </div>
        );
    }

    // Show authorization request form if needed
    if ((showAuthRequest || !authorization) && ownerAddress) {
        return (
            <RequestFeedbackAuth
                agentId={agentId}
                agentName={agentName || `Agent #${agentId}`}
                ownerAddress={ownerAddress}
                onAuthorizationGranted={() => {
                    checkAuthorization();
                    setShowAuthRequest(false);
                }}
                onCancel={onCancel}
            />
        );
    }

    // Show error if no owner address provided
    if (!authorization && !ownerAddress) {
        return (
            <div className="rate-agent rate-agent--error">
                <div className="rate-agent__error-icon">⚠️</div>
                <h3>Cannot Rate Agent</h3>
                <p>Agent owner information is not available.</p>
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

            {/* Star Rating */}
            <div className="rate-agent__stars">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        className={`rate-agent__star ${star <= currentStars ? 'rate-agent__star--filled' : ''}`}
                        onClick={() => setScore(starToScore(star))}
                        onMouseEnter={() => setHoverScore(starToScore(star))}
                        onMouseLeave={() => setHoverScore(null)}
                        disabled={isPending || isConfirming}
                        type="button"
                    >
                        ★
                    </button>
                ))}
                <span className="rate-agent__score">{currentDisplayScore}/100</span>
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
                            maxLength={32}
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
                            maxLength={32}
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
