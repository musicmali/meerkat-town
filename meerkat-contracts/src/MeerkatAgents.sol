// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ============================================================================
// MEERKAT AGENTS NFT
// ============================================================================
// ERC-721 NFT contract for Meerkat AI Agents with:
// - Unique meerkat picture (1-100, expandable)
// - Burn-to-release: burning frees up the meerkat picture for reuse
// - ERC-8004 metadata URI storage
// - Expandable supply: owner can add new batches
// ============================================================================

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MeerkatAgents
 * @notice NFT collection for Meerkat AI Agents
 * @dev Each NFT represents a unique AI agent with a meerkat avatar
 * 
 * KEY FEATURES:
 * - Each meerkat ID (1-100+) can only be used by one agent at a time
 * - When an agent is burned, its meerkat becomes available again
 * - Owner can expand the supply to add new meerkat batches
 * - Stores ERC-8004 compliant metadata URI
 */
contract MeerkatAgents is ERC721, ERC721URIStorage, Ownable {
    
    // ========================================================================
    // STATE VARIABLES
    // ========================================================================
    
    /// @notice Maximum meerkat ID currently available (starts at 100, can expand)
    uint256 public maxMeerkatId = 100;
    
    /// @notice Next token ID to mint
    uint256 private _nextTokenId = 1;
    
    /// @notice Tracks which meerkat IDs are currently in use
    /// @dev meerkatId => isTaken
    mapping(uint256 => bool) public meerkatTaken;
    
    /// @notice Maps token ID to its meerkat ID
    /// @dev tokenId => meerkatId
    mapping(uint256 => uint256) public tokenToMeerkat;
    
    /// @notice Maps meerkat ID to its token ID (for reverse lookup)
    /// @dev meerkatId => tokenId (0 if not minted)
    mapping(uint256 => uint256) public meerkatToToken;
    
    // ========================================================================
    // EVENTS
    // ========================================================================
    
    event AgentMinted(address indexed owner, uint256 indexed tokenId, uint256 indexed meerkatId, string metadataURI);
    event AgentBurned(address indexed owner, uint256 indexed tokenId, uint256 indexed meerkatId);
    event SupplyExpanded(uint256 oldMax, uint256 newMax);
    
    // ========================================================================
    // ERRORS
    // ========================================================================
    
    error MeerkatNotAvailable(uint256 meerkatId);
    error InvalidMeerkatId(uint256 meerkatId);
    error NotTokenOwner(uint256 tokenId);
    error NewMaxMustBeGreater(uint256 currentMax, uint256 newMax);
    
    // ========================================================================
    // CONSTRUCTOR
    // ========================================================================
    
    constructor() ERC721("Meerkat Agents", "MKAT-AGENT") Ownable(msg.sender) {}
    
    // ========================================================================
    // MINTING
    // ========================================================================
    
    /**
     * @notice Mint a new Meerkat Agent NFT
     * @param meerkatId The meerkat picture ID (1 to maxMeerkatId)
     * @param metadataURI ERC-8004 compliant metadata JSON URI
     * @return tokenId The newly minted token ID
     */
    function mintAgent(uint256 meerkatId, string calldata metadataURI) external returns (uint256) {
        // Validate meerkat ID
        if (meerkatId == 0 || meerkatId > maxMeerkatId) {
            revert InvalidMeerkatId(meerkatId);
        }
        
        // Check availability
        if (meerkatTaken[meerkatId]) {
            revert MeerkatNotAvailable(meerkatId);
        }
        
        // Get next token ID
        uint256 tokenId = _nextTokenId++;
        
        // Mark meerkat as taken
        meerkatTaken[meerkatId] = true;
        tokenToMeerkat[tokenId] = meerkatId;
        meerkatToToken[meerkatId] = tokenId;
        
        // Mint the NFT
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        emit AgentMinted(msg.sender, tokenId, meerkatId, metadataURI);
        
        return tokenId;
    }
    
    // ========================================================================
    // BURNING
    // ========================================================================
    
    /**
     * @notice Burn an agent NFT and release its meerkat picture
     * @param tokenId The token ID to burn
     * @dev Only the token owner can burn their agent
     */
    function burnAgent(uint256 tokenId) external {
        // Check ownership
        if (ownerOf(tokenId) != msg.sender) {
            revert NotTokenOwner(tokenId);
        }
        
        // Get the meerkat ID before burning
        uint256 meerkatId = tokenToMeerkat[tokenId];
        
        // Release the meerkat
        meerkatTaken[meerkatId] = false;
        meerkatToToken[meerkatId] = 0;
        
        // Burn the token
        _burn(tokenId);
        
        emit AgentBurned(msg.sender, tokenId, meerkatId);
    }
    
    // ========================================================================
    // SUPPLY EXPANSION (Owner only)
    // ========================================================================
    
    /**
     * @notice Expand the supply to allow more meerkat IDs
     * @param newMax The new maximum meerkat ID
     * @dev Can only increase, never decrease
     */
    function expandSupply(uint256 newMax) external onlyOwner {
        if (newMax <= maxMeerkatId) {
            revert NewMaxMustBeGreater(maxMeerkatId, newMax);
        }
        
        uint256 oldMax = maxMeerkatId;
        maxMeerkatId = newMax;
        
        emit SupplyExpanded(oldMax, newMax);
    }
    
    // ========================================================================
    // VIEW FUNCTIONS
    // ========================================================================
    
    /**
     * @notice Check if a meerkat ID is available for minting
     * @param meerkatId The meerkat ID to check
     * @return available True if the meerkat can be used
     */
    function isMeerkatAvailable(uint256 meerkatId) external view returns (bool available) {
        if (meerkatId == 0 || meerkatId > maxMeerkatId) {
            return false;
        }
        return !meerkatTaken[meerkatId];
    }
    
    /**
     * @notice Get total number of agents currently minted (not burned)
     * @return count Number of active agents
     */
    function totalAgents() external view returns (uint256 count) {
        for (uint256 i = 1; i < _nextTokenId; i++) {
            if (_ownerOf(i) != address(0)) {
                count++;
            }
        }
    }
    
    /**
     * @notice Get total number of available meerkats
     * @return count Number of meerkats not currently in use
     */
    function availableMeerkatCount() external view returns (uint256 count) {
        for (uint256 i = 1; i <= maxMeerkatId; i++) {
            if (!meerkatTaken[i]) {
                count++;
            }
        }
    }
    
    /**
     * @notice Get all available meerkat IDs
     * @return ids Array of available meerkat IDs
     * @dev Warning: Can be gas-intensive for large maxMeerkatId
     */
    function getAvailableMeerkats() external view returns (uint256[] memory ids) {
        // First pass: count available
        uint256 count = 0;
        for (uint256 i = 1; i <= maxMeerkatId; i++) {
            if (!meerkatTaken[i]) {
                count++;
            }
        }
        
        // Second pass: populate array
        ids = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= maxMeerkatId; i++) {
            if (!meerkatTaken[i]) {
                ids[index++] = i;
            }
        }
    }
    
    /**
     * @notice Get agent info for a token
     * @param tokenId The token ID
     * @return meerkatId The meerkat picture ID
     * @return owner The owner address
     * @return metadataURI The ERC-8004 metadata URI
     */
    function getAgentInfo(uint256 tokenId) external view returns (
        uint256 meerkatId,
        address owner,
        string memory metadataURI
    ) {
        owner = ownerOf(tokenId);
        meerkatId = tokenToMeerkat[tokenId];
        metadataURI = tokenURI(tokenId);
    }
    
    // ========================================================================
    // REQUIRED OVERRIDES
    // ========================================================================
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
