// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @dev A mock USDC token for testnet usage
 * Anyone can mint tokens for testing purposes
 */
contract MockUSDC is ERC20 {
    uint8 private constant DECIMALS = 6;
    
    constructor() ERC20("USD Coin", "USDC") {
        // Mint 1 million USDC to deployer for initial distribution
        _mint(msg.sender, 1_000_000 * 10**DECIMALS);
    }
    
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
    
    /**
     * @dev Faucet function - anyone can mint testnet USDC
     * @param to Address to receive tokens
     * @param amount Amount to mint (in USDC, not wei)
     */
    function faucet(address to, uint256 amount) external {
        require(amount <= 10_000, "MockUSDC: max 10,000 USDC per mint");
        _mint(to, amount * 10**DECIMALS);
    }
    
    /**
     * @dev Mint raw amount (for precise control)
     * @param to Address to receive tokens
     * @param rawAmount Amount in smallest units (6 decimals)
     */
    function mintRaw(address to, uint256 rawAmount) external {
        require(rawAmount <= 10_000 * 10**DECIMALS, "MockUSDC: max 10,000 USDC per mint");
        _mint(to, rawAmount);
    }
}
