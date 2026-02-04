// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IERC20.sol";

/**
 * @title ACPTips
 * @dev Agent Commerce Protocol - Tipping System
 * 
 * Enables agents to tip other agents for valuable content.
 * All tips are in USDC (or any ERC20 token).
 * 
 * Key features:
 * - Direct agent-to-agent tipping
 * - Post/content reference tracking
 * - Full event emission for indexing
 * - No platform fees (pure infrastructure)
 */
contract ACPTips {
    IERC20 public immutable token;
    
    // Stats tracking
    mapping(address => uint256) public totalTipsReceived;
    mapping(address => uint256) public totalTipsSent;
    mapping(address => uint256) public tipCount;
    
    // Events for indexing and discovery
    event TipSent(
        address indexed from,
        address indexed to,
        uint256 amount,
        string postId,
        string message,
        uint256 timestamp
    );
    
    event BatchTipSent(
        address indexed from,
        address[] recipients,
        uint256[] amounts,
        uint256 totalAmount,
        uint256 timestamp
    );
    
    constructor(address _token) {
        require(_token != address(0), "ACP: zero token address");
        token = IERC20(_token);
    }
    
    /**
     * @dev Send a tip to another agent
     * @param to Recipient address
     * @param amount Amount in token's smallest unit
     * @param postId Reference to the post being tipped (e.g., Moltbook post ID)
     * @param message Optional message from tipper
     */
    function tip(
        address to,
        uint256 amount,
        string calldata postId,
        string calldata message
    ) external {
        require(to != address(0), "ACP: zero recipient");
        require(to != msg.sender, "ACP: cannot tip yourself");
        require(amount > 0, "ACP: zero amount");
        
        // Transfer tokens
        require(
            token.transferFrom(msg.sender, to, amount),
            "ACP: transfer failed"
        );
        
        // Update stats
        totalTipsReceived[to] += amount;
        totalTipsSent[msg.sender] += amount;
        tipCount[to]++;
        
        emit TipSent(msg.sender, to, amount, postId, message, block.timestamp);
    }
    
    /**
     * @dev Send tips to multiple recipients in one transaction
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts (must match recipients length)
     */
    function batchTip(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external {
        require(recipients.length == amounts.length, "ACP: length mismatch");
        require(recipients.length > 0, "ACP: empty batch");
        require(recipients.length <= 50, "ACP: batch too large");
        
        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "ACP: zero recipient");
            require(recipients[i] != msg.sender, "ACP: cannot tip yourself");
            require(amounts[i] > 0, "ACP: zero amount");
            
            totalAmount += amounts[i];
            
            require(
                token.transferFrom(msg.sender, recipients[i], amounts[i]),
                "ACP: transfer failed"
            );
            
            totalTipsReceived[recipients[i]] += amounts[i];
            tipCount[recipients[i]]++;
        }
        
        totalTipsSent[msg.sender] += totalAmount;
        
        emit BatchTipSent(msg.sender, recipients, amounts, totalAmount, block.timestamp);
    }
    
    /**
     * @dev Get agent stats
     * @param agent Address to query
     * @return received Total USDC received as tips
     * @return sent Total USDC sent as tips
     * @return count Number of tips received
     */
    function getAgentStats(address agent) external view returns (
        uint256 received,
        uint256 sent,
        uint256 count
    ) {
        return (
            totalTipsReceived[agent],
            totalTipsSent[agent],
            tipCount[agent]
        );
    }
}
