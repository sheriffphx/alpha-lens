// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AlphaLensExecutor} from "../src/AlphaLensExecutor.sol";

interface IBotFactory {
    function allPairsLength() external view returns (uint256);
}

interface IBotRouter {
    function factory() external view returns (address);
}

contract MockERC20 {
    mapping(address account => uint256) public balanceOf;
    mapping(address owner => mapping(address spender => uint256)) public allowance;

    bool public transferSucceeds = true;
    bool public requiresAllowanceReset;
    uint256 public failedApprovalCount;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function setTransferSucceeds(bool value) external {
        transferSucceeds = value;
    }

    function setRequiresAllowanceReset(bool value) external {
        requiresAllowanceReset = value;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        if (requiresAllowanceReset && allowance[msg.sender][spender] != 0 && amount != 0) {
            failedApprovalCount++;
            return false;
        }

        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        return _transfer(msg.sender, to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (!transferSucceeds || allowance[from][msg.sender] < amount) return false;

        allowance[from][msg.sender] -= amount;
        return _transfer(from, to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal returns (bool) {
        if (!transferSucceeds || balanceOf[from] < amount) return false;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract MockRouter {
    uint256 public callCount;
    uint256 public lastAmountIn;
    uint256 public lastAmountOutMin;
    address public lastRecipient;
    uint256 public lastDeadline;
    address[] internal lastPath;
    address public reentryTarget;
    bool public reentryAttempted;
    bool public reentrySucceeded;

    function enableReentry(address target) external {
        reentryTarget = target;
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        callCount++;
        lastAmountIn = amountIn;
        lastAmountOutMin = amountOutMin;
        lastRecipient = to;
        lastDeadline = deadline;
        lastPath = path;

        if (reentryTarget != address(0)) {
            reentryAttempted = true;
            try AlphaLensExecutor(reentryTarget).executeSwap(address(0), 1, 0, path, deadline) returns (
                uint256[] memory
            ) {
                reentrySucceeded = true;
            } catch {}
        }

        require(MockERC20(path[0]).transferFrom(msg.sender, address(this), amountIn), "input transfer failed");
        MockERC20(path[path.length - 1]).mint(to, amountIn * 2);

        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountIn * 2;
    }

    function pathAt(uint256 index) external view returns (address) {
        return lastPath[index];
    }
}

contract AlphaLensExecutorTest is Test {
    address internal constant DEPLOYER = address(0xA11CE);
    address internal constant USER = address(0xB0B);
    address internal constant OTHER = address(0xCAFE);

    MockERC20 internal tokenIn;
    MockERC20 internal tokenOut;
    MockRouter internal mockRouter;
    AlphaLensExecutor internal executor;

    event SwapExecuted(address indexed user, address indexed tokenIn, uint256 amountIn, uint256[] amounts);
    event TokensRescued(address indexed token, address indexed to, uint256 amount);

    function setUp() public {
        tokenIn = new MockERC20();
        tokenOut = new MockERC20();
        mockRouter = new MockRouter();
        vm.prank(DEPLOYER);
        executor = new AlphaLensExecutor(address(mockRouter));
    }

    function test_ConstructorStoresOwnerAndRouter() public view {
        assertEq(executor.owner(), DEPLOYER);
        assertEq(executor.router(), address(mockRouter));
    }

    function test_ConstructorRevertsForZeroRouter() public {
        vm.expectRevert(AlphaLensExecutor.ZeroAddress.selector);
        new AlphaLensExecutor(address(0));
    }

    function test_ExecuteSwapLetsAnyUserSwapTheirOwnApprovedTokens() public {
        uint256 amountIn = 1 ether;
        uint256 deadline = block.timestamp + 15 minutes;
        _fundAndApprove(USER, amountIn);

        uint256[] memory expectedAmounts = new uint256[](2);
        expectedAmounts[0] = amountIn;
        expectedAmounts[1] = amountIn * 2;
        vm.expectEmit(true, true, false, true, address(executor));
        emit SwapExecuted(USER, address(tokenIn), amountIn, expectedAmounts);

        vm.prank(USER);
        uint256[] memory amounts = executor.executeSwap(address(tokenIn), amountIn, 1, _path(), deadline);

        assertEq(tokenIn.balanceOf(USER), 0, "user input should be spent");
        assertEq(tokenIn.balanceOf(address(executor)), 0, "executor must not retain input tokens");
        assertEq(tokenOut.balanceOf(USER), amountIn * 2, "output must go to the caller");
        assertEq(tokenIn.allowance(address(executor), address(mockRouter)), 0, "router allowance must be cleared");
        assertEq(mockRouter.callCount(), 1);
        assertEq(mockRouter.lastAmountIn(), amountIn);
        assertEq(mockRouter.lastAmountOutMin(), 1);
        assertEq(mockRouter.lastRecipient(), USER);
        assertEq(mockRouter.lastDeadline(), deadline);
        assertEq(mockRouter.pathAt(0), address(tokenIn));
        assertEq(mockRouter.pathAt(1), address(tokenOut));
        assertEq(amounts, expectedAmounts);
    }

    function test_ExecuteSwapRevertsForZeroToken() public {
        vm.expectRevert(AlphaLensExecutor.ZeroAddress.selector);
        executor.executeSwap(address(0), 1, 0, _path(), block.timestamp);
    }

    function test_ExecuteSwapRevertsForZeroAmount() public {
        vm.expectRevert(AlphaLensExecutor.ZeroAmount.selector);
        executor.executeSwap(address(tokenIn), 0, 0, _path(), block.timestamp);
    }

    function test_ExecuteSwapRevertsWhenTokenReturnsFalseFromTransferFrom() public {
        _fundAndApprove(USER, 1);
        tokenIn.setTransferSucceeds(false);

        vm.prank(USER);
        vm.expectRevert(abi.encodeWithSelector(SafeERC20.SafeERC20FailedOperation.selector, address(tokenIn)));
        executor.executeSwap(address(tokenIn), 1, 0, _path(), block.timestamp);
    }

    function test_ExecuteSwapForceApprovesTokensThatRequireResetToZero() public {
        uint256 amountIn = 1 ether;
        _fundAndApprove(USER, amountIn);
        tokenIn.setRequiresAllowanceReset(true);

        // Simulates a leftover non-zero router approval from an interrupted prior integration.
        vm.prank(address(executor));
        tokenIn.approve(address(mockRouter), 1);

        vm.prank(USER);
        executor.executeSwap(address(tokenIn), amountIn, 0, _path(), block.timestamp);

        assertEq(tokenIn.failedApprovalCount(), 1, "forceApprove should retry after clearing allowance");
        assertEq(tokenIn.allowance(address(executor), address(mockRouter)), 0, "allowance must end at zero");
        assertEq(tokenOut.balanceOf(USER), amountIn * 2);
    }

    function test_ExecuteSwapBlocksRouterReentrancy() public {
        uint256 amountIn = 1 ether;
        _fundAndApprove(USER, amountIn);
        mockRouter.enableReentry(address(executor));

        vm.prank(USER);
        executor.executeSwap(address(tokenIn), amountIn, 0, _path(), block.timestamp);

        assertTrue(mockRouter.reentryAttempted());
        assertFalse(mockRouter.reentrySucceeded(), "router callback must not reenter executeSwap");
        assertEq(tokenOut.balanceOf(USER), amountIn * 2, "outer swap should still complete");
    }

    // function test_RescueTokensTransfersAccidentalBalanceToRecipient() public {
    //     uint256 amount = 123;
    //     tokenIn.mint(address(executor), amount);

    //     vm.expectEmit(true, true, false, true, address(executor));
    //     emit TokensRescued(address(tokenIn), OTHER, amount);
    //     vm.prank(DEPLOYER);
    //     executor.rescueTokens(address(tokenIn), OTHER, amount);

    //     assertEq(tokenIn.balanceOf(address(executor)), 0);
    //     assertEq(tokenIn.balanceOf(OTHER), amount);
    // }

    function test_RescueTokensRevertsForNonOwner() public {
        vm.prank(USER);
        vm.expectRevert(AlphaLensExecutor.NotOwner.selector);
        executor.rescueTokens(address(tokenIn), OTHER, 1);
    }

    function test_RescueTokensRevertsForZeroRecipient() public {
        vm.prank(DEPLOYER);
        vm.expectRevert(AlphaLensExecutor.ZeroAddress.selector);
        executor.rescueTokens(address(tokenIn), address(0), 1);
    }

    function _fundAndApprove(address user, uint256 amount) internal {
        tokenIn.mint(user, amount);
        vm.prank(user);
        assertTrue(tokenIn.approve(address(executor), amount));
    }

    function _path() internal view returns (address[] memory path) {
        path = new address[](2);
        path[0] = address(tokenIn);
        path[1] = address(tokenOut);
    }
}

/// @dev Fork calls run only against Foundry's local fork; no transaction is broadcast.
contract AlphaLensExecutorBotForkTest is Test {
    address internal constant MAINNET_FACTORY = 0x117115f3B72C8d1989178089A67D0C26f8EE0AA3;
    address internal constant MAINNET_ROUTER = 0x1414eD29FdFD322c3c0a830330ed982E2D629e76;
    address internal constant TESTNET_FACTORY = 0x65b8e98ceA190d8c28B3e4716402027f634d15a3;
    address internal constant TESTNET_ROUTER = 0xD6425a02f0845B8D99e349C34D2E7A576E177345;

    function testFork_MainnetRouterMatchesConfiguredFactory() public {
        // _skipUnlessRpcConfigured("BOT_MAINNET_RPC_URL");
        vm.createSelectFork("bot_mainnet");
        _assertDeployment(677, MAINNET_FACTORY, MAINNET_ROUTER);
    }

    function testFork_TestnetRouterMatchesConfiguredFactory() public {
        // _skipUnlessRpcConfigured("BOT_TESTNET_RPC_URL");
        vm.createSelectFork("bot_testnet");
        _assertDeployment(968, TESTNET_FACTORY, TESTNET_ROUTER);
    }

    function _assertDeployment(uint256 expectedChainId, address factory, address router) internal view {
        assertEq(block.chainid, expectedChainId, "wrong BOT chain selected");
        assertGt(factory.code.length, 0, "factory has no code");
        assertGt(router.code.length, 0, "router has no code");
        assertEq(IBotRouter(router).factory(), factory, "router points at a different factory");
        assertGt(IBotFactory(factory).allPairsLength(), 0, "factory has no pairs");
    }

    function _skipUnlessRpcConfigured(string memory variableName) internal {
        vm.skip(!vm.envExists(variableName), string.concat(variableName, " is not configured"));
    }
}
