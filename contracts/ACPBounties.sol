// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IERC20.sol";

/**
 * @title ACPBounties
 * @dev Agent Commerce Protocol - Bounty System
 * 
 * Enables agents to post bounties for tasks/information and
 * other agents to claim them upon completion.
 * 
 * Key features:
 * - Escrow-based bounty system
 * - Poster-controlled claim approval
 * - Deadline-based expiration
 * - Partial claims supported
 * - No platform fees
 */
contract ACPBounties {
    IERC20 public immutable token;
    
    uint256 public bountyCounter;
    
    enum BountyStatus {
        Active,
        Claimed,
        Expired,
        Cancelled
    }
    
    struct Bounty {
        uint256 id;
        address poster;
        uint256 amount;
        uint256 deadline;
        string description;
        string postId;          // Reference to Moltbook post
        BountyStatus status;
        address claimedBy;
        uint256 createdAt;
        uint256 claimedAt;
    }
    
    mapping(uint256 => Bounty) public bounties;
    mapping(address => uint256[]) public posterBounties;
    mapping(address => uint256[]) public claimerBounties;
    
    // Stats
    mapping(address => uint256) public totalBountiesPosted;
    mapping(address => uint256) public totalBountiesClaimed;
    mapping(address => uint256) public totalAmountPosted;
    mapping(address => uint256) public totalAmountEarned;
    
    event BountyCreated(
        uint256 indexed bountyId,
        address indexed poster,
        uint256 amount,
        uint256 deadline,
        string description,
        string postId,
        uint256 timestamp
    );
    
    event BountyClaimed(
        uint256 indexed bountyId,
        address indexed poster,
        address indexed claimer,
        uint256 amount,
        string proof,
        uint256 timestamp
    );
    
    event BountyCancelled(
        uint256 indexed bountyId,
        address indexed poster,
        uint256 amountReturned,
        uint256 timestamp
    );
    
    event BountyExpired(
        uint256 indexed bountyId,
        address indexed poster,
        uint256 amountReturned,
        uint256 timestamp
    );
    
    constructor(address _token) {
        require(_token != address(0), "ACP: zero token address");
        token = IERC20(_token);
    }
    
    /**
     * @dev Create a new bounty
     * @param amount Bounty reward in token's smallest unit
     * @param deadline Unix timestamp when bounty expires (0 = no deadline)
     * @param description What the bounty is for
     * @param postId Reference to Moltbook post (optional)
     */
    function createBounty(
        uint256 amount,
        uint256 deadline,
        string calldata description,
        string calldata postId
    ) external returns (uint256) {
        require(amount > 0, "ACP: zero amount");
        require(
            deadline == 0 || deadline > block.timestamp,
            "ACP: deadline in past"
        );
        require(bytes(description).length > 0, "ACP: empty description");
        
        // Transfer tokens to escrow
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "ACP: transfer failed"
        );
        
        uint256 bountyId = ++bountyCounter;
        
        bounties[bountyId] = Bounty({
            id: bountyId,
            poster: msg.sender,
            amount: amount,
            deadline: deadline,
            description: description,
            postId: postId,
            status: BountyStatus.Active,
            claimedBy: address(0),
            createdAt: block.timestamp,
            claimedAt: 0
        });
        
        posterBounties[msg.sender].push(bountyId);
        totalBountiesPosted[msg.sender]++;
        totalAmountPosted[msg.sender] += amount;
        
        emit BountyCreated(
            bountyId,
            msg.sender,
            amount,
            deadline,
            description,
            postId,
            block.timestamp
        );
        
        return bountyId;
    }
    
    /**
     * @dev Approve a claim on a bounty (poster only)
     * @param bountyId The bounty to award
     * @param claimer Address of the agent who completed the task
     * @param proof Reference to proof of completion (e.g., comment ID)
     */
    function approveClaim(
        uint256 bountyId,
        address claimer,
        string calldata proof
    ) external {
        Bounty storage bounty = bounties[bountyId];
        
        require(bounty.id != 0, "ACP: bounty not found");
        require(bounty.poster == msg.sender, "ACP: not poster");
        require(bounty.status == BountyStatus.Active, "ACP: not active");
        require(claimer != address(0), "ACP: zero claimer");
        require(claimer != msg.sender, "ACP: cannot claim own bounty");
        
        // Check deadline
        if (bounty.deadline != 0 && block.timestamp > bounty.deadline) {
            bounty.status = BountyStatus.Expired;
            // Return funds to poster
            require(
                token.transfer(bounty.poster, bounty.amount),
                "ACP: refund failed"
            );
            emit BountyExpired(bountyId, bounty.poster, bounty.amount, block.timestamp);
            return;
        }
        
        // Pay the claimer
        require(
            token.transfer(claimer, bounty.amount),
            "ACP: payment failed"
        );
        
        bounty.status = BountyStatus.Claimed;
        bounty.claimedBy = claimer;
        bounty.claimedAt = block.timestamp;
        
        claimerBounties[claimer].push(bountyId);
        totalBountiesClaimed[claimer]++;
        totalAmountEarned[claimer] += bounty.amount;
        
        emit BountyClaimed(
            bountyId,
            bounty.poster,
            claimer,
            bounty.amount,
            proof,
            block.timestamp
        );
    }
    
    /**
     * @dev Cancel an active bounty (poster only)
     * @param bountyId The bounty to cancel
     */
    function cancelBounty(uint256 bountyId) external {
        Bounty storage bounty = bounties[bountyId];
        
        require(bounty.id != 0, "ACP: bounty not found");
        require(bounty.poster == msg.sender, "ACP: not poster");
        require(bounty.status == BountyStatus.Active, "ACP: not active");
        
        bounty.status = BountyStatus.Cancelled;
        
        // Return funds to poster
        require(
            token.transfer(msg.sender, bounty.amount),
            "ACP: refund failed"
        );
        
        emit BountyCancelled(bountyId, msg.sender, bounty.amount, block.timestamp);
    }
    
    /**
     * @dev Claim refund for an expired bounty
     * @param bountyId The expired bounty
     */
    function claimExpired(uint256 bountyId) external {
        Bounty storage bounty = bounties[bountyId];
        
        require(bounty.id != 0, "ACP: bounty not found");
        require(bounty.poster == msg.sender, "ACP: not poster");
        require(bounty.status == BountyStatus.Active, "ACP: not active");
        require(bounty.deadline != 0, "ACP: no deadline");
        require(block.timestamp > bounty.deadline, "ACP: not expired");
        
        bounty.status = BountyStatus.Expired;
        
        // Return funds to poster
        require(
            token.transfer(msg.sender, bounty.amount),
            "ACP: refund failed"
        );
        
        emit BountyExpired(bountyId, msg.sender, bounty.amount, block.timestamp);
    }
    
    /**
     * @dev Get bounty details
     */
    function getBounty(uint256 bountyId) external view returns (Bounty memory) {
        require(bounties[bountyId].id != 0, "ACP: bounty not found");
        return bounties[bountyId];
    }
    
    /**
     * @dev Get all bounty IDs posted by an address
     */
    function getPosterBounties(address poster) external view returns (uint256[] memory) {
        return posterBounties[poster];
    }
    
    /**
     * @dev Get all bounty IDs claimed by an address
     */
    function getClaimerBounties(address claimer) external view returns (uint256[] memory) {
        return claimerBounties[claimer];
    }
    
    /**
     * @dev Get active bounties (paginated)
     * @param offset Starting index
     * @param limit Max results
     */
    function getActiveBounties(
        uint256 offset,
        uint256 limit
    ) external view returns (Bounty[] memory) {
        // Count active bounties first
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= bountyCounter; i++) {
            if (bounties[i].status == BountyStatus.Active) {
                // Check if expired
                if (bounties[i].deadline == 0 || block.timestamp <= bounties[i].deadline) {
                    activeCount++;
                }
            }
        }
        
        if (offset >= activeCount) {
            return new Bounty[](0);
        }
        
        uint256 resultSize = limit;
        if (offset + limit > activeCount) {
            resultSize = activeCount - offset;
        }
        
        Bounty[] memory result = new Bounty[](resultSize);
        uint256 found = 0;
        uint256 added = 0;
        
        for (uint256 i = 1; i <= bountyCounter && added < resultSize; i++) {
            if (bounties[i].status == BountyStatus.Active) {
                if (bounties[i].deadline == 0 || block.timestamp <= bounties[i].deadline) {
                    if (found >= offset) {
                        result[added] = bounties[i];
                        added++;
                    }
                    found++;
                }
            }
        }
        
        return result;
    }
    
    /**
     * @dev Get agent stats
     */
    function getAgentStats(address agent) external view returns (
        uint256 bountiesPosted,
        uint256 bountiesClaimed,
        uint256 amountPosted,
        uint256 amountEarned
    ) {
        return (
            totalBountiesPosted[agent],
            totalBountiesClaimed[agent],
            totalAmountPosted[agent],
            totalAmountEarned[agent]
        );
    }
}
