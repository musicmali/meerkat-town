// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {MeerkatAgents} from "../src/MeerkatAgents.sol";

/**
 * @title MeerkatAgentsTest
 * @notice Unit tests for MeerkatAgents NFT contract
 */
contract MeerkatAgentsTest is Test {
    MeerkatAgents public agents;
    
    address public owner = address(this);
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    
    string constant METADATA_URI = "ipfs://QmExample123/metadata.json";
    
    function setUp() public {
        agents = new MeerkatAgents();
    }
    
    // ========================================================================
    // MINTING TESTS
    // ========================================================================
    
    function test_MintAgent() public {
        vm.prank(alice);
        uint256 tokenId = agents.mintAgent(1, METADATA_URI);
        
        assertEq(tokenId, 1);
        assertEq(agents.ownerOf(1), alice);
        assertEq(agents.tokenToMeerkat(1), 1);
        assertEq(agents.meerkatToToken(1), 1);
        assertTrue(agents.meerkatTaken(1));
    }
    
    function test_MintMultipleAgents() public {
        vm.prank(alice);
        agents.mintAgent(1, METADATA_URI);
        
        vm.prank(bob);
        agents.mintAgent(50, METADATA_URI);
        
        assertEq(agents.ownerOf(1), alice);
        assertEq(agents.ownerOf(2), bob);
        assertEq(agents.tokenToMeerkat(2), 50);
    }
    
    function test_RevertMintTakenMeerkat() public {
        vm.prank(alice);
        agents.mintAgent(42, METADATA_URI);
        
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(MeerkatAgents.MeerkatNotAvailable.selector, 42));
        agents.mintAgent(42, METADATA_URI);
    }
    
    function test_RevertMintInvalidMeerkatId() public {
        vm.expectRevert(abi.encodeWithSelector(MeerkatAgents.InvalidMeerkatId.selector, 0));
        agents.mintAgent(0, METADATA_URI);
        
        vm.expectRevert(abi.encodeWithSelector(MeerkatAgents.InvalidMeerkatId.selector, 101));
        agents.mintAgent(101, METADATA_URI);
    }
    
    // ========================================================================
    // BURNING TESTS
    // ========================================================================
    
    function test_BurnAgent() public {
        vm.prank(alice);
        uint256 tokenId = agents.mintAgent(25, METADATA_URI);
        
        assertTrue(agents.meerkatTaken(25));
        
        vm.prank(alice);
        agents.burnAgent(tokenId);
        
        assertFalse(agents.meerkatTaken(25));
        assertEq(agents.meerkatToToken(25), 0);
    }
    
    function test_BurnAndRemint() public {
        // Alice mints
        vm.prank(alice);
        uint256 tokenId1 = agents.mintAgent(10, METADATA_URI);
        
        // Alice burns
        vm.prank(alice);
        agents.burnAgent(tokenId1);
        
        // Bob can now mint the same meerkat
        vm.prank(bob);
        uint256 tokenId2 = agents.mintAgent(10, METADATA_URI);
        
        assertEq(agents.ownerOf(tokenId2), bob);
        assertEq(agents.tokenToMeerkat(tokenId2), 10);
    }
    
    function test_RevertBurnNotOwner() public {
        vm.prank(alice);
        uint256 tokenId = agents.mintAgent(5, METADATA_URI);
        
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(MeerkatAgents.NotTokenOwner.selector, tokenId));
        agents.burnAgent(tokenId);
    }
    
    // ========================================================================
    // EXPAND SUPPLY TESTS
    // ========================================================================
    
    function test_ExpandSupply() public {
        assertEq(agents.maxMeerkatId(), 100);
        
        agents.expandSupply(200);
        
        assertEq(agents.maxMeerkatId(), 200);
    }
    
    function test_MintAfterExpand() public {
        agents.expandSupply(200);
        
        vm.prank(alice);
        uint256 tokenId = agents.mintAgent(150, METADATA_URI);
        
        assertEq(agents.tokenToMeerkat(tokenId), 150);
    }
    
    function test_RevertExpandNotOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        agents.expandSupply(200);
    }
    
    function test_RevertExpandLower() public {
        vm.expectRevert(abi.encodeWithSelector(MeerkatAgents.NewMaxMustBeGreater.selector, 100, 50));
        agents.expandSupply(50);
    }
    
    // ========================================================================
    // VIEW FUNCTION TESTS
    // ========================================================================
    
    function test_IsMeerkatAvailable() public {
        assertTrue(agents.isMeerkatAvailable(1));
        assertFalse(agents.isMeerkatAvailable(0));
        assertFalse(agents.isMeerkatAvailable(101));
        
        vm.prank(alice);
        agents.mintAgent(1, METADATA_URI);
        
        assertFalse(agents.isMeerkatAvailable(1));
    }
    
    function test_AvailableMeerkatCount() public {
        assertEq(agents.availableMeerkatCount(), 100);
        
        vm.prank(alice);
        agents.mintAgent(1, METADATA_URI);
        
        assertEq(agents.availableMeerkatCount(), 99);
    }
    
    function test_GetAvailableMeerkats() public {
        uint256[] memory available = agents.getAvailableMeerkats();
        assertEq(available.length, 100);
        assertEq(available[0], 1);
        assertEq(available[99], 100);
        
        vm.prank(alice);
        agents.mintAgent(50, METADATA_URI);
        
        available = agents.getAvailableMeerkats();
        assertEq(available.length, 99);
    }
    
    function test_GetAgentInfo() public {
        vm.prank(alice);
        uint256 tokenId = agents.mintAgent(42, METADATA_URI);
        
        (uint256 meerkatId, address agentOwner, string memory uri) = agents.getAgentInfo(tokenId);
        
        assertEq(meerkatId, 42);
        assertEq(agentOwner, alice);
        assertEq(uri, METADATA_URI);
    }
}
