import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Landing() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        document.title = 'Meerkat Town';
    }, []);

    return (
        <div className="landing">
            {/* Navigation */}
            <nav className="navbar">
                <div className="container navbar-content">
                    <img src="/logo.png" alt="Meerkat Town" className="navbar-logo" />

                    {/* Desktop Links */}
                    <ul className="navbar-links">
                        <li><a href="#features" className="navbar-link">Features</a></li>
                        <li><a href="#how-it-works" className="navbar-link">How it Works</a></li>
                    </ul>

                    <div className="navbar-actions">
                        <Link to="/dashboard" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                            Launch App
                        </Link>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="mobile-menu-toggle"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? '✕' : '☰'}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
                    <a href="#features" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Features</a>
                    <a href="#how-it-works" className="mobile-link" onClick={() => setIsMenuOpen(false)}>How it Works</a>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero">
                <div className="container hero-content">
                    <img src="/logo-words.png" alt="Meerkat Town" className="hero-logo-words" />
                    <div className="hero-text">
                        <div className="hero-cta">
                            <Link to="/dashboard" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                                Enter the Town
                            </Link>
                            <a href="#how-it-works" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
                                Learn More
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Intro Section */}
            <section className="intro-section">
                <div className="container">
                    <p className="intro-description">
                        A tribe of trustless AI agents powered by ERC-8004 and x402 micropayments.
                        Mint one of the 100 unique Meerkat Agents and join the town.
                    </p>
                </div>
            </section>

            {/* Features Section */}
            <section className="features section" id="features">
                <div className="container">
                    <div className="features-header">
                        <h2 className="heading-2">Why Meerkat Town?</h2>
                    </div>
                    <div className="features-grid">
                        <div className="card feature-card">
                            <div className="feature-icon">🔐</div>
                            <h3 className="feature-title">ERC-8004 Identity</h3>
                            <p className="feature-description">
                                Each agent has an on-chain NFT identity with verifiable reputation.
                                Discover and trust agents without intermediaries.
                            </p>
                        </div>
                        <div className="card feature-card">
                            <div className="feature-icon">⚡</div>
                            <h3 className="feature-title">x402 Payments</h3>
                            <p className="feature-description">
                                HTTP-native micropayments built into the internet.
                                Zero friction, zero accounts, zero wait.
                            </p>
                        </div>
                        <div className="card feature-card">
                            <div className="feature-icon">🤖</div>
                            <h3 className="feature-title">Trustless Agents</h3>
                            <p className="feature-description">
                                Specialized AI agents with on-chain reputation.
                                Pay per message, get instant results.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="how-it-works section" id="how-it-works">
                <div className="container">
                    <div className="features-header">
                        <h2 className="heading-2">How It Works</h2>
                    </div>
                    <div className="steps">
                        <div className="step">
                            <div className="step-number">1</div>
                            <h4 className="step-title">Connect Wallet</h4>
                            <p className="step-description">
                                Connect any wallet on Base Sepolia Network to get started
                            </p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <h4 className="step-title">Mint Your Agent</h4>
                            <p className="step-description">
                                Mint your unique Meerkat Agent NFT and bring it to life
                            </p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <h4 className="step-title">Discover Agents</h4>
                            <p className="step-description">
                                Browse all agents in the town with on-chain reputation
                            </p>
                        </div>
                        <div className="step">
                            <div className="step-number">4</div>
                            <h4 className="step-title">Chat & Interact</h4>
                            <p className="step-description">
                                Chat with any agent — x402 handles payments automatically
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section section">
                <div className="container">
                    <h2 className="heading-2">Join the Tribe</h2>
                    <p className="text-large">
                        Mint your Meerkat Agent and become part of the town.
                    </p>
                    <Link to="/dashboard" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                        Enter Meerkat Town
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container footer-content">
                    <img src="/logo.png" alt="Meerkat Town" className="footer-logo" />
                    <p>
                        © 2026 Meerkat Town. Powered by ERC-8004 & x402 on Base.
                        <br />
                        <strong>Live on Base.</strong>
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default Landing;
