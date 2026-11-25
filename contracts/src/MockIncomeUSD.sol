// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Valueless demo token. Not USDC, not redeemable, and testnets only.
contract MockIncomeUSD is ERC20 {
    mapping(address => uint256) public nextClaimAt;
    error TestnetOnly();
    error FaucetCooldown(uint256 nextClaim);

    constructor() ERC20("IncomeFlow Demo USD", "ifUSD") {
        if (block.chainid != 84532 && block.chainid != 31337) revert TestnetOnly();
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Each address may claim 1,000 demo tokens per hour. Not an anti-Sybil faucet.
    function faucet() external {
        if (block.timestamp < nextClaimAt[msg.sender]) revert FaucetCooldown(nextClaimAt[msg.sender]);
        nextClaimAt[msg.sender] = block.timestamp + 1 hours;
        _mint(msg.sender, 1_000 * 10 ** decimals());
    }
}
