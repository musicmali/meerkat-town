// Component for agent owners to view and manage feedback authorization requests
// v1.1: Authorization is no longer required - this component is deprecated

import './AuthorizationRequests.css';

interface AuthorizationRequestsProps {
    onRequestProcessed?: () => void;
}

export function AuthorizationRequests({ onRequestProcessed: _onRequestProcessed }: AuthorizationRequestsProps) {
    // v1.1: Authorization is no longer required - feedback can be submitted directly
    return (
        <div className="auth-requests">
            <div className="auth-requests-empty">
                <span className="empty-icon">✨</span>
                <h4>No Authorization Required</h4>
                <p>
                    With ERC-8004 v1.1, users can submit feedback directly without authorization.
                    This simplifies the feedback process and improves user experience.
                </p>
            </div>
        </div>
    );
}

export default AuthorizationRequests;
