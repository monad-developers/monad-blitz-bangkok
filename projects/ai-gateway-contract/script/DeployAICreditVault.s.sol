// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {AICreditVault} from "../src/AICreditVault.sol";
import {console2} from "forge-std/console2.sol";

contract DeployAICreditVault is Script {
    function run() external {
        // Read env
        address payable treasury = payable(vm.envAddress("TREASURY_ADDRESS"));
        address owner = vm.envAddress("OWNER_ADDRESS");

        // PRIVATE_KEY can be 0x... hex; Foundry parses it as uint automatically
        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);
        AICreditVault vault = new AICreditVault(treasury, owner);
        vm.stopBroadcast();

        console2.log("AICreditVault deployed at:", address(vault));
        console2.log("Treasury:", treasury);
        console2.log("Owner:", owner);

        // Optional: immediately set backend if provided
        if (vm.envOr("BACKEND_ADDRESS", address(0)) != address(0)) {
            address backend = vm.envAddress("BACKEND_ADDRESS");
            vm.startBroadcast(pk);
            vault.setBackend(backend, true);
            vm.stopBroadcast();
            console2.log("Backend enabled:", backend);
        }
    }
}
