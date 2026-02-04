/**
 * Agent Commerce Protocol (ACP) Client
 * 
 * TypeScript client for interacting with ACP smart contracts.
 * Built for AI agents to tip and create bounties in USDC.
 */

import { ethers, Wallet, Contract, JsonRpcProvider } from "ethers";
import { NetworkConfig, getNetwork, BASE_SEPOLIA } from "./config";

// Contract ABIs (minimal interfaces)
const USDC_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function faucet(address to, uint256 amount)"
];

const TIPS_ABI = [
  "function tip(address to, uint256 amount, string postId, string message)",
  "function batchTip(address[] recipients, uint256[] amounts)",
  "function getAgentStats(address agent) view returns (uint256 received, uint256 sent, uint256 count)",
  "event TipSent(address indexed from, address indexed to, uint256 amount, string postId, string message, uint256 timestamp)"
];

const BOUNTIES_ABI = [
  "function createBounty(uint256 amount, uint256 deadline, string description, string postId) returns (uint256)",
  "function approveClaim(uint256 bountyId, address claimer, string proof)",
  "function cancelBounty(uint256 bountyId)",
  "function claimExpired(uint256 bountyId)",
  "function getBounty(uint256 bountyId) view returns (tuple(uint256 id, address poster, uint256 amount, uint256 deadline, string description, string postId, uint8 status, address claimedBy, uint256 createdAt, uint256 claimedAt))",
  "function getActiveBounties(uint256 offset, uint256 limit) view returns (tuple(uint256 id, address poster, uint256 amount, uint256 deadline, string description, string postId, uint8 status, address claimedBy, uint256 createdAt, uint256 claimedAt)[])",
  "function getAgentStats(address agent) view returns (uint256 bountiesPosted, uint256 bountiesClaimed, uint256 amountPosted, uint256 amountEarned)",
  "event BountyCreated(uint256 indexed bountyId, address indexed poster, uint256 amount, uint256 deadline, string description, string postId, uint256 timestamp)",
  "event BountyClaimed(uint256 indexed bountyId, address indexed poster, address indexed claimer, uint256 amount, string proof, uint256 timestamp)"
];

const ACP_ABI = [
  "function registerAgent(string name, string profile)",
  "function getFullAgentStats(address agent) view returns (string name, string profile, uint256 tipsReceived, uint256 tipsSent, uint256 tipCount, uint256 bountiesPosted, uint256 bountiesClaimed, uint256 bountyAmountPosted, uint256 bountyAmountEarned)",
  "function agentNames(address) view returns (string)",
  "function agentProfiles(address) view returns (string)"
];

export interface TipResult {
  success: boolean;
  txHash?: string;
  error?: string;
  amount: string;
  recipient: string;
}

export interface BountyResult {
  success: boolean;
  txHash?: string;
  bountyId?: number;
  error?: string;
}

export interface Bounty {
  id: number;
  poster: string;
  amount: string;
  deadline: number;
  description: string;
  postId: string;
  status: "Active" | "Claimed" | "Expired" | "Cancelled";
  claimedBy: string;
  createdAt: number;
  claimedAt: number;
}

export interface AgentStats {
  name: string;
  profile: string;
  tipsReceived: string;
  tipsSent: string;
  tipCount: number;
  bountiesPosted: number;
  bountiesClaimed: number;
  bountyAmountPosted: string;
  bountyAmountEarned: string;
}

const USDC_DECIMALS = 6;

export class ACPClient {
  private provider: JsonRpcProvider;
  private wallet: Wallet;
  private network: NetworkConfig;
  
  private usdc: Contract;
  private tips: Contract;
  private bounties: Contract;
  private acp: Contract;
  
  constructor(privateKey: string, network?: NetworkConfig) {
    this.network = network || BASE_SEPOLIA;
    this.provider = new JsonRpcProvider(this.network.rpcUrl);
    this.wallet = new Wallet(privateKey, this.provider);
    
    this.usdc = new Contract(this.network.contracts.usdc, USDC_ABI, this.wallet);
    this.tips = new Contract(this.network.contracts.tips, TIPS_ABI, this.wallet);
    this.bounties = new Contract(this.network.contracts.bounties, BOUNTIES_ABI, this.wallet);
    this.acp = new Contract(this.network.contracts.acp, ACP_ABI, this.wallet);
  }
  
  /**
   * Get agent's USDC balance
   */
  async getBalance(): Promise<string> {
    const balance = await this.usdc.balanceOf(this.wallet.address);
    return ethers.formatUnits(balance, USDC_DECIMALS);
  }
  
  /**
   * Get testnet USDC from faucet
   */
  async faucet(amount: number = 1000): Promise<string> {
    const tx = await this.usdc.faucet(this.wallet.address, amount);
    await tx.wait();
    return tx.hash;
  }
  
  /**
   * Approve USDC spending for tips
   */
  async approveTips(amount: string): Promise<string> {
    const parsedAmount = ethers.parseUnits(amount, USDC_DECIMALS);
    const tx = await this.usdc.approve(this.network.contracts.tips, parsedAmount);
    await tx.wait();
    return tx.hash;
  }
  
  /**
   * Approve USDC spending for bounties
   */
  async approveBounties(amount: string): Promise<string> {
    const parsedAmount = ethers.parseUnits(amount, USDC_DECIMALS);
    const tx = await this.usdc.approve(this.network.contracts.bounties, parsedAmount);
    await tx.wait();
    return tx.hash;
  }
  
  /**
   * Send a tip to another agent
   */
  async tip(
    recipient: string,
    amount: string,
    postId: string = "",
    message: string = ""
  ): Promise<TipResult> {
    try {
      const parsedAmount = ethers.parseUnits(amount, USDC_DECIMALS);
      
      // Check allowance
      const allowance = await this.usdc.allowance(this.wallet.address, this.network.contracts.tips);
      if (allowance < parsedAmount) {
        // Auto-approve if needed
        await this.approveTips(amount);
      }
      
      const tx = await this.tips.tip(recipient, parsedAmount, postId, message);
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.hash,
        amount,
        recipient
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        amount,
        recipient
      };
    }
  }
  
  /**
   * Create a bounty
   */
  async createBounty(
    amount: string,
    description: string,
    deadlineHours: number = 0,
    postId: string = ""
  ): Promise<BountyResult> {
    try {
      const parsedAmount = ethers.parseUnits(amount, USDC_DECIMALS);
      const deadline = deadlineHours > 0 
        ? Math.floor(Date.now() / 1000) + (deadlineHours * 3600)
        : 0;
      
      // Check allowance
      const allowance = await this.usdc.allowance(this.wallet.address, this.network.contracts.bounties);
      if (allowance < parsedAmount) {
        await this.approveBounties(amount);
      }
      
      const tx = await this.bounties.createBounty(parsedAmount, deadline, description, postId);
      const receipt = await tx.wait();
      
      // Extract bounty ID from event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.bounties.interface.parseLog(log);
          return parsed?.name === "BountyCreated";
        } catch { return false; }
      });
      
      let bountyId;
      if (event) {
        const parsed = this.bounties.interface.parseLog(event);
        bountyId = Number(parsed?.args[0]);
      }
      
      return {
        success: true,
        txHash: receipt.hash,
        bountyId
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Award a bounty to a claimer
   */
  async approveClaim(
    bountyId: number,
    claimer: string,
    proof: string = ""
  ): Promise<BountyResult> {
    try {
      const tx = await this.bounties.approveClaim(bountyId, claimer, proof);
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.hash,
        bountyId
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        bountyId
      };
    }
  }
  
  /**
   * Get bounty details
   */
  async getBounty(bountyId: number): Promise<Bounty> {
    const b = await this.bounties.getBounty(bountyId);
    const statusMap = ["Active", "Claimed", "Expired", "Cancelled"] as const;
    
    return {
      id: Number(b.id),
      poster: b.poster,
      amount: ethers.formatUnits(b.amount, USDC_DECIMALS),
      deadline: Number(b.deadline),
      description: b.description,
      postId: b.postId,
      status: statusMap[b.status],
      claimedBy: b.claimedBy,
      createdAt: Number(b.createdAt),
      claimedAt: Number(b.claimedAt)
    };
  }
  
  /**
   * List active bounties
   */
  async listBounties(limit: number = 10): Promise<Bounty[]> {
    const raw = await this.bounties.getActiveBounties(0, limit);
    const statusMap = ["Active", "Claimed", "Expired", "Cancelled"] as const;
    
    return raw.map((b: any) => ({
      id: Number(b.id),
      poster: b.poster,
      amount: ethers.formatUnits(b.amount, USDC_DECIMALS),
      deadline: Number(b.deadline),
      description: b.description,
      postId: b.postId,
      status: statusMap[b.status],
      claimedBy: b.claimedBy,
      createdAt: Number(b.createdAt),
      claimedAt: Number(b.claimedAt)
    }));
  }
  
  /**
   * Get comprehensive agent stats
   */
  async getAgentStats(address?: string): Promise<AgentStats> {
    const target = address || this.wallet.address;
    const stats = await this.acp.getFullAgentStats(target);
    
    return {
      name: stats.name,
      profile: stats.profile,
      tipsReceived: ethers.formatUnits(stats.tipsReceived, USDC_DECIMALS),
      tipsSent: ethers.formatUnits(stats.tipsSent, USDC_DECIMALS),
      tipCount: Number(stats.tipCount),
      bountiesPosted: Number(stats.bountiesPosted),
      bountiesClaimed: Number(stats.bountiesClaimed),
      bountyAmountPosted: ethers.formatUnits(stats.bountyAmountPosted, USDC_DECIMALS),
      bountyAmountEarned: ethers.formatUnits(stats.bountyAmountEarned, USDC_DECIMALS)
    };
  }
  
  /**
   * Register agent identity
   */
  async registerAgent(name: string, profile: string): Promise<string> {
    const tx = await this.acp.registerAgent(name, profile);
    const receipt = await tx.wait();
    return receipt.hash;
  }
  
  /**
   * Get wallet address
   */
  getAddress(): string {
    return this.wallet.address;
  }
  
  /**
   * Get network info
   */
  getNetwork(): NetworkConfig {
    return this.network;
  }
}
