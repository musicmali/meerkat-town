import { useState, useCallback, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useConnect, useChainId, useSwitchChain, usePublicClient } from 'wagmi';
import { OASF_SKILLS_TAXONOMY, OASF_DOMAINS_TAXONOMY } from '../data/oasfTaxonomy';
import OASFSelector from '../components/OASFSelector';
import type { AgentFormData } from '../types/agentMetadata';
import { generateAgentMetadata, formatMetadataJSON, validateAgentMetadata, getMeerkatImageUrl } from '../utils/generateAgentMetadata';
import { useRegisterAgent } from '../hooks/useERC8004Registries';
import { predictNextAgentId, fetchMeerkatAgents } from '../hooks/useIdentityRegistry';
import { uploadToIPFS, storeAgentCard, storeAgentInDatabase } from '../utils/pinata';
import {
    isSupportedNetwork,
    isX402Supported,
    getNetworkName,
    get8004ScanAgentUrl,
} from '../config/networks';
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

// Get image path for a meerkat number (full size ~700KB)
const getMeerkatImage = (num: number): string => {
    const padded = num.toString().padStart(3, '0');
    return `/meerkats/meerkat_${padded}.png`;
};

// Get thumbnail path for a meerkat number (smaller ~40KB for fast loading)
const getMeerkatThumb = (num: number): string => {
    const padded = num.toString().padStart(3, '0');
    return `/meerkats-thumb/meerkat_${padded}.png`;
};

// Form steps
type FormStep = 'select' | 'details' | 'skills' | 'preview';

// Minting stages (simplified - URI updates not supported by this registry)
type MintStage = 'idle' | 'predicting' | 'uploading' | 'registering' | 'complete' | 'error';

// Minting control flag (set to true to disable minting)
const MINTING_DISABLED = false;
const MINTING_DISABLED_MESSAGE = "Minting is temporarily paused. Please check back soon!";

function MintAgent() {
    const { address, isConnected } = useAccount();
    const { connect, connectors, isPending: isConnectPending } = useConnect();
    const chainId = useChainId();
    const { switchChain, isPending: isSwitching } = useSwitchChain();
    const isCorrectChain = isSupportedNetwork(chainId);
    const x402Supported = isX402Supported(chainId);
    const publicClient = usePublicClient({ chainId });

    // Current step
    const [currentStep, setCurrentStep] = useState<FormStep>('select');

    // Used meerkat tracking - fetch from blockchain
    const [usedMeerkatIds, setUsedMeerkatIds] = useState<Set<number>>(new Set());
    const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);

    // Track if user already owns a Meerkat agent (1 mint per wallet limit)
    const [userOwnedAgent, setUserOwnedAgent] = useState<{ id: number; name: string } | null>(null);

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

    // Fetch used meerkat IDs on mount and check if user already owns an agent
    useEffect(() => {
        async function fetchUsedMeerkats() {
            setIsLoadingAvailability(true);
            setUserOwnedAgent(null); // Reset on network/address change
            try {
                const agents = await fetchMeerkatAgents(publicClient, chainId);
                const usedIds = agents
                    .map(a => a.metadata?.meerkatId)
                    .filter((id): id is number => id !== undefined && id >= 1 && id <= 100);
                // Combine blockchain-detected IDs with manually excluded IDs
                const allUsedIds = [...usedIds, ...MANUALLY_USED_MEERKAT_IDS];
                console.log('Used meerkat IDs:', allUsedIds);
                setUsedMeerkatIds(new Set(allUsedIds));

                // Check if connected wallet already owns a Meerkat agent
                if (address) {
                    const ownedAgent = agents.find(
                        a => a.owner.toLowerCase() === address.toLowerCase()
                    );
                    if (ownedAgent) {
                        console.log('User already owns agent:', ownedAgent.agentId, ownedAgent.metadata?.name);
                        setUserOwnedAgent({
                            id: ownedAgent.agentId,
                            name: ownedAgent.metadata?.name || `Agent #${ownedAgent.agentId}`,
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch used meerkats:', error);
            } finally {
                setIsLoadingAvailability(false);
            }
        }
        if (publicClient) {
            fetchUsedMeerkats();
        }
    }, [publicClient, chainId, address]);

    // Set initial random meerkat once availability is loaded
    useEffect(() => {
        if (!isLoadingAvailability && availableMeerkats.length > 0) {
            setSelectedMeerkat(getRandomMeerkat(availableMeerkats));

            // Preload all available meerkat images for smooth experience
            availableMeerkats.forEach(num => {
                // Preload thumbnail (for fast shuffle animation)
                const thumb = new Image();
                thumb.src = getMeerkatThumb(num);

                // Preload full image (for when shuffle stops)
                const full = new Image();
                full.src = getMeerkatImage(num);
            });
            console.log(`[MintAgent] Preloading ${availableMeerkats.length} meerkat thumbnails + full images`);
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
    const [uploadedMetadataUri, setUploadedMetadataUri] = useState<string | null>(null);

    // Handle registration success
    useEffect(() => {
        if (isSuccess && mintStage === 'registering') {
            console.log('Agent registered in Identity Registry! TX:', hash);
            const agentId = getAgentIdFromReceipt();
            const finalAgentId = (agentId !== null && Number(agentId) > 0)
                ? Number(agentId)
                : predictedAgentId;

            if (finalAgentId) {
                console.log('Final Agent ID:', finalAgentId);
                setNewAgentId(finalAgentId);

                // Store agent in database for fast listing (non-blocking)
                const formData = getFormData();
                storeAgentInDatabase({
                    chainId,
                    agentId: finalAgentId,
                    ownerAddress: address || '',
                    metadataUri: uploadedMetadataUri || undefined,
                    meerkatId: selectedMeerkat,
                    name: formData.name,
                    description: formData.description,
                    image: getMeerkatImageUrl(selectedMeerkat),
                    pricePerMessage: formData.pricePerMessage === '0' ? 'Free' : formData.pricePerMessage,
                    x402Support: true,
                    metadata: {
                        skills: formData.skills,
                        domains: formData.domains,
                    },
                }).then(() => {
                    console.log('Agent stored in database for fast listing');
                }).catch((err) => {
                    console.warn('Failed to store agent in database (non-critical):', err);
                });
            }
            setMintStage('complete');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSuccess, mintStage, hash, getAgentIdFromReceipt, predictedAgentId, chainId, address, selectedMeerkat, uploadedMetadataUri]);

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
        }, 150); // 150ms between each image (slower for visibility)
    }, [availableMeerkats]);

    const handleConnect = () => {
        const connector = connectors[0];
        if (connector) {
            connect({ connector });
        }
    };

    // Network switching is now handled by NetworkSwitcher in header
    // This is kept for the notice button
    const handleSwitchToSupported = () => {
        // Switch to Base Sepolia as default supported network
        switchChain({ chainId: 84532 });
    };

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    // Step navigation
    const goToStep = (step: FormStep) => setCurrentStep(step);

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

    const metadata = generateAgentMetadata(getFormData(), undefined, chainId);
    const validation = validateAgentMetadata(metadata);

    // Handle minting
    const handleMint = async () => {
        try {
            setStageError('');

            // Step 0: Check IP eligibility (1 mint per IP)
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
            try {
                const eligibilityResponse = await fetch(`${BACKEND_URL}/api/check-mint-eligibility`);
                const eligibility = await eligibilityResponse.json();
                if (!eligibility.eligible) {
                    setStageError(`This network has already minted Meerkat #${eligibility.meerkatId}. One mint per IP address.`);
                    setMintStage('error');
                    return;
                }
            } catch (eligibilityErr) {
                console.warn('Could not check IP eligibility, proceeding:', eligibilityErr);
                // Continue if eligibility check fails - don't block users due to backend issues
            }

            // Step 1: Predict the next agent ID
            setMintStage('predicting');
            console.log('Predicting next agent ID...');
            const nextId = await predictNextAgentId(publicClient, chainId);
            console.log('Predicted next agent ID:', nextId);
            setPredictedAgentId(nextId);

            // Step 2: Generate metadata WITH registrations (using predicted ID)
            setMintStage('uploading');
            const metadataWithRegistrations = generateAgentMetadata(getFormData(), nextId, chainId);
            console.log('Generated metadata with registrations:', metadataWithRegistrations);

            // Step 3: Upload metadata to IPFS
            const result = await uploadToIPFS(
                metadataWithRegistrations,
                `meerkat-agent-${selectedMeerkat}`
            );
            console.log('Metadata uploaded to IPFS:', result.ipfsUri);
            setUploadedMetadataUri(result.ipfsUri);

            // Step 4: Store A2A agent card in database (non-blocking)
            const formData = getFormData();
            try {
                await storeAgentCard({
                    meerkatId: selectedMeerkat,
                    name: formData.name,
                    description: formData.description,
                    image: getMeerkatImageUrl(selectedMeerkat),
                    skills: formData.skills,
                    price: formData.pricePerMessage || '$0.001',
                    ownerAddress: formData.ownerAddress,
                });
                console.log('Agent card stored in database');
            } catch (cardErr) {
                // Don't fail minting if agent card storage fails
                console.warn('Failed to store agent card (non-critical):', cardErr);
            }

            // Step 5: Register in ERC-8004 Identity Registry
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
                // Show minting disabled message
                if (MINTING_DISABLED) {
                    return (
                        <div className="selection-card">
                            <div className="agent-selection-info">
                                <h2 className="agent-title" style={{ color: 'var(--warning, #f59e0b)' }}>Minting Paused</h2>
                                <p className="agent-subtitle">
                                    {MINTING_DISABLED_MESSAGE}
                                </p>
                                <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                                    Explore Existing Agents
                                </Link>
                            </div>
                        </div>
                    );
                }

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

                // Show message if user already owns a Meerkat agent (1 per wallet limit)
                if (userOwnedAgent && isConnected) {
                    return (
                        <div className="selection-card">
                            <div className="agent-selection-info">
                                <h2 className="agent-title">You Already Own a Meerkat!</h2>
                                <p className="agent-subtitle">
                                    Each wallet can only mint one Meerkat agent. You already own <strong>{userOwnedAgent.name}</strong>.
                                </p>
                                <div className="selection-actions" style={{ flexDirection: 'column', gap: '0.75rem' }}>
                                    <Link to="/my-agents" className="btn btn-primary" style={{ width: '100%' }}>
                                        View My Agents
                                    </Link>
                                    <a
                                        href={get8004ScanAgentUrl(chainId, userOwnedAgent.id)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-secondary"
                                        style={{ width: '100%' }}
                                    >
                                        View on 8004scan
                                    </a>
                                </div>
                            </div>
                        </div>
                    );
                }

                return (
                    <div className="selection-card">
                        <div className={`agent-image-container ${isShuffling ? 'shuffling' : ''}`}>
                            <img
                                src={isShuffling ? getMeerkatThumb(selectedMeerkat) : getMeerkatImage(selectedMeerkat)}
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
                                    disabled={!x402Supported}
                                    title={!x402Supported ? 'x402 payments require Base Sepolia' : ''}
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
                                {!x402Supported
                                    ? 'x402 payments not available on this network. Switch to Base Sepolia for paid agents.'
                                    : isFree
                                        ? 'Anyone can chat with your agent for free (x402 still enabled for future features)'
                                        : `Users pay $${pricePerMessage} USDC per message via x402`}
                            </span>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Payment Wallet</label>
                            <div className="wallet-display">
                                <span className="wallet-badge">{address ? formatAddress(address) : 'Not connected'}</span>
                                <span className="wallet-network">{getNetworkName(chainId)}</span>
                            </div>
                            <span className="form-hint">
                                {x402Supported
                                    ? 'x402 payments will be sent to this address'
                                    : 'x402 not supported on this network. Minting still works, but paid chat requires Base Sepolia.'}
                            </span>
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
                return (
                    <div className="form-card skills-card">
                        <div className="form-header">
                            <img src={getMeerkatImage(selectedMeerkat)} alt="Selected Meerkat" className="form-avatar" />
                            <div>
                                <h2 className="form-title">Skills & Domains</h2>
                                <p className="form-subtitle">Select capabilities (max 5 each)</p>
                            </div>
                        </div>

                        <OASFSelector
                            type="skills"
                            taxonomy={OASF_SKILLS_TAXONOMY}
                            selectedSlugs={selectedSkills}
                            onSelectionChange={setSelectedSkills}
                            maxSelections={5}
                        />

                        <OASFSelector
                            type="domains"
                            taxonomy={OASF_DOMAINS_TAXONOMY}
                            selectedSlugs={selectedDomains}
                            onSelectionChange={setSelectedDomains}
                            maxSelections={5}
                        />

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

                        {userOwnedAgent && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid #ef4444' }}>
                                <p style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                                    1 Agent Per Wallet Limit
                                </p>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    You already own <strong>{userOwnedAgent.name}</strong>. Each wallet can only mint one Meerkat agent.
                                </p>
                            </div>
                        )}

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
                                    isConfirming ||
                                    userOwnedAgent !== null
                                }
                                onClick={handleMint}
                            >
                                {userOwnedAgent ? 'Already Own an Agent' :
                                    mintStage === 'predicting' ? 'Preparing...' :
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
                                        href={get8004ScanAgentUrl(chainId, newAgentId || 0)}
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
                        <span>Please switch to a supported network (Ethereum or Base Sepolia)</span>
                        <button onClick={handleSwitchToSupported} disabled={isSwitching} className="btn btn-primary" style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}>
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
