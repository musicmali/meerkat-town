// Component for clients to request feedback authorization from agent owners

import { useState } from 'react';
import { useRequestFeedbackAuth, useFeedbackAuthorization } from '../hooks/useFeedbackAuth';
import './RequestFeedbackAuth.css';

interface RequestFeedbackAuthProps {
    agentId: number;
    agentName: string;
    ownerAddress: string;
    onAuthorizationGranted?: () => void;
    onCancel?: () => void;
}

export function RequestFeedbackAuth({
    agentId,
    agentName,
    ownerAddress,
    onAuthorizationGranted,
    onCancel,
}: RequestFeedbackAuthProps) {
    const [requestedFeedbacks, setRequestedFeedbacks] = useState(5);
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const { requestAuthorization, isLoading, error } = useRequestFeedbackAuth();
    const { authorization, checkAuthorization } = useFeedbackAuthorization(agentId);

    const handleSubmit = async () => {
        try {
            await requestAuthorization(agentId, ownerAddress, requestedFeedbacks, message || undefined);
            setSubmitted(true);
        } catch (e) {
            // Error is handled by the hook
        }
    };

    // Check if already authorized
    if (authorization) {
        const remaining = authorization.feedbacksAllowed - authorization.feedbacksUsed;
        return (
            <div className="request-auth">
                <div className="auth-status authorized">
                    <span className="auth-icon">✓</span>
                    <div>
                        <h4>You're Authorized</h4>
                        <p>You have {remaining} feedback(s) remaining for {agentName}.</p>
                        <p className="auth-expiry">
                            Expires: {new Date(authorization.expiryTimestamp * 1000).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                {onAuthorizationGranted && (
                    <button onClick={onAuthorizationGranted} className="btn btn-primary">
                        Continue to Rate
                    </button>
                )}
            </div>
        );
    }

    // Request submitted
    if (submitted) {
        return (
            <div className="request-auth">
                <div className="auth-status pending">
                    <span className="auth-icon">⏳</span>
                    <div>
                        <h4>Request Submitted</h4>
                        <p>Your authorization request has been sent to the agent owner.</p>
                        <p className="auth-hint">
                            Once approved, you'll be able to submit feedback for {agentName}.
                        </p>
                    </div>
                </div>
                <div className="auth-actions">
                    <button onClick={() => checkAuthorization()} className="btn btn-secondary">
                        Check Status
                    </button>
                    {onCancel && (
                        <button onClick={onCancel} className="btn btn-ghost">
                            Close
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="request-auth">
            <div className="request-auth-header">
                <h3>Request Feedback Authorization</h3>
                <p>Request permission to submit feedback for <strong>{agentName}</strong></p>
            </div>

            <div className="request-auth-form">
                <div className="form-group">
                    <label>Number of Feedbacks</label>
                    <select
                        value={requestedFeedbacks}
                        onChange={(e) => setRequestedFeedbacks(Number(e.target.value))}
                        className="form-select"
                    >
                        <option value={1}>1 feedback</option>
                        <option value={3}>3 feedbacks</option>
                        <option value={5}>5 feedbacks</option>
                        <option value={10}>10 feedbacks</option>
                    </select>
                    <span className="form-hint">How many feedbacks do you want to submit?</span>
                </div>

                <div className="form-group">
                    <label>Message (Optional)</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Add a message to the agent owner..."
                        className="form-textarea"
                        rows={3}
                        maxLength={200}
                    />
                    <span className="form-hint">{message.length}/200 characters</span>
                </div>

                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
                )}

                <div className="auth-actions">
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="btn btn-primary"
                    >
                        {isLoading ? 'Submitting...' : 'Send Request'}
                    </button>
                    {onCancel && (
                        <button onClick={onCancel} className="btn btn-ghost">
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            <div className="request-auth-info">
                <p>
                    <strong>Why is this needed?</strong><br />
                    The ERC-8004 standard requires agent owners to authorize feedback submissions.
                    This prevents spam and ensures quality feedback.
                </p>
            </div>
        </div>
    );
}

export default RequestFeedbackAuth;
