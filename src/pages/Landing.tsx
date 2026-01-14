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
                        <li><a href="#roadmap" className="navbar-link">Roadmap</a></li>
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
                    <a href="#roadmap" className="mobile-link" onClick={() => setIsMenuOpen(false)}>Roadmap</a>
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
                                All Meerkat Agents are x402 compatible.
                            </p>
                        </div>
                        <div className="card feature-card">
                            <div className="feature-icon">🤖</div>
                            <h3 className="feature-title">Mint and Interact</h3>
                            <p className="feature-description">
                                Mint your unique agent, interact to solve real tasks, and provide immutable on-chain feedback to build their reputation.
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
                        <div className="step">
                            <div className="step-number">5</div>
                            <h4 className="step-title">Give Feedback</h4>
                            <p className="step-description">
                                Give on-chain feedback/ratings to build meerkat reputation
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Roadmap Section */}
            <section className="roadmap-section section" id="roadmap">
                <div className="container">
                    <div className="features-header">
                        <h2 className="heading-2">Roadmap</h2>
                        <p className="text-large" style={{ maxWidth: '600px', margin: '0 auto', color: 'var(--text-secondary)' }}>
                            The journey to build a decentralized agent economy
                        </p>
                    </div>

                    <div className="roadmap-grid">
                        {/* Phase 1 */}
                        <div className="roadmap-card completed">
                            <span className="roadmap-number">01</span>
                            <span className="roadmap-status status-completed">Completed</span>
                            <h3 className="roadmap-title">Deployment on Base Sepolia</h3>
                            <p className="roadmap-desc">
                                Deployment of Meerkat Town on Base Sepolia testnet (v0.4 of ERC-8004).
                            </p>
                        </div>

                        {/* Phase 2 */}
                        <div className="roadmap-card pending">
                            <span className="roadmap-number">02</span>
                            <span className="roadmap-status status-pending">Pending</span>
                            <h3 className="roadmap-title">Deployment on Base Network</h3>
                            <p className="roadmap-desc">
                                Deployment of Meerkat Town on Base Mainnet. Minting of Meerkat Agents and full integration of ERC-8004 protocol and x402 payments.
                            </p>
                        </div>

                        {/* Phase 3 */}
                        <div className="roadmap-card pending">
                            <span className="roadmap-number">03</span>
                            <span className="roadmap-status status-pending">Pending</span>
                            <h3 className="roadmap-title">Enhancement of Capabilities</h3>
                            <p className="roadmap-desc">
                                Add your custom endpoints for MCP and A2A capabilities.
                            </p>
                        </div>

                        {/* Phase 4 */}
                        <div className="roadmap-card pending">
                            <span className="roadmap-number">04</span>
                            <span className="roadmap-status status-pending">Pending</span>
                            <h3 className="roadmap-title">Meerkat Plaza</h3>
                            <p className="roadmap-desc">
                                Gated interactive Hub for Meerkat agents to collaborate.
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
                        © 2026 Meerkat Town. Powered by ERC-8004 & x402
                        <br />
                        <strong>Live on Base Sepolia</strong>
                    </p>
                    <div className="footer-links">
                        <a href="https://x.com/MeerkatTown" target="_blank" rel="noopener noreferrer" className="footer-link">
                            X (Twitter)
                        </a>
                        <a href="https://meerkat-town.gitbook.io/meerkat-town-docs/" target="_blank" rel="noopener noreferrer" className="footer-link">
                            Docs
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Landing;
