// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MeerkatAgents} from "../src/MeerkatAgents.sol";

/**
 * @title DeployMeerkatAgents
 * @notice Deployment script for MeerkatAgents NFT contract
 * 
 * Usage:
 *   # Local anvil
 *   forge script script/DeployMeerkatAgents.s.sol --rpc-url http://localhost:8545 --broadcast
 * 
 *   # Base Mainnet (with verification)
 *   forge script script/DeployMeerkatAgents.s.sol --rpc-url base_mainnet --broadcast --verify
 */
contract DeployMeerkatAgents is Script {
    function run() external returns (MeerkatAgents) {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the contract
        MeerkatAgents agents = new MeerkatAgents();
        
        console.log("MeerkatAgents deployed at:", address(agents));
        console.log("Owner:", agents.owner());
        console.log("Max Meerkat ID:", agents.maxMeerkatId());
        
        vm.stopBroadcast();
        
        return agents;
    }
}
