// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IBdexRouter02 {
    function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts);
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

/**
 * @title AlphaLensAgentExecutor
 * @notice Permissioned execution layer for the AlphaLens autonomous agent.
 *
 * The user defines a policy. An authorized agent may execute swaps only when
 * every policy restriction is satisfied.
 *
 * IMPORTANT:
 * - The AI/agent is NOT trusted.
 * - The contract is the final enforcement layer.
 * - User funds are accessed only through ERC20 allowance.
 */
contract AlphaLensAgentExecutor is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // =============================================================
    //                            TYPES
    // =============================================================

    struct AgentPolicy {
        address owner;
        address agent;

        address tokenIn;
        address tokenOut;

        uint256 maxAmount;
        uint256 maxSlippageBps;
        uint256 minOpportunityScore;

        uint256 cooldown;
        uint256 lastExecution;

        uint256 expiry;

        bool active;
    }

    struct Decision {
        bytes32 decisionId;

        address tokenIn;
        address tokenOut;

        uint256 amountIn;
        uint256 amountOutMin;
        uint256 opportunityScore;

        uint256 deadline;

        bytes32 evidenceHash;
    }

    // =============================================================
    //                            STATE
    // =============================================================

    address public immutable owner;
    address public immutable router;

    uint256 public constant MAX_BPS = 10_000;
    uint256 public constant MAX_OPPORTUNITY_SCORE = 100;

    uint256 private _nextPolicyId = 1;

    mapping(uint256 => AgentPolicy) public policies;
    mapping(address => uint256[]) private _ownerPolicyIds;

    mapping(bytes32 => bool) public executedDecisions;

    // =============================================================
    //                            ERRORS
    // =============================================================
    error NotOwner();

    error ZeroAddress();
    error ZeroAmount();

    error InvalidPolicy();
    error PolicyNotFound();
    error PolicyInactive();
    error PolicyExpired();

    error NotPolicyOwner();
    error NotAuthorizedAgent();

    error InvalidTokenIn();
    error InvalidTokenOut();

    error AmountExceedsLimit();
    error SlippageExceedsLimit();
    error OpportunityScoreBelowLimit();

    error CooldownActive();

    error DecisionAlreadyExecuted();
    error DecisionExpired();

    error InvalidDecision();
    error InvalidPath();

    // =============================================================
    //                            EVENTS
    // =============================================================

    event PolicyCreated(
        uint256 indexed policyId,
        address indexed owner,
        address indexed agent,
        address tokenIn,
        address tokenOut,
        uint256 maxAmount,
        uint256 maxSlippageBps,
        uint256 minOpportunityScore,
        uint256 cooldown,
        uint256 expiry
    );

    event PolicyPaused(uint256 indexed policyId);

    event PolicyResumed(uint256 indexed policyId);

    event PolicyCancelled(uint256 indexed policyId);

    event DecisionCommitted(uint256 indexed policyId, bytes32 indexed decisionId, bytes32 evidenceHash);

    event DecisionExecuted(
        uint256 indexed policyId,
        bytes32 indexed decisionId,
        address indexed agent,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    event TokensRescued(address indexed token, address indexed to, uint256 amount);

    // =============================================================
    //                          MODIFIERS
    // =============================================================

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        _;
    }

    modifier onlyPolicyOwner(uint256 policyId) {
        if (policies[policyId].owner != msg.sender) {
            revert NotPolicyOwner();
        }
        _;
    }

    modifier onlyAgent(uint256 policyId) {
        if (policies[policyId].agent != msg.sender) {
            revert NotAuthorizedAgent();
        }
        _;
    }

    // =============================================================
    //                         CONSTRUCTOR
    // =============================================================

    constructor(address _router) {
        if (_router == address(0)) {
            revert ZeroAddress();
        }

        owner = msg.sender;
        router = _router;
    }

    // =============================================================
    //                       POLICY MANAGEMENT
    // =============================================================

    /**
     * @notice Creates an autonomous trading policy.
     *
     * The user must separately approve this contract to spend tokenIn.
     */
    function createPolicy(
        address agent,
        address tokenIn,
        address tokenOut,
        uint256 maxAmount,
        uint256 maxSlippageBps,
        uint256 minOpportunityScore,
        uint256 cooldown,
        uint256 expiry
    ) external returns (uint256 policyId) {
        if (agent == address(0) || tokenIn == address(0) || tokenOut == address(0)) {
            revert ZeroAddress();
        }

        if (maxAmount == 0) {
            revert ZeroAmount();
        }

        if (maxSlippageBps > MAX_BPS) {
            revert InvalidPolicy();
        }

        if (minOpportunityScore > MAX_OPPORTUNITY_SCORE) {
            revert InvalidPolicy();
        }

        if (expiry <= block.timestamp) {
            revert InvalidPolicy();
        }

        policyId = _nextPolicyId++;

        policies[policyId] = AgentPolicy({
            owner: msg.sender,
            agent: agent,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            maxAmount: maxAmount,
            maxSlippageBps: maxSlippageBps,
            minOpportunityScore: minOpportunityScore,
            cooldown: cooldown,
            lastExecution: 0,
            expiry: expiry,
            active: true
        });

        _ownerPolicyIds[msg.sender].push(policyId);

        emit PolicyCreated(
            policyId,
            msg.sender,
            agent,
            tokenIn,
            tokenOut,
            maxAmount,
            maxSlippageBps,
            minOpportunityScore,
            cooldown,
            expiry
        );
    }

    /**
     * @notice Temporarily pauses autonomous execution.
     */
    function pausePolicy(uint256 policyId) external onlyPolicyOwner(policyId) {
        AgentPolicy storage policy = policies[policyId];

        if (policy.owner == address(0)) {
            revert PolicyNotFound();
        }

        policy.active = false;

        emit PolicyPaused(policyId);
    }

    /**
     * @notice Resumes an existing policy.
     */
    function resumePolicy(uint256 policyId) external onlyPolicyOwner(policyId) {
        AgentPolicy storage policy = policies[policyId];

        if (policy.owner == address(0)) {
            revert PolicyNotFound();
        }

        if (block.timestamp >= policy.expiry) {
            revert PolicyExpired();
        }

        policy.active = true;

        emit PolicyResumed(policyId);
    }

    /**
     * @notice Permanently cancels a policy.
     */
    function cancelPolicy(uint256 policyId) external onlyPolicyOwner(policyId) {
        AgentPolicy storage policy = policies[policyId];

        if (policy.owner == address(0)) {
            revert PolicyNotFound();
        }

        policy.active = false;
        policy.expiry = block.timestamp;

        emit PolicyCancelled(policyId);
    }

    // =============================================================
    //                       AGENT EXECUTION
    // =============================================================

    /**
     * @notice Executes an AI-generated decision if it satisfies the user's policy.
     *
     * The agent cannot:
     * - exceed the user's amount limit
     * - use unauthorized tokens
     * - exceed the user's slippage limit
     * - execute before cooldown
     * - execute expired decisions
     * - replay an old decision
     * - execute a paused/expired policy
     */
    function executeDecision(uint256 policyId, Decision calldata decision)
        external
        onlyAgent(policyId)
        nonReentrant
        returns (uint256[] memory amounts)
    {
        AgentPolicy storage policy = policies[policyId];

        _validateDecision(policy, decision);

        uint256 policyMinAmountOut = _validateSlippage(policy, decision);
        if (decision.amountOutMin < policyMinAmountOut) {
            revert SlippageExceedsLimit();
        }

        executedDecisions[decision.decisionId] = true;
        policy.lastExecution = block.timestamp;

        amounts = _swap(policy, decision);

        emit DecisionExecuted(
            policyId,
            decision.decisionId,
            msg.sender,
            decision.tokenIn,
            decision.tokenOut,
            decision.amountIn,
            amounts[amounts.length - 1]
        );
    }

    function _validateDecision(AgentPolicy storage policy, Decision calldata decision) private view {
        if (policy.owner == address(0)) revert PolicyNotFound();
        if (!policy.active) revert PolicyInactive();
        if (block.timestamp >= policy.expiry) revert PolicyExpired();
        if (decision.decisionId == bytes32(0)) revert InvalidDecision();
        if (executedDecisions[decision.decisionId]) revert DecisionAlreadyExecuted();
        if (decision.tokenIn != policy.tokenIn) revert InvalidTokenIn();
        if (decision.tokenOut != policy.tokenOut) revert InvalidTokenOut();
        if (decision.amountIn == 0) revert ZeroAmount();
        if (decision.amountIn > policy.maxAmount) revert AmountExceedsLimit();
        if (decision.opportunityScore < policy.minOpportunityScore) revert OpportunityScoreBelowLimit();
        if (decision.deadline < block.timestamp) revert DecisionExpired();
        if (decision.deadline > policy.expiry) revert InvalidDecision();
        if (policy.lastExecution != 0 && block.timestamp < policy.lastExecution + policy.cooldown) {
            revert CooldownActive();
        }
        if (decision.tokenIn == decision.tokenOut) revert InvalidPath();
    }

    function _validateSlippage(AgentPolicy storage policy, Decision calldata decision)
        private
        view
        returns (uint256 policyMinAmountOut)
    {
        address[] memory path = new address[](2);
        path[0] = decision.tokenIn;
        path[1] = decision.tokenOut;

        uint256[] memory quotedAmounts = IBdexRouter02(router).getAmountsOut(decision.amountIn, path);
        if (quotedAmounts.length < 2) revert InvalidDecision();

        uint256 quotedAmountOut = quotedAmounts[quotedAmounts.length - 1];
        policyMinAmountOut = (quotedAmountOut * (MAX_BPS - policy.maxSlippageBps)) / MAX_BPS;
    }

    function _swap(AgentPolicy storage policy, Decision calldata decision) private returns (uint256[] memory amounts) {
        address[] memory path = new address[](2);
        path[0] = decision.tokenIn;
        path[1] = decision.tokenOut;

        IERC20 token = IERC20(policy.tokenIn);
        token.safeTransferFrom(policy.owner, address(this), decision.amountIn);
        token.forceApprove(router, decision.amountIn);

        amounts = IBdexRouter02(router)
            .swapExactTokensForTokens(decision.amountIn, decision.amountOutMin, path, policy.owner, decision.deadline);

        token.forceApprove(router, 0);
    }

    // =============================================================
    //                       DECISION COMMIT
    // =============================================================

    /**
     * @notice Records the hash/evidence of an AI decision.
     *
     * This is useful for the AlphaLens dashboard and audit trail.
     */
    function commitDecision(uint256 policyId, bytes32 decisionId, bytes32 evidenceHash) external onlyAgent(policyId) {
        AgentPolicy storage policy = policies[policyId];

        if (policy.owner == address(0)) {
            revert PolicyNotFound();
        }

        if (!policy.active) {
            revert PolicyInactive();
        }

        if (decisionId == bytes32(0)) {
            revert InvalidDecision();
        }

        if (executedDecisions[decisionId]) {
            revert DecisionAlreadyExecuted();
        }

        emit DecisionCommitted(policyId, decisionId, evidenceHash);
    }

    // =============================================================
    //                         VIEW FUNCTIONS
    // =============================================================

    function isPolicyExecutable(uint256 policyId) external view returns (bool) {
        AgentPolicy memory policy = policies[policyId];

        if (policy.owner == address(0)) return false;
        if (!policy.active) return false;
        if (block.timestamp >= policy.expiry) return false;

        if (policy.lastExecution != 0 && block.timestamp < policy.lastExecution + policy.cooldown) {
            return false;
        }

        return true;
    }

    function getOwnerPolicyIds(address account) external view returns (uint256[] memory) {
        return _ownerPolicyIds[account];
    }

    // =============================================================
    //                          RESCUE
    // =============================================================

    /**
     * @notice Owner recovery for tokens accidentally sent to this contract.
     *
     * The contract does not intentionally retain user funds after execution.
     */
    function rescueTokens(address token, address to, uint256 amount) external onlyOwner {
        if (token == address(0) || to == address(0)) {
            revert ZeroAddress();
        }

        IERC20(token).safeTransfer(to, amount);

        emit TokensRescued(token, to, amount);
    }
}
