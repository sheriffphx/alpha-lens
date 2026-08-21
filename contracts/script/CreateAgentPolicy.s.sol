// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AlphaLensAgentExecutor} from "../src/AlphaLensAgentExecutor.sol";

interface IERC20Approve {
    function approve(address spender, uint256 amount) external returns (bool);

    function allowance(address owner, address spender) external view returns (uint256);
}

contract CreateAgentPolicy is Script {
    address constant EXECUTOR = 0xF5B91F7D5a3863C244Ba4Cb9b409da9f88654DF1;

    address constant USDT = 0x75edC9335175Fc0552D51D48439F229c10420fe3;

    address constant WBOT = 0xD5452816194a3784dBa983426cCe7c122F4abd30;

    uint256 constant MAX_AMOUNT = 10e6; // 10 USDT
    uint256 constant MAX_SLIPPAGE_BPS = 100; // 1%
    uint256 constant COOLDOWN = 60;
    uint256 constant POLICY_DURATION = 1 days;

    function run() external returns (uint256 policyId) {
        address agent = vm.envAddress("AGENT_ADDRESS");

        vm.startBroadcast();

        AlphaLensAgentExecutor executor = AlphaLensAgentExecutor(EXECUTOR);

        // Give the executor permission to pull up to 10 USDT
        // from the policy owner's wallet.
        IERC20Approve(USDT).approve(EXECUTOR, MAX_AMOUNT);

        policyId = executor.createPolicy(
            agent, USDT, WBOT, MAX_AMOUNT, MAX_SLIPPAGE_BPS, COOLDOWN, block.timestamp + POLICY_DURATION
        );

        vm.stopBroadcast();

        console2.log("=================================");
        console2.log("AlphaLens Agent Policy Created");
        console2.log("=================================");
        console2.log("Executor:", EXECUTOR);
        console2.log("Policy ID:", policyId);
        console2.log("Agent:", agent);
        console2.log("Token In (USDT):", USDT);
        console2.log("Token Out (WBOT):", WBOT);
        console2.log("Max Amount: 10 USDT");
        console2.log("Max Slippage: 1%");
        console2.log("Cooldown: 24 hours");
        console2.log("Expiry: 7 days");
    }
}
