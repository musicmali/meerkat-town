import { Link } from 'react-router-dom';
import './MobileFooter.css';

function MobileFooter() {
    return (
        <div className="mobile-footer">
            <Link to="/" className="mobile-footer-logo-link">
                <img src="/logo.png" alt="Meerkat Town" className="mobile-footer-logo" />
            </Link>
            <p className="mobile-footer-text">© 2026 Meerkat Town</p>
        </div>
    );
}

export default MobileFooter;
