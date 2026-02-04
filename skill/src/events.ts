/**
 * ACP Event Listener
 * 
 * Subscribe to on-chain events for tips and bounties.
 * Useful for building notification systems and analytics.
 */

import { ethers, Contract, JsonRpcProvider } from "ethers";
import { NetworkConfig, getNetwork, BASE_SEPOLIA } from "./config";

// Event signatures
const TIPS_EVENTS = [
  "event TipSent(address indexed from, address indexed to, uint256 amount, string postId, string message, uint256 timestamp)",
  "event BatchTipSent(address indexed from, address[] recipients, uint256[] amounts, uint256 totalAmount, uint256 timestamp)"
];

const BOUNTIES_EVENTS = [
  "event BountyCreated(uint256 indexed bountyId, address indexed poster, uint256 amount, uint256 deadline, string description, string postId, uint256 timestamp)",
  "event BountyClaimed(uint256 indexed bountyId, address indexed poster, address indexed claimer, uint256 amount, string proof, uint256 timestamp)",
  "event BountyCancelled(uint256 indexed bountyId, address indexed poster, uint256 amountReturned, uint256 timestamp)",
  "event BountyExpired(uint256 indexed bountyId, address indexed poster, uint256 amountReturned, uint256 timestamp)"
];

export interface TipEvent {
  from: string;
  to: string;
  amount: string;
  postId: string;
  message: string;
  timestamp: number;
  txHash: string;
  blockNumber: number;
}

export interface BountyEvent {
  bountyId: number;
  poster: string;
  amount: string;
  eventType: "created" | "claimed" | "cancelled" | "expired";
  claimer?: string;
  proof?: string;
  timestamp: number;
  txHash: string;
  blockNumber: number;
}

const USDC_DECIMALS = 6;

export class ACPEventListener {
  private provider: JsonRpcProvider;
  private network: NetworkConfig;
  private tipsContract: Contract;
  private bountiesContract: Contract;
  
  constructor(network?: NetworkConfig) {
    this.network = network || BASE_SEPOLIA;
    this.provider = new JsonRpcProvider(this.network.rpcUrl);
    
    this.tipsContract = new Contract(
      this.network.contracts.tips,
      TIPS_EVENTS,
      this.provider
    );
    
    this.bountiesContract = new Contract(
      this.network.contracts.bounties,
      BOUNTIES_EVENTS,
      this.provider
    );
  }
  
  /**
   * Listen for new tips
   */
  onTip(callback: (tip: TipEvent) => void): void {
    this.tipsContract.on("TipSent", (from, to, amount, postId, message, timestamp, event) => {
      callback({
        from,
        to,
        amount: ethers.formatUnits(amount, USDC_DECIMALS),
        postId,
        message,
        timestamp: Number(timestamp),
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber
      });
    });
  }
  
  /**
   * Listen for new bounties
   */
  onBountyCreated(callback: (bounty: BountyEvent) => void): void {
    this.bountiesContract.on("BountyCreated", (bountyId, poster, amount, deadline, description, postId, timestamp, event) => {
      callback({
        bountyId: Number(bountyId),
        poster,
        amount: ethers.formatUnits(amount, USDC_DECIMALS),
        eventType: "created",
        timestamp: Number(timestamp),
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber
      });
    });
  }
  
  /**
   * Listen for claimed bounties
   */
  onBountyClaimed(callback: (bounty: BountyEvent) => void): void {
    this.bountiesContract.on("BountyClaimed", (bountyId, poster, claimer, amount, proof, timestamp, event) => {
      callback({
        bountyId: Number(bountyId),
        poster,
        claimer,
        amount: ethers.formatUnits(amount, USDC_DECIMALS),
        eventType: "claimed",
        proof,
        timestamp: Number(timestamp),
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber
      });
    });
  }
  
  /**
   * Get historical tips
   */
  async getTipHistory(
    fromBlock: number = 0,
    toBlock: number | "latest" = "latest"
  ): Promise<TipEvent[]> {
    const filter = this.tipsContract.filters.TipSent();
    const events = await this.tipsContract.queryFilter(filter, fromBlock, toBlock);
    
    return events.map((event: any) => ({
      from: event.args[0],
      to: event.args[1],
      amount: ethers.formatUnits(event.args[2], USDC_DECIMALS),
      postId: event.args[3],
      message: event.args[4],
      timestamp: Number(event.args[5]),
      txHash: event.transactionHash,
      blockNumber: event.blockNumber
    }));
  }
  
  /**
   * Get tips for a specific recipient
   */
  async getTipsFor(address: string, fromBlock: number = 0): Promise<TipEvent[]> {
    const filter = this.tipsContract.filters.TipSent(null, address);
    const events = await this.tipsContract.queryFilter(filter, fromBlock, "latest");
    
    return events.map((event: any) => ({
      from: event.args[0],
      to: event.args[1],
      amount: ethers.formatUnits(event.args[2], USDC_DECIMALS),
      postId: event.args[3],
      message: event.args[4],
      timestamp: Number(event.args[5]),
      txHash: event.transactionHash,
      blockNumber: event.blockNumber
    }));
  }
  
  /**
   * Stop listening to all events
   */
  removeAllListeners(): void {
    this.tipsContract.removeAllListeners();
    this.bountiesContract.removeAllListeners();
  }
}
