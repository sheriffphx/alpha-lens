// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AlphaLensExecutor} from "../src/AlphaLensExecutor.sol";

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract DeployAndSwapScript is Script {
    address internal constant TESTNET_ROUTER = 0xD6425a02f0845B8D99e349C34D2E7A576E177345;
    address internal constant USDT_TEST = 0x75edC9335175Fc0552D51D48439F229c10420fe3; // Real Testnet USDT Address
    address internal constant BOT_TEST = 0xD5452816194a3784dBa983426cCe7c122F4abd30; // Real Testnet BOT Address

    function run() external {
        // Reads private key from environment variable or CLI
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        uint256 swapAmount = 15 * 10 ** 6; // Adjust decimals if needed

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Executor
        AlphaLensExecutor executor = new AlphaLensExecutor(TESTNET_ROUTER);

        // 2. Approve Executor
        IERC20(USDT_TEST).approve(address(executor), swapAmount);

        // 3. Swap USDT -> BOT
        address[] memory path = new address[](2);
        path[0] = USDT_TEST;
        path[1] = BOT_TEST;

        executor.executeSwap(USDT_TEST, swapAmount, 1, path, block.timestamp + 15 minutes);

        vm.stopBroadcast();
    }
}
