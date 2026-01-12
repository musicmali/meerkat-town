// Component for agent owners to view and manage feedback authorization requests

import { useState, useEffect } from 'react';
import { usePendingAuthRequests, useGrantFeedbackAuth, type FeedbackAuthRequest } from '../hooks/useFeedbackAuth';
import './AuthorizationRequests.css';

interface AuthorizationRequestsProps {
    onRequestProcessed?: () => void;
}

export function AuthorizationRequests({ onRequestProcessed }: AuthorizationRequestsProps) {
    const { requests, fetchRequests, isLoading: isFetching } = usePendingAuthRequests();
    const { grantAuthorization, rejectAuthorization, isLoading: isProcessing, error } = useGrantFeedbackAuth();

    const [processingId, setProcessingId] = useState<string | null>(null);
    const [feedbacksAllowed, setFeedbacksAllowed] = useState<Record<string, number>>({});
    const [expiryDays, setExpiryDays] = useState<Record<string, number>>({});

    useEffect(() => {
        fetchRequests();
        // Poll for new requests every 30 seconds
        const interval = setInterval(fetchRequests, 30000);
        return () => clearInterval(interval);
    }, [fetchRequests]);

    const handleGrant = async (request: FeedbackAuthRequest) => {
        setProcessingId(request.id);
        try {
            await grantAuthorization(
                request,
                feedbacksAllowed[request.id] || request.requestedFeedbacks,
                expiryDays[request.id] || 30
            );
            await fetchRequests();
            onRequestProcessed?.();
        } catch (e) {
            // Error handled by hook
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (requestId: string) => {
        setProcessingId(requestId);
        try {
            await rejectAuthorization(requestId);
            await fetchRequests();
            onRequestProcessed?.();
        } catch (e) {
            // Error handled by hook
        } finally {
            setProcessingId(null);
        }
    };

    const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    const formatDate = (timestamp: number) => new Date(timestamp).toLocaleString();

    if (isFetching && requests.length === 0) {
        return (
            <div className="auth-requests">
                <div className="auth-requests-loading">
                    Loading requests...
                </div>
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="auth-requests">
                <div className="auth-requests-empty">
                    <span className="empty-icon">📭</span>
                    <h4>No Pending Requests</h4>
                    <p>You don't have any pending feedback authorization requests.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-requests">
            <div className="auth-requests-header">
                <h3>Feedback Authorization Requests</h3>
                <p>{requests.length} pending request(s)</p>
            </div>

            {error && (
                <div className="auth-error">
                    {error}
                </div>
            )}

            <div className="auth-requests-list">
                {requests.map((request) => (
                    <div key={request.id} className="auth-request-card">
                        <div className="request-header">
                            <div className="requester-info">
                                <span className="requester-label">Requester</span>
                                <span className="requester-address">{formatAddress(request.clientAddress)}</span>
                            </div>
                            <div className="agent-info">
                                <span className="agent-label">Agent</span>
                                <span className="agent-id">#{request.agentId}</span>
                            </div>
                        </div>

                        {request.message && (
                            <div className="request-message">
                                <span className="message-label">Message:</span>
                                <p>"{request.message}"</p>
                            </div>
                        )}

                        <div className="request-meta">
                            <span>Requested: {request.requestedFeedbacks} feedback(s)</span>
                            <span>Submitted: {formatDate(request.createdAt)}</span>
                        </div>

                        <div className="request-controls">
                            <div className="control-group">
                                <label>Feedbacks to Allow</label>
                                <select
                                    value={feedbacksAllowed[request.id] || request.requestedFeedbacks}
                                    onChange={(e) => setFeedbacksAllowed({
                                        ...feedbacksAllowed,
                                        [request.id]: Number(e.target.value)
                                    })}
                                    disabled={isProcessing && processingId === request.id}
                                >
                                    <option value={1}>1</option>
                                    <option value={3}>3</option>
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                </select>
                            </div>

                            <div className="control-group">
                                <label>Valid For</label>
                                <select
                                    value={expiryDays[request.id] || 30}
                                    onChange={(e) => setExpiryDays({
                                        ...expiryDays,
                                        [request.id]: Number(e.target.value)
                                    })}
                                    disabled={isProcessing && processingId === request.id}
                                >
                                    <option value={7}>7 days</option>
                                    <option value={14}>14 days</option>
                                    <option value={30}>30 days</option>
                                    <option value={90}>90 days</option>
                                </select>
                            </div>
                        </div>

                        <div className="request-actions">
                            <button
                                onClick={() => handleGrant(request)}
                                disabled={isProcessing && processingId === request.id}
                                className="btn btn-primary"
                            >
                                {isProcessing && processingId === request.id ? 'Signing...' : 'Sign & Grant'}
                            </button>
                            <button
                                onClick={() => handleReject(request.id)}
                                disabled={isProcessing && processingId === request.id}
                                className="btn btn-danger"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AuthorizationRequests;
