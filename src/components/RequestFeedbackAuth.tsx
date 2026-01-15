// Component for clients to request feedback authorization from agent owners
// v1.1: Authorization is no longer required - this component redirects to direct rating

import './RequestFeedbackAuth.css';

interface RequestFeedbackAuthProps {
    agentId: number;
    agentName: string;
    ownerAddress: string;
    onAuthorizationGranted?: () => void;
    onCancel?: () => void;
}

export function RequestFeedbackAuth({
    agentName,
    onAuthorizationGranted,
    onCancel,
}: RequestFeedbackAuthProps) {
    // v1.1: Authorization is no longer required
    return (
        <div className="request-auth">
            <div className="auth-status authorized">
                <span className="auth-icon">✓</span>
                <div>
                    <h4>Ready to Submit Feedback</h4>
                    <p>
                        With ERC-8004 v1.1, you can submit feedback for <strong>{agentName}</strong> directly.
                        No authorization required!
                    </p>
                </div>
            </div>
            <div className="auth-actions">
                {onAuthorizationGranted && (
                    <button onClick={onAuthorizationGranted} className="btn btn-primary">
                        Continue to Rate
                    </button>
                )}
                {onCancel && (
                    <button onClick={onCancel} className="btn btn-ghost">
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
}

export default RequestFeedbackAuth;
