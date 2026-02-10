import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { fetchAgentsByOwner, type RegisteredAgent } from '../hooks/useIdentityRegistry';
import { useSetAgentURI } from '../hooks/useERC8004Registries';
import {
    get8004ScanAgentUrl,
    getNetworkName,
    getBlockExplorerTxUrl,
    isX402Supported,
} from '../config/networks';
import { OASF_SKILLS_TAXONOMY, OASF_DOMAINS_TAXONOMY, getItemNameFromSlug } from '../data/oasfTaxonomy';
import { generateAgentMetadata, validateAgentMetadata, getMeerkatImageUrl, getMCPEndpoint, getA2AEndpoint } from '../utils/generateAgentMetadata';
import { uploadToIPFS, storeAgentInDatabase, storeAgentCard } from '../utils/pinata';
import type { AgentFormData } from '../types/agentMetadata';
import OASFSelector from '../components/OASFSelector';
import TopBar from '../components/TopBar';
import MobileNav from '../components/MobileNav';
import MobileFooter from '../components/MobileFooter';
import LoadingSpinner from '../components/LoadingSpinner';
import './MyAgents.css';
import '../pages/Dashboard.css'; // Reuse sidebar styles

// Display order: Base (8453), Ethereum (1), Base Sepolia (84532)
const DISPLAY_CHAIN_ORDER = [8453, 1, 84532] as const;

// Extended agent type that includes the network chainId
interface NetworkAgent extends RegisteredAgent {
    chainId: number;
}

// Update flow stages
type UpdateStage = 'idle' | 'generating' | 'uploading' | 'onchain' | 'database' | 'complete' | 'error';

function MyAgents() {
    const { address, isConnected } = useAccount();
    const { connect, connectors, isPending } = useConnect();
    const { disconnect } = useDisconnect();

    const [agentsByNetwork, setAgentsByNetwork] = useState<Record<number, NetworkAgent[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Details panel state
    const [selectedAgent, setSelectedAgent] = useState<NetworkAgent | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // Edit form state
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editIsFree, setEditIsFree] = useState(true);
    const [editPrice, setEditPrice] = useState('0.001');
    const [editSkills, setEditSkills] = useState<string[]>([]);
    const [editDomains, setEditDomains] = useState<string[]>([]);

    // Update flow state
    const [updateStage, setUpdateStage] = useState<UpdateStage>('idle');
    const [updateError, setUpdateError] = useState('');

    // On-chain update hook
    const {
        setAgentURI,
        hash: updateHash,
        isPending: isUpdatePending,
        isConfirming: isUpdateConfirming,
        isSuccess: isUpdateSuccess,
        error: updateTxError,
    } = useSetAgentURI();

    // Set page title
    useEffect(() => {
        document.title = 'My Agents | Meerkat Town';
    }, []);

    // Fetch agents owned by connected wallet from ALL networks
    useEffect(() => {
        const loadMyAgents = async () => {
            if (!address) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                console.log('Fetching agents owned by:', address, 'from all networks');

                // Fetch from all networks in parallel
                const results = await Promise.all(
                    DISPLAY_CHAIN_ORDER.map(async (networkChainId) => {
                        try {
                            const agents = await fetchAgentsByOwner(address, undefined, networkChainId, 50);
                            // Add chainId to each agent
                            const networkAgents: NetworkAgent[] = agents.map(agent => ({
                                ...agent,
                                chainId: networkChainId,
                            }));
                            return { chainId: networkChainId, agents: networkAgents };
                        } catch (error) {
                            console.error(`Failed to load agents from chain ${networkChainId}:`, error);
                            return { chainId: networkChainId, agents: [] };
                        }
                    })
                );

                // Build map by network
                const byNetwork: Record<number, NetworkAgent[]> = {};
                results.forEach(({ chainId, agents }) => {
                    byNetwork[chainId] = agents;
                    console.log(`Found ${agents.length} agents on ${getNetworkName(chainId)}`);
                });

                setAgentsByNetwork(byNetwork);
            } catch (error) {
                console.error('Failed to load agents:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadMyAgents();
    }, [address]);

    // Handle on-chain update success
    useEffect(() => {
        if (isUpdateSuccess && updateStage === 'onchain') {
            console.log('Agent URI updated on-chain! TX:', updateHash);
            setUpdateStage('database');

            // Fire-and-forget database updates
            if (selectedAgent) {
                const meerkatId = selectedAgent.metadata?.meerkatId || 1;
                const priceValue = editIsFree ? 'Free' : editPrice;

                Promise.all([
                    storeAgentInDatabase({
                        chainId: selectedAgent.chainId,
                        agentId: selectedAgent.agentId,
                        ownerAddress: address || '',
                        meerkatId,
                        name: editName,
                        description: editDescription,
                        image: getMeerkatImageUrl(meerkatId),
                        pricePerMessage: priceValue,
                        x402Support: true,
                        metadata: {
                            skills: editSkills,
                            domains: editDomains,
                        },
                    }),
                    storeAgentCard({
                        meerkatId,
                        name: editName,
                        description: editDescription,
                        image: getMeerkatImageUrl(meerkatId),
                        skills: editSkills,
                        price: editIsFree ? 'Free' : `$${editPrice}`,
                        ownerAddress: address || '',
                    }),
                ]).then(() => {
                    console.log('Database and agent card updated');
                }).catch((err) => {
                    console.warn('Database update failed (non-critical):', err);
                });

                // Update the local agent data
                setAgentsByNetwork(prev => {
                    const updated = { ...prev };
                    const chainAgents = updated[selectedAgent.chainId];
                    if (chainAgents) {
                        updated[selectedAgent.chainId] = chainAgents.map(a => {
                            if (a.agentId === selectedAgent.agentId) {
                                return {
                                    ...a,
                                    metadata: a.metadata ? {
                                        ...a.metadata,
                                        name: editName,
                                        description: editDescription,
                                        pricePerMessage: priceValue,
                                    } : null,
                                };
                            }
                            return a;
                        });
                    }
                    return updated;
                });

                // Update selectedAgent too
                setSelectedAgent(prev => prev ? {
                    ...prev,
                    metadata: prev.metadata ? {
                        ...prev.metadata,
                        name: editName,
                        description: editDescription,
                        pricePerMessage: priceValue,
                    } : null,
                } : null);
            }

            setUpdateStage('complete');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isUpdateSuccess, updateStage]);

    // Handle on-chain update error
    useEffect(() => {
        if (updateTxError && updateStage === 'onchain') {
            console.error('On-chain update failed:', updateTxError);
            setUpdateError(updateTxError.message.includes('User rejected')
                ? 'Transaction cancelled'
                : `Update failed: ${updateTxError.message}`);
            setUpdateStage('error');
        }
    }, [updateTxError, updateStage]);

    // Check if agent has registrations
    const hasRegistrations = (agent: RegisteredAgent): boolean => {
        return !!(agent.metadata?.registrations && agent.metadata.registrations.length > 0);
    };

    const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    const handleConnect = () => {
        const connector = connectors[0];
        if (connector) {
            connect({ connector });
        }
    };

    // Open details for an agent (data comes from database)
    const handleShowDetails = (agent: NetworkAgent) => {
        setSelectedAgent(agent);
        setIsEditMode(false);
        setUpdateStage('idle');
        setUpdateError('');
    };

    // Enter edit mode with current values pre-populated from database
    const handleEnterEdit = useCallback(() => {
        if (!selectedAgent?.metadata) return;
        const meta = selectedAgent.metadata;

        setEditName(meta.name || '');
        setEditDescription(meta.description || '');

        const price = meta.pricePerMessage || 'Free';
        const free = price === 'Free' || price === '0';
        setEditIsFree(free);
        setEditPrice(free ? '0.001' : price);

        // Skills/domains from database metadata (stored at top level from JSONB spread)
        const metaAny = meta as unknown as Record<string, unknown>;
        setEditSkills(Array.isArray(metaAny.skills) ? metaAny.skills as string[] : []);
        setEditDomains(Array.isArray(metaAny.domains) ? metaAny.domains as string[] : []);

        setIsEditMode(true);
        setUpdateStage('idle');
        setUpdateError('');
    }, [selectedAgent]);

    // Cancel edit
    const handleCancelEdit = () => {
        setIsEditMode(false);
        setUpdateStage('idle');
        setUpdateError('');
    };

    // Build edit form data for validation
    const getEditFormData = useCallback((): AgentFormData | null => {
        if (!selectedAgent?.metadata) return null;
        return {
            meerkatNumber: selectedAgent.metadata.meerkatId || 1,
            name: editName,
            description: editDescription,
            skills: editSkills,
            domains: editDomains,
            ownerAddress: address || '',
            pricePerMessage: editIsFree ? '0' : editPrice,
        };
    }, [selectedAgent, editName, editDescription, editSkills, editDomains, address, editIsFree, editPrice]);

    // Validate edit form
    const getEditValidation = useCallback(() => {
        const formData = getEditFormData();
        if (!formData) return { valid: false, errors: ['No agent selected'] };
        const metadata = generateAgentMetadata(formData, selectedAgent?.agentId, selectedAgent?.chainId);
        return validateAgentMetadata(metadata);
    }, [getEditFormData, selectedAgent]);

    // Handle save changes
    const handleSaveChanges = async () => {
        if (!selectedAgent?.metadata) return;

        const formData = getEditFormData();
        if (!formData) return;

        try {
            setUpdateError('');

            // Stage 1: Generate metadata
            setUpdateStage('generating');
            const newMetadata = generateAgentMetadata(formData, selectedAgent.agentId, selectedAgent.chainId);
            const validation = validateAgentMetadata(newMetadata);
            if (!validation.valid) {
                setUpdateError(validation.errors.join(', '));
                setUpdateStage('error');
                return;
            }

            // Stage 2: Upload to IPFS
            setUpdateStage('uploading');
            const meerkatId = selectedAgent.metadata.meerkatId || 1;
            const result = await uploadToIPFS(newMetadata, `meerkat-agent-${meerkatId}-updated`);
            console.log('Updated metadata uploaded to IPFS:', result.ipfsUri);

            // Stage 3: Update on-chain
            setUpdateStage('onchain');
            setAgentURI(selectedAgent.agentId, result.ipfsUri);
            // The rest is handled by the useEffect watching isUpdateSuccess

        } catch (err) {
            console.error('Update failed:', err);
            setUpdateError('Failed to update agent. Please try again.');
            setUpdateStage('error');
        }
    };

    // Get resolved skill/domain names from an agent's metadata
    const getOASFNames = (slugs: string[], type: 'skills' | 'domains'): string[] => {
        const taxonomy = type === 'skills' ? OASF_SKILLS_TAXONOMY : OASF_DOMAINS_TAXONOMY;
        return slugs.map(slug => getItemNameFromSlug(slug, taxonomy) || slug.split('/').pop()?.replace(/_/g, ' ') || slug);
    };

    // Render the details/edit panel for selected agent
    const renderDetailsPanel = () => {
        if (!selectedAgent) return null;

        const meta = selectedAgent.metadata;
        if (!meta) return null;

        const meerkatId = meta.meerkatId || 1;
        const meerkatAgentId = `meerkat-${meerkatId}`;

        // Compute endpoints from meerkatId (predictable pattern)
        const mcpEndpoint = getMCPEndpoint(meerkatAgentId);
        const a2aEndpoint = getA2AEndpoint(meerkatAgentId);

        // Skills/domains: read from database metadata (stored at top level from JSONB spread)
        const dbMeta = meta as unknown as Record<string, unknown>;
        const displaySkills: string[] = Array.isArray(dbMeta.skills) ? dbMeta.skills as string[] : [];
        const displayDomains: string[] = Array.isArray(dbMeta.domains) ? dbMeta.domains as string[] : [];
        const pricePerMessage = meta.pricePerMessage || 'Free';
        const isFree = pricePerMessage === 'Free' || pricePerMessage === '0';
        const x402Supported = isX402Supported(selectedAgent.chainId);

        const editValidation = isEditMode ? getEditValidation() : null;

        return (
            <div className="agent-details-panel">
                <button
                    className="details-back-link"
                    onClick={() => { setSelectedAgent(null); setIsEditMode(false); }}
                >
                    &#8592; Back to list
                </button>

                {/* Header */}
                <div className="agent-details-header">
                    <img
                        src={`/meerkats/meerkat_${meerkatId.toString().padStart(3, '0')}.png`}
                        alt={meta.name}
                        className="details-avatar"
                    />
                    <div className="details-header-info">
                        <h2>{meta.name || `Meerkat Agent #${meerkatId}`}</h2>
                        <div className="details-agent-ids">
                            <span>Agent #{selectedAgent.agentId}</span>
                            <span>Meerkat #{meerkatId}</span>
                            <span>{getNetworkName(selectedAgent.chainId)}</span>
                        </div>
                        <p className="details-description">{meta.description || 'No description.'}</p>
                    </div>
                </div>

                {/* Capabilities */}
                <div className="agent-details-capabilities">
                    <h3>Capabilities</h3>
                    <div className="capabilities-grid">
                        <div className="capability-item">
                            <div className="capability-label">MCP Endpoint</div>
                            <div className="capability-value">
                                <a href={mcpEndpoint} target="_blank" rel="noopener noreferrer">
                                    {mcpEndpoint}
                                </a>
                            </div>
                        </div>
                        <div className="capability-item">
                            <div className="capability-label">A2A Endpoint</div>
                            <div className="capability-value">
                                <a href={a2aEndpoint} target="_blank" rel="noopener noreferrer">
                                    {a2aEndpoint}
                                </a>
                            </div>
                        </div>
                        {displaySkills.length > 0 && (
                            <div className="capability-item">
                                <div className="capability-label">OASF Skills</div>
                                <div className="capability-tags">
                                    {getOASFNames(displaySkills, 'skills').map((name, i) => (
                                        <span key={i} className="capability-tag">{name}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {displayDomains.length > 0 && (
                            <div className="capability-item">
                                <div className="capability-label">OASF Domains</div>
                                <div className="capability-tags">
                                    {getOASFNames(displayDomains, 'domains').map((name, i) => (
                                        <span key={i} className="capability-tag">{name}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Agent Info */}
                <div className="agent-details-info">
                    <h3>Agent Info</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Price per Message</span>
                            <span className="info-value">{isFree ? 'Free' : `$${pricePerMessage} USDC`}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">x402 Support</span>
                            <span className="info-value">{meta.x402support ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Owner</span>
                            <span className="info-value">{selectedAgent.owner}</span>
                        </div>
                        {meta.registrations && meta.registrations.length > 0 && (
                            <div className="info-item">
                                <span className="info-label">Registrations</span>
                                <span className="info-value">
                                    {meta.registrations.map((r, i) => (
                                        <span key={i}>{r.agentRegistry} (Agent #{r.agentId}){i < meta.registrations!.length - 1 ? ', ' : ''}</span>
                                    ))}
                                </span>
                            </div>
                        )}
                        {meta.updatedAt && (
                            <div className="info-item">
                                <span className="info-label">Last Updated</span>
                                <span className="info-value">{new Date(meta.updatedAt * 1000).toLocaleString()}</span>
                            </div>
                        )}
                        {selectedAgent.metadataUri && (
                            <div className="info-item">
                                <span className="info-label">Metadata URI</span>
                                <span className="info-value">
                                    <a
                                        href={selectedAgent.metadataUri.startsWith('ipfs://')
                                            ? `https://gateway.pinata.cloud/ipfs/${selectedAgent.metadataUri.replace('ipfs://', '')}`
                                            : selectedAgent.metadataUri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {selectedAgent.metadataUri.length > 60
                                            ? selectedAgent.metadataUri.slice(0, 60) + '...'
                                            : selectedAgent.metadataUri}
                                    </a>
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {!isEditMode && (
                    <div className="details-actions">
                        <button className="btn btn-primary" onClick={handleEnterEdit}>
                            Edit Agent
                        </button>
                        <Link
                            to={`/chat/${selectedAgent.agentId}?chain=${selectedAgent.chainId}`}
                            className="btn btn-secondary"
                        >
                            Chat
                        </Link>
                        <a
                            href={get8004ScanAgentUrl(selectedAgent.chainId, selectedAgent.agentId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                        >
                            View on 8004scan
                        </a>
                    </div>
                )}

                {/* Edit Form */}
                {isEditMode && (
                    <div className="agent-edit-form">
                        <h3>Edit Agent</h3>

                        {/* Validation errors */}
                        {editValidation && !editValidation.valid && (
                            <div className="edit-validation-errors">
                                {editValidation.errors.map((err, i) => (
                                    <p key={i}>{err}</p>
                                ))}
                            </div>
                        )}

                        <div className="edit-form-group">
                            <label>Agent Name</label>
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                maxLength={200}
                                placeholder="e.g., CryptoAnalyst Pro"
                            />
                            <div className="edit-form-hint">{editName.length}/200 characters (min 3)</div>
                        </div>

                        <div className="edit-form-group">
                            <label>Description</label>
                            <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                maxLength={500}
                                rows={4}
                                placeholder="Describe what your agent does..."
                            />
                            <div className="edit-form-hint">{editDescription.length}/500 characters (min 50)</div>
                        </div>

                        <div className="edit-form-group">
                            <label>Pricing</label>
                            <div className="edit-pricing-toggle">
                                <button
                                    className={editIsFree ? 'active' : ''}
                                    onClick={() => setEditIsFree(true)}
                                >
                                    Free
                                </button>
                                <button
                                    className={!editIsFree ? 'active' : ''}
                                    onClick={() => setEditIsFree(false)}
                                    disabled={!x402Supported}
                                    title={!x402Supported ? 'x402 payments require Base or Base Sepolia' : ''}
                                >
                                    Paid (x402)
                                </button>
                            </div>
                            {!editIsFree && (
                                <div className="edit-price-input-wrapper">
                                    <input
                                        type="number"
                                        value={editPrice}
                                        onChange={(e) => setEditPrice(e.target.value)}
                                        min="0.0001"
                                        step="0.0001"
                                        placeholder="0.001"
                                    />
                                    <span className="edit-price-currency">USDC per message</span>
                                </div>
                            )}
                        </div>

                        <div className="edit-form-group">
                            <label>Skills</label>
                            <OASFSelector
                                type="skills"
                                taxonomy={OASF_SKILLS_TAXONOMY}
                                selectedSlugs={editSkills}
                                onSelectionChange={setEditSkills}
                                maxSelections={5}
                            />
                        </div>

                        <div className="edit-form-group">
                            <label>Domains</label>
                            <OASFSelector
                                type="domains"
                                taxonomy={OASF_DOMAINS_TAXONOMY}
                                selectedSlugs={editDomains}
                                onSelectionChange={setEditDomains}
                                maxSelections={5}
                            />
                        </div>

                        {/* Update progress */}
                        {updateStage !== 'idle' && updateStage !== 'error' && (
                            <div className="update-progress">
                                <div className={`update-progress-step ${updateStage === 'generating' ? 'active' : ['uploading', 'onchain', 'database', 'complete'].includes(updateStage) ? 'done' : 'pending'}`}>
                                    {updateStage === 'generating' ? <LoadingSpinner size="tiny" /> : ['uploading', 'onchain', 'database', 'complete'].includes(updateStage) ? '✓' : 'o'}{' '}
                                    1. Generating metadata...
                                </div>
                                <div className={`update-progress-step ${updateStage === 'uploading' ? 'active' : ['onchain', 'database', 'complete'].includes(updateStage) ? 'done' : 'pending'}`}>
                                    {updateStage === 'uploading' ? <LoadingSpinner size="tiny" /> : ['onchain', 'database', 'complete'].includes(updateStage) ? '✓' : 'o'}{' '}
                                    2. Uploading to IPFS...
                                </div>
                                <div className={`update-progress-step ${updateStage === 'onchain' ? 'active' : ['database', 'complete'].includes(updateStage) ? 'done' : 'pending'}`}>
                                    {updateStage === 'onchain' ? <LoadingSpinner size="tiny" /> : ['database', 'complete'].includes(updateStage) ? '✓' : 'o'}{' '}
                                    3. Updating on-chain...
                                    {updateHash && (
                                        <a
                                            href={getBlockExplorerTxUrl(selectedAgent.chainId, updateHash)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ fontSize: '0.75rem', color: 'var(--primary)', marginLeft: '0.5rem' }}
                                        >
                                            View TX
                                        </a>
                                    )}
                                </div>
                                <div className={`update-progress-step ${updateStage === 'database' ? 'active' : updateStage === 'complete' ? 'done' : 'pending'}`}>
                                    {updateStage === 'database' ? <LoadingSpinner size="tiny" /> : updateStage === 'complete' ? '✓' : 'o'}{' '}
                                    4. Updating database...
                                </div>
                            </div>
                        )}

                        {/* Success message */}
                        {updateStage === 'complete' && (
                            <div className="update-success">
                                <p>Agent updated successfully!</p>
                                {updateHash && (
                                    <a
                                        href={getBlockExplorerTxUrl(selectedAgent.chainId, updateHash)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View transaction
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Error message */}
                        {updateError && updateStage === 'error' && (
                            <p className="error-message" style={{ marginTop: 'var(--space-4)' }}>
                                {updateError}
                            </p>
                        )}

                        {/* Edit actions */}
                        <div className="edit-form-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={handleCancelEdit}
                                disabled={updateStage === 'generating' || updateStage === 'uploading' || updateStage === 'onchain' || updateStage === 'database'}
                            >
                                {updateStage === 'complete' ? 'Done' : 'Cancel'}
                            </button>
                            {updateStage !== 'complete' && (
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSaveChanges}
                                    disabled={
                                        !editValidation?.valid ||
                                        updateStage === 'generating' ||
                                        updateStage === 'uploading' ||
                                        updateStage === 'onchain' ||
                                        updateStage === 'database' ||
                                        isUpdatePending ||
                                        isUpdateConfirming
                                    }
                                >
                                    {updateStage === 'generating' ? 'Generating...' :
                                        updateStage === 'uploading' ? 'Uploading...' :
                                        updateStage === 'onchain' ? (isUpdateConfirming ? 'Confirming...' : 'Updating...') :
                                        updateStage === 'database' ? 'Finalizing...' :
                                        'Save Changes'}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="dashboard">
            {/* Sidebar - same as Dashboard */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <Link to="/">
                        <img src="/logo.png" alt="Meerkat Town" className="sidebar-logo" />
                    </Link>
                </div>

                <nav className="sidebar-nav">
                    <Link to="/dashboard" className="sidebar-link">
                        <img src="/icons/planet-svgrepo-com.svg" alt="" className="sidebar-icon" />
                        Explore
                    </Link>
                    <Link to="/mint-agent" className="sidebar-link">
                        <img src="/icons/plus-svgrepo-com.svg" alt="" className="sidebar-icon" />
                        Mint Agent
                    </Link>
                    <Link to="/my-agents" className="sidebar-link active">
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
                            <button onClick={() => disconnect()} className="btn btn-secondary wallet-btn">
                                Disconnect
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleConnect}
                            disabled={isPending}
                            className="btn btn-primary wallet-btn"
                        >
                            {isPending ? 'Connecting...' : 'Connect Wallet'}
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div>
                        <h1 className="heading-3">My Agents</h1>
                        <p className="text-muted">Your registered Meerkat agents on ERC-8004</p>
                    </div>
                    <TopBar />
                </header>

                {!isConnected ? (
                    <div className="empty-state">
                        <span className="empty-icon">&#128279;</span>
                        <h2>Connect Your Wallet</h2>
                        <p>Please connect your wallet to view your agents.</p>
                    </div>
                ) : isLoading ? (
                    <div className="loading-state">
                        <LoadingSpinner size="large" text="Loading your agents from all networks..." />
                    </div>
                ) : Object.values(agentsByNetwork).flat().length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">&#129441;</span>
                        <h2>No Agents Yet</h2>
                        <p>You haven't registered any agents yet.</p>
                        <Link to="/mint-agent" className="btn btn-primary">Register Your First Agent</Link>
                    </div>
                ) : (
                    <>
                        {/* Details Panel (shown when agent selected) */}
                        {selectedAgent && renderDetailsPanel()}

                        {/* Agents List - Grouped by Network */}
                        {DISPLAY_CHAIN_ORDER.map((networkChainId) => {
                            const networkAgents = agentsByNetwork[networkChainId] || [];
                            if (networkAgents.length === 0) return null;

                            return (
                                <div key={networkChainId} className="network-section">
                                    <h3 className="network-title">{getNetworkName(networkChainId)}</h3>
                                    <div className="agents-list">
                                        {networkAgents.map(agent => {
                                            const meerkatId = agent.metadata?.meerkatId || 1;
                                            const name = agent.metadata?.name || `Meerkat Agent #${meerkatId}`;
                                            const description = agent.metadata?.description || 'A unique Meerkat Agent.';
                                            const pricePerMessage = agent.metadata?.pricePerMessage || 'Free';
                                            const agentIsFree = pricePerMessage === 'Free' || pricePerMessage === '0';
                                            const isSelected = selectedAgent?.agentId === agent.agentId && selectedAgent?.chainId === agent.chainId;

                                            return (
                                                <div
                                                    key={`${agent.chainId}-${agent.agentId}`}
                                                    className="agent-row"
                                                    style={isSelected ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 1px var(--primary)' } : undefined}
                                                >
                                                    <img
                                                        src={`/meerkats/meerkat_${meerkatId.toString().padStart(3, '0')}.png`}
                                                        alt={name}
                                                        className="agent-thumb"
                                                    />

                                                    <div className="agent-info">
                                                        <div className="agent-main">
                                                            <h3>{name}</h3>
                                                            <span className="agent-id">Agent #{agent.agentId} | Meerkat #{meerkatId}</span>
                                                        </div>
                                                        <p className="agent-desc">{description}</p>
                                                        <div className="agent-meta">
                                                            <span className="meta-item">
                                                                {agentIsFree ? 'Free to chat' : `$${pricePerMessage}/msg`}
                                                            </span>
                                                            <span className="meta-item">
                                                                x402: {agent.metadata?.x402support ? 'Enabled' : 'Disabled'}
                                                            </span>
                                                            <span className="meta-item" style={{ color: hasRegistrations(agent) ? 'var(--success)' : 'var(--text-muted)' }}>
                                                                Registrations: {hasRegistrations(agent) ? 'OK' : 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="agent-actions">
                                                        <button
                                                            onClick={() => handleShowDetails(agent)}
                                                            className="btn btn-primary btn-sm"
                                                        >
                                                            Details
                                                        </button>
                                                        <Link to={`/chat/${agent.agentId}?chain=${agent.chainId}`} className="btn btn-secondary btn-sm">
                                                            Chat
                                                        </Link>
                                                        <a
                                                            href={get8004ScanAgentUrl(agent.chainId, agent.agentId)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-secondary btn-sm"
                                                        >
                                                            8004scan
                                                        </a>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
                <MobileFooter />
            </main>

            <MobileNav />
        </div>
    );
}

export default MyAgents;
