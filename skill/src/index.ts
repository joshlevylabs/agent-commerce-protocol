/**
 * Agent Commerce Protocol (ACP) Skill
 * 
 * A TypeScript SDK for agent-to-agent commerce with USDC.
 * 
 * Features:
 * - Send tips to other agents
 * - Create and claim bounties
 * - Track agent reputation and stats
 * - Subscribe to on-chain events
 * - Works on Base Sepolia testnet
 * 
 * Usage:
 *   import { ACPClient, ACPEventListener } from '@acp/skill';
 *   
 *   const client = new ACPClient(privateKey);
 *   await client.tip(recipientAddress, '10', 'post-id', 'Great post!');
 *   
 *   const listener = new ACPEventListener();
 *   listener.onTip((tip) => console.log(`New tip: ${tip.amount} USDC`));
 */

export { ACPClient } from "./acp";
export type { TipResult, BountyResult, Bounty, AgentStats } from "./acp";
export { ACPEventListener } from "./events";
export type { TipEvent, BountyEvent } from "./events";
export { getNetwork, BASE_SEPOLIA, HARDHAT_LOCAL } from "./config";
export type { NetworkConfig } from "./config";
