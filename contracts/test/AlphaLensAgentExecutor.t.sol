// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AlphaLensAgentExecutor} from "../src/AlphaLensAgentExecutor.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockERC20 is IERC20 {
    string public name = "Mock Token";
    string public symbol = "MOCK";
    uint8 public decimals = 6;

    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];

        require(currentAllowance >= amount, "allowance");

        if (currentAllowance != type(uint256).max) {
            allowance[from][msg.sender] = currentAllowance - amount;
        }

        balanceOf[from] -= amount;
        balanceOf[to] += amount;

        emit Transfer(from, to, amount);

        return true;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;

        emit Transfer(address(0), to, amount);
    }
}

contract MockRouter {
    address public tokenOut;

    constructor(address _tokenOut) {
        tokenOut = _tokenOut;
    }

    function getAmountsOut(uint256 amountIn, address[] calldata) external pure returns (uint256[] memory amounts) {
        amounts = new uint256[](2);

        amounts[0] = amountIn;
        amounts[1] = amountIn;
    }

    function swapExactTokensForTokens(uint256 amountIn, uint256, address[] calldata path, address to, uint256)
        external
        returns (uint256[] memory amounts)
    {
        MockERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);

        MockERC20(path[1]).mint(to, amountIn);

        amounts = new uint256[](2);

        amounts[0] = amountIn;
        amounts[1] = amountIn;
    }
}

contract AlphaLensAgentExecutorTest is Test {
    AlphaLensAgentExecutor executor;

    MockERC20 usdt;
    MockERC20 wbot;

    MockRouter router;

    address user = address(0x1);
    address agent = address(0x2);
    address attacker = address(0x3);

    uint256 constant MAX_AMOUNT = 10e6;
    uint256 constant MAX_SLIPPAGE = 100;

    uint256 policyId;

    function setUp() public {
        usdt = new MockERC20();
        wbot = new MockERC20();

        router = new MockRouter(address(wbot));

        executor = new AlphaLensAgentExecutor(address(router));

        usdt.mint(user, 100e6);

        vm.prank(user);

        usdt.approve(address(executor), type(uint256).max);

        vm.prank(user);

        policyId = executor.createPolicy(
            agent, address(usdt), address(wbot), MAX_AMOUNT, MAX_SLIPPAGE, 1 days, block.timestamp + 7 days
        );
    }

    function _decision(bytes32 id, uint256 amount) internal view returns (AlphaLensAgentExecutor.Decision memory) {
        return AlphaLensAgentExecutor.Decision({
            decisionId: id,
            tokenIn: address(usdt),
            tokenOut: address(wbot),
            amountIn: amount,
            amountOutMin: amount,
            deadline: block.timestamp + 1 hours,
            evidenceHash: keccak256("evidence")
        });
    }

    function testValidDecisionExecutes() public {
        AlphaLensAgentExecutor.Decision memory decision = _decision(keccak256("decision-1"), 10e6);

        vm.prank(agent);

        executor.executeDecision(policyId, decision);

        assertEq(wbot.balanceOf(user), 10e6);

        assertEq(usdt.balanceOf(user), 90e6);
    }

    function testUnauthorizedAgentCannotExecute() public {
        AlphaLensAgentExecutor.Decision memory decision = _decision(keccak256("decision-2"), 10e6);

        vm.prank(attacker);

        vm.expectRevert(AlphaLensAgentExecutor.NotAuthorizedAgent.selector);

        executor.executeDecision(policyId, decision);
    }

    function testAmountAboveLimitReverts() public {
        AlphaLensAgentExecutor.Decision memory decision = _decision(keccak256("decision-3"), 11e6);

        vm.prank(agent);

        vm.expectRevert(AlphaLensAgentExecutor.AmountExceedsLimit.selector);

        executor.executeDecision(policyId, decision);
    }

    function testWrongTokenInReverts() public {
        MockERC20 otherToken = new MockERC20();

        AlphaLensAgentExecutor.Decision memory decision = _decision(keccak256("decision-4"), 10e6);

        decision.tokenIn = address(otherToken);

        vm.prank(agent);

        vm.expectRevert(AlphaLensAgentExecutor.InvalidTokenIn.selector);

        executor.executeDecision(policyId, decision);
    }

    function testWrongTokenOutReverts() public {
        MockERC20 otherToken = new MockERC20();

        AlphaLensAgentExecutor.Decision memory decision = _decision(keccak256("decision-5"), 10e6);

        decision.tokenOut = address(otherToken);

        vm.prank(agent);

        vm.expectRevert(AlphaLensAgentExecutor.InvalidTokenOut.selector);

        executor.executeDecision(policyId, decision);
    }

    function testPausedPolicyReverts() public {
        vm.prank(user);

        executor.pausePolicy(policyId);

        AlphaLensAgentExecutor.Decision memory decision = _decision(keccak256("decision-6"), 10e6);

        vm.prank(agent);

        vm.expectRevert(AlphaLensAgentExecutor.PolicyInactive.selector);

        executor.executeDecision(policyId, decision);
    }

    function testReplayReverts() public {
        AlphaLensAgentExecutor.Decision memory decision = _decision(keccak256("decision-7"), 10e6);

        vm.prank(agent);

        executor.executeDecision(policyId, decision);

        vm.warp(block.timestamp + 1 days + 1);

        vm.prank(agent);

        vm.expectRevert(AlphaLensAgentExecutor.DecisionAlreadyExecuted.selector);

        executor.executeDecision(policyId, decision);
    }

    function testCooldownReverts() public {
        AlphaLensAgentExecutor.Decision memory first = _decision(keccak256("decision-8"), 10e6);

        vm.prank(agent);

        executor.executeDecision(policyId, first);

        AlphaLensAgentExecutor.Decision memory second = _decision(keccak256("decision-9"), 10e6);

        vm.prank(agent);

        vm.expectRevert(AlphaLensAgentExecutor.CooldownActive.selector);

        executor.executeDecision(policyId, second);
    }

    function testExpiredDecisionReverts() public {
        AlphaLensAgentExecutor.Decision memory decision = _decision(keccak256("decision-10"), 10e6);

        decision.deadline = block.timestamp - 1;

        vm.prank(agent);

        vm.expectRevert(AlphaLensAgentExecutor.DecisionExpired.selector);

        executor.executeDecision(policyId, decision);
    }

    function testOwnerCanResumePolicy() public {
        vm.prank(user);

        executor.pausePolicy(policyId);

        vm.prank(user);

        executor.resumePolicy(policyId);

        assertTrue(executor.isPolicyExecutable(policyId));
    }
}
