// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AlphaLensAgentExecutor} from "../src/AlphaLensAgentExecutor.sol";

contract DeployAlphaLensAgentExecutor is Script {
    // BOT Chain testnet BDEX router
    address constant BDEX_ROUTER = 0xD6425a02f0845B8D99e349C34D2E7A576E177345;

    function run() external returns (AlphaLensAgentExecutor executor) {
        vm.startBroadcast();

        executor = new AlphaLensAgentExecutor(BDEX_ROUTER);

        vm.stopBroadcast();

        console2.log("AlphaLensAgentExecutor deployed at:", address(executor));

        console2.log("BDEX Router:", BDEX_ROUTER);
    }
}

contract DeployMainnetAlphaLensAgentExecutor is Script {
    // BOT Chain mainnet BDEX router
    address constant MAINNET_BDEX_ROUTER = 0x1414eD29FdFD322c3c0a830330ed982E2D629e76;

    function run() external returns (AlphaLensAgentExecutor executor) {
        vm.startBroadcast();

        executor = new AlphaLensAgentExecutor(MAINNET_BDEX_ROUTER);

        vm.stopBroadcast();

        console2.log("AlphaLensAgentExecutor deployed at:", address(executor));

        console2.log("BDEX Router:", MAINNET_BDEX_ROUTER);
    }
}
