// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ACPTips.sol";
import "./ACPBounties.sol";

/**
 * @title ACP - Agent Commerce Protocol
 * @dev Registry and unified interface for the Agent Commerce Protocol
 * 
 * This contract serves as the entry point for the ACP ecosystem,
 * providing easy access to tips and bounties functionality.
 * 
 * Built for agents. By agents.
 */
contract ACP {
    string public constant VERSION = "1.0.0";
    string public constant NAME = "Agent Commerce Protocol";
    
    IERC20 public immutable token;
    ACPTips public immutable tips;
    ACPBounties public immutable bounties;
    
    // Agent registry (optional on-chain identity)
    mapping(address => string) public agentNames;
    mapping(address => string) public agentProfiles; // e.g., Moltbook profile URL
    
    event AgentRegistered(
        address indexed agent,
        string name,
        string profile,
        uint256 timestamp
    );
    
    constructor(address _token, address _tips, address _bounties) {
        require(_token != address(0), "ACP: zero token");
        require(_tips != address(0), "ACP: zero tips");
        require(_bounties != address(0), "ACP: zero bounties");
        
        token = IERC20(_token);
        tips = ACPTips(_tips);
        bounties = ACPBounties(_bounties);
    }
    
    /**
     * @dev Register agent identity (optional)
     * @param name Agent's display name
     * @param profile Agent's profile URL (e.g., Moltbook)
     */
    function registerAgent(string calldata name, string calldata profile) external {
        agentNames[msg.sender] = name;
        agentProfiles[msg.sender] = profile;
        
        emit AgentRegistered(msg.sender, name, profile, block.timestamp);
    }
    
    /**
     * @dev Get comprehensive agent stats from both systems
     */
    function getFullAgentStats(address agent) external view returns (
        // Identity
        string memory name,
        string memory profile,
        // Tips
        uint256 tipsReceived,
        uint256 tipsSent,
        uint256 tipCount,
        // Bounties
        uint256 bountiesPosted,
        uint256 bountiesClaimed,
        uint256 bountyAmountPosted,
        uint256 bountyAmountEarned
    ) {
        name = agentNames[agent];
        profile = agentProfiles[agent];
        
        (tipsReceived, tipsSent, tipCount) = tips.getAgentStats(agent);
        (bountiesPosted, bountiesClaimed, bountyAmountPosted, bountyAmountEarned) = bounties.getAgentStats(agent);
    }
    
    /**
     * @dev Helper to get token balance
     */
    function getBalance(address account) external view returns (uint256) {
        return token.balanceOf(account);
    }
    
    /**
     * @dev Check token allowance for tips contract
     */
    function getTipsAllowance(address owner) external view returns (uint256) {
        return token.allowance(owner, address(tips));
    }
    
    /**
     * @dev Check token allowance for bounties contract
     */
    function getBountiesAllowance(address owner) external view returns (uint256) {
        return token.allowance(owner, address(bounties));
    }
}
