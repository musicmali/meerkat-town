// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ============================================================================
// MKAT TOKEN
// ============================================================================
// Native token for the Meerkat Agents ecosystem.
// Simple ERC-20 for stealth launch - can add features later.
// ============================================================================

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MeerkatToken ($MKAT)
 * @notice Native token for the Meerkat AI Agents marketplace
 * @dev Simple ERC-20 with fixed supply - perfect for stealth launch
 * 
 * TOKENOMICS:
 * - Total Supply: 1,000,000,000 (1 billion)
 * - Decimals: 18 (standard)
 * - No mint function after deployment (fixed supply)
 * - Distribution: All tokens to deployer, distribute as needed
 * 
 * FUTURE USE CASES:
 * - Agent registration fees
 * - Premium features
 * - Staking for reputation boost
 * - Governance votes
 */
contract MeerkatToken is ERC20, Ownable {
    
    // ========================================================================
    // CONSTANTS
    // ========================================================================
    
    /// @notice Total supply: 1 billion tokens
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;
    
    // ========================================================================
    // CONSTRUCTOR
    // ========================================================================
    
    /**
     * @notice Deploy the MKAT token
     * @dev Mints entire supply to the deployer
     * 
     * Deployer can then:
     * - Add liquidity to DEX (Uniswap, Aerodrome on Base)
     * - Send to team/treasury wallets
     * - Set up vesting contracts
     * - Airdrop to early users
     */
    constructor() ERC20("Meerkat", "MKAT") Ownable(msg.sender) {
        _mint(msg.sender, TOTAL_SUPPLY);
    }
    
    // ========================================================================
    // VIEW FUNCTIONS
    // ========================================================================
    
    /**
     * @notice Get circulating supply (total - burned)
     * @dev Tokens sent to address(0) are considered burned
     */
    function circulatingSupply() external view returns (uint256) {
        return totalSupply() - balanceOf(address(0));
    }
}
