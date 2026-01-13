import './LoadingSpinner.css';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    text?: string;
}

function LoadingSpinner({ size = 'medium', text }: LoadingSpinnerProps) {
    return (
        <div className={`loading-spinner-container ${size}`}>
            <div className="loading-spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
            </div>
            {text && <p className="loading-text">{text}</p>}
        </div>
    );
}

export default LoadingSpinner;
