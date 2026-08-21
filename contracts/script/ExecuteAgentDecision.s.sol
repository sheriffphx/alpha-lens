// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {AlphaLensAgentExecutor} from "../src/AlphaLensAgentExecutor.sol";

interface IBdexQuoteRouter {
    function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts);
}

contract ExecuteAgentDecision is Script {
    address constant EXECUTOR = 0xF5B91F7D5a3863C244Ba4Cb9b409da9f88654DF1;

    address constant ROUTER = 0xD6425a02f0845B8D99e349C34D2E7A576E177345;
    address constant MAINNET_ROUTER = 0x1414eD29FdFD322c3c0a830330ed982E2D629e76;

    address constant USDT = 0x75edC9335175Fc0552D51D48439F229c10420fe3;

    address constant WBOT = 0xD5452816194a3784dBa983426cCe7c122F4abd30;

    uint256 constant POLICY_ID = 2;

    uint256 constant AMOUNT_IN = 10e6; // 10 USDT

    function run() external {
        address[] memory path = new address[](2);

        path[0] = USDT;
        path[1] = WBOT;

        console2.log("Getting BDEX quote...");

        uint256[] memory quote = IBdexQuoteRouter(ROUTER).getAmountsOut(AMOUNT_IN, path);

        uint256 quotedOutput = quote[quote.length - 1];

        console2.log("Quoted WBOT:", quotedOutput);

        // 1% max slippage.
        uint256 amountOutMin = (quotedOutput * 9900) / 10000;

        console2.log("Minimum WBOT output:", amountOutMin);

        bytes32 decisionId = keccak256(
            abi.encodePacked("AlphaLens", block.chainid, POLICY_ID, block.timestamp, AMOUNT_IN, quotedOutput)
        );

        bytes32 evidenceHash =
            keccak256(abi.encode("BDEX quote", quotedOutput, "AlphaLens autonomous testnet execution"));

        AlphaLensAgentExecutor.Decision memory decision = AlphaLensAgentExecutor.Decision({
            decisionId: decisionId,
            tokenIn: USDT,
            tokenOut: WBOT,
            amountIn: AMOUNT_IN,
            amountOutMin: amountOutMin,
            deadline: block.timestamp + 10 minutes,
            evidenceHash: evidenceHash
        });

        console2.log("=================================");
        console2.log("AlphaLens Agent Decision");
        console2.log("=================================");
        console2.log("Policy ID:", POLICY_ID);
        console2.log("Amount In: 10 USDT");
        console2.log("Quoted Output:", quotedOutput);
        console2.log("Minimum Output:", amountOutMin);
        console2.logBytes32(decisionId);
        console2.logBytes32(evidenceHash);

        vm.startBroadcast();

        AlphaLensAgentExecutor(EXECUTOR).executeDecision(POLICY_ID, decision);

        vm.stopBroadcast();

        console2.log("Agent decision executed.");
    }
}
