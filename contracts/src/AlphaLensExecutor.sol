// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IBdexRouter02 {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

contract AlphaLensExecutor is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable owner;
    address public immutable router;

    error NotOwner();
    error ZeroAddress();
    error ZeroAmount();

    event SwapExecuted(address indexed user, address indexed tokenIn, uint256 amountIn, uint256[] amounts);

    event TokensRescued(address indexed token, address indexed to, uint256 amount);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _router) {
        if (_router == address(0)) revert ZeroAddress();
        owner = msg.sender;
        router = _router;
    }

    /// @notice Executes a swap on behalf of the caller, using the caller's own tokens.
    /// @dev Caller must have approved this contract for `amountIn` of `tokenIn` beforehand.
    function executeSwap(
        address tokenIn,
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        uint256 deadline
    ) external nonReentrant returns (uint256[] memory amounts) {
        if (tokenIn == address(0)) revert ZeroAddress();
        if (amountIn == 0) revert ZeroAmount();

        IERC20 token = IERC20(tokenIn);

        // Pull the caller's own tokens into this contract
        token.safeTransferFrom(msg.sender, address(this), amountIn);

        // Approve router, handling tokens that require a reset-to-zero first
        token.forceApprove(router, amountIn);

        // Swap output goes straight back to the caller, never held by this contract
        amounts = IBdexRouter02(router).swapExactTokensForTokens(amountIn, amountOutMin, path, msg.sender, deadline);

        // Clear any leftover allowance so nothing lingers on the router
        token.forceApprove(router, 0);

        emit SwapExecuted(msg.sender, tokenIn, amountIn, amounts);
    }

    /// @notice Owner-only recovery for tokens accidentally stuck in this contract
    /// (e.g. direct transfers, dust from partial fills). Never touches user funds
    /// mid-swap since this contract holds no balances outside a single transaction.
    function rescueTokens(address token, address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        IERC20(token).safeTransfer(to, amount);
    }
}
