//SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AlphaLensExecutor} from "../src/AlphaLensExecutor.sol";

contract DeployAlphaLensExecutor is Script {
    address internal constant TESTNET_ROUTER = 0xD6425a02f0845B8D99e349C34D2E7A576E177345;

    function run() external returns (address executorAddress) {
        // Reads private key from environment variable or CLI
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Executor
        AlphaLensExecutor executor = new AlphaLensExecutor(TESTNET_ROUTER);
        console.log("Deployed AlphaLensExecutor at:", address(executor));

        vm.stopBroadcast();

        console.log("--------------------------------------------------");
        console.log("AlphaLensExecutor deployed at:", address(executor));
        console.log("Router configured:", executor.router());
        console.log("Owner set to:", executor.owner());
        console.log("--------------------------------------------------");

        return address(executor);
    }
}
