import { useState, useCallback, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useConnect, useChainId, useSwitchChain, usePublicClient } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { getSkillsByCategory, getDomainsByCategory } from '../data/oasfTaxonomy';
import type { AgentFormData } from '../types/agentMetadata';
import { generateAgentMetadata, formatMetadataJSON, validateAgentMetadata } from '../utils/generateAgentMetadata';
import { useRegisterAgent } from '../hooks/useERC8004Registries';
import { predictNextAgentId, fetchMeerkatAgents } from '../hooks/useIdentityRegistry';
import { uploadToIPFS } from '../utils/pinata';
import MobileNav from '../components/MobileNav';
import MobileFooter from '../components/MobileFooter';
import LoadingSpinner from '../components/LoadingSpinner';
import './MintAgent.css';

// Total number of available meerkats
const TOTAL_MEERKATS = 100;

// Manually used meerkat IDs (exclude even if not detected from blockchain)
// These might be used for testing or minted before the block search window
const MANUALLY_USED_MEERKAT_IDS: number[] = [];

// Generate array of meerkat numbers [1, 2, ..., 100]
const allMeerkatNumbers = Array.from({ length: TOTAL_MEERKATS }, (_, i) => i + 1);

// Get a random meerkat number from available pool
const getRandomMeerkat = (availablePool: number[], exclude?: number): number => {
    const pool = exclude
        ? availablePool.filter(n => n !== exclude)
        : availablePool;
    if (pool.length === 0) return 1; // Fallback if no meerkats available
    return pool[Math.floor(Math.random() * pool.length)];
};

// Get image path for a meerkat number
const getMeerkatImage = (num: number): string => {
    const padded = num.toString().padStart(3, '0');
    return `/meerkats/meerkat_${padded}.png`;
};

// Form steps
type FormStep = 'select' | 'details' | 'skills' | 'preview';

// Minting stages (simplified - URI updates not supported by this registry)
type MintStage = 'idle' | 'predicting' | 'uploading' | 'registering' | 'complete' | 'error';

function MintAgent() {
    const { address, isConnected } = useAccount();
    const { connect, connectors, isPending: isConnectPending } = useConnect();
    const chainId = useChainId();
    const { switchChain, isPending: isSwitching } = useSwitchChain();
    const isCorrectChain = chainId === baseSepolia.id;
    const publicClient = usePublicClient({ chainId: baseSepolia.id });

    // Current step
    const [currentStep, setCurrentStep] = useState<FormStep>('select');

    // Used meerkat tracking - fetch from blockchain
    const [usedMeerkatIds, setUsedMeerkatIds] = useState<Set<number>>(new Set());
    const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);

    // Compute available meerkats (exclude used ones)
    const availableMeerkats = useMemo(() => {
        return allMeerkatNumbers.filter(n => !usedMeerkatIds.has(n));
    }, [usedMeerkatIds]);

    // Selected meerkat state - will be updated once availability is loaded
    const [selectedMeerkat, setSelectedMeerkat] = useState<number>(1);
    const [isShuffling, setIsShuffling] = useState(false);

    // Set page title
    useEffect(() => {
        document.title = 'Mint Agent | Meerkat Town';
    }, []);

    // Fetch used meerkat IDs on mount
    useEffect(() => {
        async function fetchUsedMeerkats() {
            setIsLoadingAvailability(true);
            try {
                const agents = await fetchMeerkatAgents(publicClient);
                const usedIds = agents
                    .map(a => a.metadata?.meerkatId)
                    .filter((id): id is number => id !== undefined && id >= 1 && id <= 100);
                // Combine blockchain-detected IDs with manually excluded IDs
                const allUsedIds = [...usedIds, ...MANUALLY_USED_MEERKAT_IDS];
                console.log('Used meerkat IDs:', allUsedIds);
                setUsedMeerkatIds(new Set(allUsedIds));
            } catch (error) {
                console.error('Failed to fetch used meerkats:', error);
            } finally {
                setIsLoadingAvailability(false);
            }
        }
        if (publicClient) {
            fetchUsedMeerkats();
        }
    }, [publicClient]);

    // Set initial random meerkat once availability is loaded
    useEffect(() => {
        if (!isLoadingAvailability && availableMeerkats.length > 0) {
            setSelectedMeerkat(getRandomMeerkat(availableMeerkats));
        }
    }, [isLoadingAvailability, availableMeerkats]);

    // Form data
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

    // Pricing - Default is FREE
    const [isFree, setIsFree] = useState(true);
    const [pricePerMessage, setPricePerMessage] = useState('0.001');

    // Registration hook (ERC-8004 Identity Registry)
    const {
        register,
        isPending: isRegistering,
        isConfirming,
        isSuccess,
        error: registerError,
        hash,
        getAgentIdFromReceipt,
    } = useRegisterAgent();

    // Minting state
    const [mintStage, setMintStage] = useState<MintStage>('idle');
    const [stageError, setStageError] = useState<string>('');
    const [newAgentId, setNewAgentId] = useState<number | null>(null);
    const [predictedAgentId, setPredictedAgentId] = useState<number | null>(null);

    // Handle registration success
    useEffect(() => {
        if (isSuccess && mintStage === 'registering') {
            console.log('Agent registered in Identity Registry! TX:', hash);
            const agentId = getAgentIdFromReceipt();
            if (agentId !== null && Number(agentId) > 0) {
                const agentIdNum = Number(agentId);
                console.log('New Agent ID from receipt:', agentIdNum);
                setNewAgentId(agentIdNum);
            } else if (predictedAgentId) {
                // Use predicted ID if we couldn't parse from receipt
                console.log('Using predicted Agent ID:', predictedAgentId);
                setNewAgentId(predictedAgentId);
            }
            setMintStage('complete');
        }
    }, [isSuccess, mintStage, hash, getAgentIdFromReceipt, predictedAgentId]);

    // Handle errors
    useEffect(() => {
        if (registerError && mintStage === 'registering') {
            console.error('Registration failed:', registerError);
            setStageError(registerError.message.includes('User rejected')
                ? 'Transaction cancelled'
                : `Registration failed: ${registerError.message}`);
            setMintStage('error');
        }
    }, [registerError, mintStage]);

    // Handle shuffle with animation
    const handleShuffle = useCallback(() => {
        if (availableMeerkats.length === 0) return;
        setIsShuffling(true);
        let shuffleCount = 0;
        const shuffleInterval = setInterval(() => {
            setSelectedMeerkat(getRandomMeerkat(availableMeerkats));
            shuffleCount++;
            if (shuffleCount >= 8) {
                clearInterval(shuffleInterval);
                setSelectedMeerkat(prev => getRandomMeerkat(availableMeerkats, prev));
                setIsShuffling(false);
            }
        }, 80);
    }, [availableMeerkats]);

    const handleConnect = () => {
        const connector = connectors[0];
        if (connector) {
            connect({ connector });
        }
    };

    const handleSwitchToBase = () => {
        switchChain({ chainId: baseSepolia.id });
    };

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    // Step navigation
    const goToStep = (step: FormStep) => setCurrentStep(step);

    // Toggle skill/domain selection
    const toggleSkill = (slug: string) => {
        setSelectedSkills(prev =>
            prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
        );
    };

    const toggleDomain = (slug: string) => {
        setSelectedDomains(prev =>
            prev.includes(slug) ? prev.filter(d => d !== slug) : [...prev, slug]
        );
    };

    // Generate metadata for preview
    const getFormData = (): AgentFormData => ({
        meerkatNumber: selectedMeerkat,
        name,
        description,
        skills: selectedSkills,
        domains: selectedDomains,
        ownerAddress: address || '0x0000000000000000000000000000000000000000',
        pricePerMessage: isFree ? '0' : pricePerMessage,
    });

    const metadata = generateAgentMetadata(getFormData());
    const validation = validateAgentMetadata(metadata);

    // Handle minting
    const handleMint = async () => {
        try {
            setStageError('');

            // Step 1: Predict the next agent ID
            setMintStage('predicting');
            console.log('Predicting next agent ID...');
            const nextId = await predictNextAgentId(publicClient);
            console.log('Predicted next agent ID:', nextId);
            setPredictedAgentId(nextId);

            // Step 2: Generate metadata WITH registrations (using predicted ID)
            setMintStage('uploading');
            const metadataWithRegistrations = generateAgentMetadata(getFormData(), nextId);
            console.log('Generated metadata with registrations:', metadataWithRegistrations);

            // Step 3: Upload metadata to IPFS
            const result = await uploadToIPFS(
                metadataWithRegistrations,
                `meerkat-agent-${selectedMeerkat}`
            );
            console.log('Metadata uploaded to IPFS:', result.ipfsUri);

            // Step 4: Register in ERC-8004 Identity Registry
            setMintStage('registering');
            register(result.ipfsUri);
        } catch (err) {
            console.error('Minting failed:', err);
            setStageError('Failed to mint agent. Please try again.');
            setMintStage('error');
        }
    };

    // Render step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 'select':
                // Show loading state while fetching availability
                if (isLoadingAvailability) {
                    return (
                        <div className="selection-card">
                            <div className="agent-image-container">
                                <div className="loading-placeholder" style={{
                                    width: '200px',
                                    height: '200px',
                                    background: 'var(--surface)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <LoadingSpinner size="large" />
                                </div>
                            </div>
                            <div className="agent-selection-info">
                                <h2 className="agent-title">Checking availability...</h2>
                                <p className="agent-subtitle">Loading available Meerkat agents</p>
                            </div>
                        </div>
                    );
                }

                // Show message if no meerkats available
                if (availableMeerkats.length === 0) {
                    return (
                        <div className="selection-card">
                            <div className="agent-selection-info">
                                <h2 className="agent-title">All Meerkats Minted!</h2>
                                <p className="agent-subtitle">
                                    All 100 Meerkat agents have been claimed. Check the marketplace for secondary sales!
                                </p>
                                <Link to="/dashboard" className="btn btn-primary">
                                    Explore Existing Agents
                                </Link>
                            </div>
                        </div>
                    );
                }

                return (
                    <div className="selection-card">
                        <div className={`agent-image-container ${isShuffling ? 'shuffling' : ''}`}>
                            <img
                                src={getMeerkatImage(selectedMeerkat)}
                                alt={`Meerkat #${selectedMeerkat}`}
                                className="agent-image"
                            />
                            <div className="agent-number-badge">
                                #{selectedMeerkat.toString().padStart(3, '0')}
                            </div>
                        </div>
                        <div className="agent-selection-info">
                            <h2 className="agent-title">Meerkat #{selectedMeerkat.toString().padStart(3, '0')}</h2>
                            <p className="agent-subtitle">
                                This unique Meerkat is waiting to become your AI agent
                            </p>
                            <p className="availability-hint" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                {availableMeerkats.length} of 100 meerkats available
                            </p>
                            <div className="selection-actions">
                                <button
                                    onClick={handleShuffle}
                                    disabled={isShuffling || availableMeerkats.length <= 1}
                                    className="btn btn-secondary btn-shuffle"
                                >
                                    {isShuffling ? 'Shuffling...' : 'Shuffle Agent'}
                                </button>
                                <button
                                    className="btn btn-primary btn-continue"
                                    disabled={!isConnected || !isCorrectChain}
                                    onClick={() => goToStep('details')}
                                >
                                    Continue with this Agent
                                </button>
                            </div>
                            {!isConnected && (
                                <p className="connect-hint">Connect your wallet to continue</p>
                            )}
                        </div>
                    </div>
                );

            case 'details':
                return (
                    <div className="form-card">
                        <div className="form-header">
                            <img src={getMeerkatImage(selectedMeerkat)} alt="Selected Meerkat" className="form-avatar" />
                            <div>
                                <h2 className="form-title">Agent Identity</h2>
                                <p className="form-subtitle">Define your agent's name and capabilities</p>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Agent Name *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., CryptoAnalyst Pro"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                maxLength={200}
                            />
                            <span className="form-hint">{name.length}/200 characters</span>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description *</label>
                            <textarea
                                className="form-textarea"
                                placeholder="Describe what your agent does, its capabilities, and how users can interact with it..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                maxLength={500}
                            />
                            <span className="form-hint">{description.length}/500 characters (min 50)</span>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Pricing</label>
                            <div className="pricing-toggle">
                                <button
                                    className={`pricing-btn ${isFree ? 'active' : ''}`}
                                    onClick={() => setIsFree(true)}
                                >
                                    Free (default)
                                </button>
                                <button
                                    className={`pricing-btn ${!isFree ? 'active' : ''}`}
                                    onClick={() => setIsFree(false)}
                                >
                                    Paid (x402)
                                </button>
                            </div>
                            {!isFree && (
                                <div className="price-input-wrapper">
                                    <input
                                        type="number"
                                        className="form-input price-input"
                                        placeholder="0.001"
                                        value={pricePerMessage}
                                        onChange={(e) => setPricePerMessage(e.target.value)}
                                        min="0.0001"
                                        step="0.0001"
                                    />
                                    <span className="price-currency">USDC per message</span>
                                </div>
                            )}
                            <span className="form-hint">
                                {isFree
                                    ? 'Anyone can chat with your agent for free (x402 still enabled for future features)'
                                    : `Users pay $${pricePerMessage} USDC per message via x402`}
                            </span>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Payment Wallet</label>
                            <div className="wallet-display">
                                <span className="wallet-badge">{address ? formatAddress(address) : 'Not connected'}</span>
                                <span className="wallet-network">Base Sepolia</span>
                            </div>
                            <span className="form-hint">x402 payments will be sent to this address</span>
                        </div>
                        <div className="form-actions">
                            <button className="btn btn-secondary" onClick={() => goToStep('select')}>
                                Back
                            </button>
                            <button
                                className="btn btn-primary"
                                disabled={name.length < 3 || description.length < 50}
                                onClick={() => goToStep('skills')}
                            >
                                Continue to Skills
                            </button>
                        </div>
                    </div>
                );

            case 'skills':
                const skillsByCategory = getSkillsByCategory();
                const domainsByCategory = getDomainsByCategory();

                return (
                    <div className="form-card skills-card">
                        <div className="form-header">
                            <img src={getMeerkatImage(selectedMeerkat)} alt="Selected Meerkat" className="form-avatar" />
                            <div>
                                <h2 className="form-title">Skills & Domains</h2>
                                <p className="form-subtitle">Select capabilities using OASF taxonomy</p>
                            </div>
                        </div>

                        <div className="taxonomy-section">
                            <h3 className="taxonomy-title">Skills ({selectedSkills.length} selected)</h3>
                            {Object.entries(skillsByCategory).map(([category, skills]) => (
                                <div key={category} className="taxonomy-category">
                                    <h4 className="category-name">{category}</h4>
                                    <div className="taxonomy-chips">
                                        {skills.map(skill => (
                                            <button
                                                key={skill.slug}
                                                className={`chip ${selectedSkills.includes(skill.slug) ? 'selected' : ''}`}
                                                onClick={() => toggleSkill(skill.slug)}
                                            >
                                                {skill.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="taxonomy-section">
                            <h3 className="taxonomy-title">Domains ({selectedDomains.length} selected)</h3>
                            {Object.entries(domainsByCategory).map(([category, domains]) => (
                                <div key={category} className="taxonomy-category">
                                    <h4 className="category-name">{category}</h4>
                                    <div className="taxonomy-chips">
                                        {domains.map(domain => (
                                            <button
                                                key={domain.slug}
                                                className={`chip ${selectedDomains.includes(domain.slug) ? 'selected' : ''}`}
                                                onClick={() => toggleDomain(domain.slug)}
                                            >
                                                {domain.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="form-actions">
                            <button className="btn btn-secondary" onClick={() => goToStep('details')}>
                                Back
                            </button>
                            <button
                                className="btn btn-primary"
                                disabled={selectedSkills.length === 0 && selectedDomains.length === 0}
                                onClick={() => goToStep('preview')}
                            >
                                Preview Metadata
                            </button>
                        </div>
                    </div>
                );

            case 'preview':
                return (
                    <div className="form-card preview-card">
                        <div className="form-header">
                            <img src={getMeerkatImage(selectedMeerkat)} alt="Selected Meerkat" className="form-avatar-large" />
                            <div>
                                <h2 className="form-title">{name}</h2>
                                <p className="form-subtitle">{description}</p>
                            </div>
                        </div>

                        {!validation.valid && (
                            <div className="validation-errors">
                                {validation.errors.map((error, i) => (
                                    <p key={i} className="error-message">{error}</p>
                                ))}
                            </div>
                        )}

                        <div className="metadata-preview">
                            <h3 className="metadata-title">ERC-8004 Metadata</h3>
                            <pre className="metadata-json">{formatMetadataJSON(metadata)}</pre>
                        </div>

                        <div className="preview-summary">
                            <div className="summary-item">
                                <span className="summary-label">Meerkat Avatar</span>
                                <span className="summary-value">#{selectedMeerkat.toString().padStart(3, '0')}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Skills</span>
                                <span className="summary-value">{selectedSkills.length} selected</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Domains</span>
                                <span className="summary-value">{selectedDomains.length} selected</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Pricing</span>
                                <span className="summary-value">{isFree ? 'Free' : `$${pricePerMessage} USDC`}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">x402 Support</span>
                                <span className="summary-value">Enabled</span>
                            </div>
                        </div>

                        <div className="preview-wallet">
                            <span className="wallet-label">Receiving Wallet</span>
                            <span className="wallet-value">{address ? formatAddress(address) : 'Not connected'}</span>
                        </div>

                        <div className="form-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => goToStep('skills')}
                                disabled={mintStage !== 'idle' && mintStage !== 'error' && mintStage !== 'complete'}
                            >
                                Back
                            </button>
                            <button
                                className="btn btn-primary btn-mint"
                                disabled={
                                    !validation.valid ||
                                    mintStage === 'predicting' ||
                                    mintStage === 'uploading' ||
                                    mintStage === 'registering' ||
                                    mintStage === 'complete' ||
                                    isRegistering ||
                                    isConfirming
                                }
                                onClick={handleMint}
                            >
                                {mintStage === 'predicting' ? 'Preparing...' :
                                    mintStage === 'uploading' ? 'Uploading to IPFS...' :
                                        mintStage === 'registering' ? (isConfirming ? 'Confirming...' : 'Registering Agent...') :
                                            mintStage === 'complete' ? 'Registered!' :
                                                'Register Agent'}
                            </button>
                        </div>

                        {/* Progress indicator */}
                        {mintStage !== 'idle' && mintStage !== 'error' && (
                            <div className="mint-progress" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <span style={{ color: mintStage === 'predicting' ? 'var(--primary)' : 'var(--success)' }}>
                                        {mintStage === 'predicting' ? '...' : '✓'} 1. Predict Agent ID
                                    </span>
                                    {predictedAgentId && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(#{predictedAgentId})</span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <span style={{ color: mintStage === 'uploading' ? 'var(--primary)' : ['registering', 'complete'].includes(mintStage) ? 'var(--success)' : 'var(--text-muted)' }}>
                                        {mintStage === 'uploading' ? '...' : ['registering', 'complete'].includes(mintStage) ? '✓' : 'o'} 2. Upload to IPFS (with registrations)
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ color: mintStage === 'registering' ? 'var(--primary)' : mintStage === 'complete' ? 'var(--success)' : 'var(--text-muted)' }}>
                                        {mintStage === 'registering' ? '...' : mintStage === 'complete' ? '✓' : 'o'} 3. Register in Identity Registry
                                    </span>
                                    {hash && (
                                        <a href={`https://sepolia.basescan.org/tx/${hash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                                            View TX
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {stageError && mintStage !== 'complete' && (
                            <p className="error-message" style={{ marginTop: '1rem' }}>
                                {stageError}
                            </p>
                        )}

                        {mintStage === 'complete' && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid var(--success)' }}>
                                <p style={{ color: 'var(--success)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                    ✓ Agent Registered Successfully!
                                </p>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                    Your agent is now live on the ERC-8004 Identity Registry.
                                </p>
                                <ul style={{ fontSize: '0.875rem', marginLeft: '1rem', marginBottom: '1rem' }}>
                                    <li>Agent ID: #{newAgentId}</li>
                                    <li>Meerkat Avatar: #{selectedMeerkat}</li>
                                    <li>Pricing: {isFree ? 'Free' : `$${pricePerMessage} USDC`}</li>
                                </ul>
                                <div>
                                    <Link to="/my-agents" className="btn btn-primary" style={{ marginRight: '0.5rem' }}>
                                        View My Agents
                                    </Link>
                                    <a
                                        href={`https://testnet-legacy.8004scan.io/agents/base-sepolia/${newAgentId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-secondary"
                                    >
                                        View on 8004scan
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="mint-agent">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <Link to="/"><img src="/logo.png" alt="Meerkat Town" className="sidebar-logo" /></Link>
                </div>
                <nav className="sidebar-nav">
                    <Link to="/dashboard" className="sidebar-link">
                        <img src="/icons/planet-svgrepo-com.svg" alt="" className="sidebar-icon" />
                        Explore
                    </Link>
                    <Link to="/mint-agent" className="sidebar-link active">
                        <img src="/icons/plus-svgrepo-com.svg" alt="" className="sidebar-icon" />
                        Mint Agent
                    </Link>
                    <Link to="/my-agents" className="sidebar-link">
                        <img src="/icons/house-chimney-floor-svgrepo-com.svg" alt="" className="sidebar-icon" />
                        My Agents
                    </Link>
                    <Link to="/leaderboard" className="sidebar-link">
                        <img src="/icons/trophy-svgrepo-com.svg" alt="" className="sidebar-icon" />
                        Leaderboard
                    </Link>
                </nav>
                <div className="sidebar-footer">
                    {isConnected && address ? (
                        <div className="wallet-connected">
                            <div className="wallet-info">
                                <span className="wallet-indicator"></span>
                                <span className="wallet-address">{formatAddress(address)}</span>
                            </div>
                        </div>
                    ) : (
                        <button onClick={handleConnect} disabled={isConnectPending} className="btn btn-primary wallet-btn">
                            {isConnectPending ? 'Connecting...' : 'Connect Wallet'}
                        </button>
                    )}
                </div>
            </aside>

            <main className="mint-main">
                <header className="mint-header">
                    <h1 className="heading-3">Register Your Meerkat Agent</h1>
                    <p className="text-muted">
                        {currentStep === 'select' && 'Choose your unique agent avatar'}
                        {currentStep === 'details' && 'Define agent identity and description'}
                        {currentStep === 'skills' && 'Select agent capabilities'}
                        {currentStep === 'preview' && 'Review and register your agent'}
                    </p>
                </header>

                {/* Step indicator */}
                <div className="step-indicator">
                    <div className={`step ${currentStep === 'select' ? 'active' : ''} ${['details', 'skills', 'preview'].includes(currentStep) ? 'completed' : ''}`}>
                        <span className="step-number">1</span>
                        <span className="step-label">Select</span>
                    </div>
                    <div className="step-line"></div>
                    <div className={`step ${currentStep === 'details' ? 'active' : ''} ${['skills', 'preview'].includes(currentStep) ? 'completed' : ''}`}>
                        <span className="step-number">2</span>
                        <span className="step-label">Details</span>
                    </div>
                    <div className="step-line"></div>
                    <div className={`step ${currentStep === 'skills' ? 'active' : ''} ${currentStep === 'preview' ? 'completed' : ''}`}>
                        <span className="step-number">3</span>
                        <span className="step-label">Skills</span>
                    </div>
                    <div className="step-line"></div>
                    <div className={`step ${currentStep === 'preview' ? 'active' : ''}`}>
                        <span className="step-number">4</span>
                        <span className="step-label">Preview</span>
                    </div>
                </div>

                {isConnected && !isCorrectChain && (
                    <div className="notice notice-warning">
                        <span>Please switch to Base Sepolia network</span>
                        <button onClick={handleSwitchToBase} disabled={isSwitching} className="btn btn-primary" style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}>
                            {isSwitching ? 'Switching...' : 'Switch to Base Sepolia'}
                        </button>
                    </div>
                )}

                <section className="agent-selection">
                    {renderStepContent()}
                </section>
                <MobileFooter />
            </main>

            <MobileNav />
        </div>
    );
}

export default MintAgent;
