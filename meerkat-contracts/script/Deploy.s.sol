// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ============================================================================
// MEERKAT DEPLOYMENT SCRIPT
// ============================================================================
// Deploys all Meerkat contracts to Base Sepolia or Mainnet
// Run: forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast
// ============================================================================

import {Script, console} from "forge-std/Script.sol";
import {MeerkatIdentityRegistry} from "../src/MeerkatIdentityRegistry.sol";
import {MeerkatReputationRegistry} from "../src/MeerkatReputationRegistry.sol";
import {MeerkatToken} from "../src/MeerkatToken.sol";

contract DeployMeerkat is Script {
    
    // Deployed contract addresses (set after deployment)
    MeerkatIdentityRegistry public identityRegistry;
    MeerkatReputationRegistry public reputationRegistry;
    MeerkatToken public token;
    
    function run() external {
        // Load private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("===========================================");
        console.log("MEERKAT AGENTS - DEPLOYMENT");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy Identity Registry
        console.log("1. Deploying MeerkatIdentityRegistry...");
        identityRegistry = new MeerkatIdentityRegistry();
        console.log("   Address:", address(identityRegistry));
        
        // 2. Deploy Reputation Registry (needs Identity Registry address)
        console.log("2. Deploying MeerkatReputationRegistry...");
        reputationRegistry = new MeerkatReputationRegistry(address(identityRegistry));
        console.log("   Address:", address(reputationRegistry));
        
        // 3. Deploy Token
        console.log("3. Deploying MeerkatToken ($MKAT)...");
        token = new MeerkatToken();
        console.log("   Address:", address(token));
        
        vm.stopBroadcast();
        
        // Summary
        console.log("");
        console.log("===========================================");
        console.log("DEPLOYMENT COMPLETE!");
        console.log("===========================================");
        console.log("");
        console.log("Contract Addresses:");
        console.log("  Identity Registry:", address(identityRegistry));
        console.log("  Reputation Registry:", address(reputationRegistry));
        console.log("  MKAT Token:", address(token));
        console.log("");
        console.log("Next steps:");
        console.log("  1. Verify contracts on Basescan");
        console.log("  2. Register Bob and Ana agents");
        console.log("  3. Set up backend API");
    }
}
