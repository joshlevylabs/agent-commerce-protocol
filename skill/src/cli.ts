#!/usr/bin/env node
/**
 * ACP CLI - Agent Commerce Protocol Command Line Interface
 * 
 * Usage:
 *   acp balance                              - Check USDC balance
 *   acp faucet [amount]                      - Get testnet USDC
 *   acp tip <address> <amount> [postId]      - Send a tip
 *   acp bounty create <amount> <description> - Create a bounty
 *   acp bounty list                          - List active bounties
 *   acp bounty award <id> <claimer>          - Award a bounty
 *   acp stats [address]                      - Get agent stats
 *   acp register <name> <profile>            - Register agent identity
 */

import { Command } from "commander";
import { ACPClient } from "./acp";
import { getNetwork, BASE_SEPOLIA, HARDHAT_LOCAL } from "./config";
import * as dotenv from "dotenv";

dotenv.config();

const program = new Command();

function getClient(): ACPClient {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY environment variable required");
    process.exit(1);
  }
  
  const network = process.env.NETWORK === "local" ? HARDHAT_LOCAL : BASE_SEPOLIA;
  return new ACPClient(privateKey, network);
}

program
  .name("acp")
  .description("Agent Commerce Protocol CLI - Agent-to-agent commerce with USDC")
  .version("1.0.0");

program
  .command("balance")
  .description("Check USDC balance")
  .action(async () => {
    const client = getClient();
    const balance = await client.getBalance();
    console.log(`💰 Balance: ${balance} USDC`);
    console.log(`📍 Address: ${client.getAddress()}`);
    console.log(`🌐 Network: ${client.getNetwork().name}`);
  });

program
  .command("faucet")
  .description("Get testnet USDC from faucet")
  .argument("[amount]", "Amount in USDC", "1000")
  .action(async (amount: string) => {
    const client = getClient();
    console.log(`🚰 Requesting ${amount} USDC from faucet...`);
    
    try {
      const txHash = await client.faucet(parseInt(amount));
      console.log(`✅ Received ${amount} USDC`);
      console.log(`🔗 Tx: ${client.getNetwork().explorerUrl}/tx/${txHash}`);
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  });

program
  .command("tip")
  .description("Send a tip to another agent")
  .argument("<address>", "Recipient address")
  .argument("<amount>", "Amount in USDC")
  .argument("[postId]", "Post ID reference", "")
  .option("-m, --message <message>", "Optional message", "")
  .action(async (address: string, amount: string, postId: string, options: any) => {
    const client = getClient();
    console.log(`💸 Tipping ${amount} USDC to ${address}...`);
    
    const result = await client.tip(address, amount, postId, options.message);
    
    if (result.success) {
      console.log(`✅ Tip sent successfully!`);
      console.log(`🔗 Tx: ${client.getNetwork().explorerUrl}/tx/${result.txHash}`);
    } else {
      console.error(`❌ Error: ${result.error}`);
    }
  });

const bountyCmd = program
  .command("bounty")
  .description("Bounty commands");

bountyCmd
  .command("create")
  .description("Create a new bounty")
  .argument("<amount>", "Bounty amount in USDC")
  .argument("<description>", "Bounty description")
  .option("-d, --deadline <hours>", "Deadline in hours", "0")
  .option("-p, --post <postId>", "Moltbook post ID", "")
  .action(async (amount: string, description: string, options: any) => {
    const client = getClient();
    console.log(`📋 Creating bounty for ${amount} USDC...`);
    
    const result = await client.createBounty(
      amount,
      description,
      parseInt(options.deadline),
      options.post
    );
    
    if (result.success) {
      console.log(`✅ Bounty #${result.bountyId} created!`);
      console.log(`🔗 Tx: ${client.getNetwork().explorerUrl}/tx/${result.txHash}`);
    } else {
      console.error(`❌ Error: ${result.error}`);
    }
  });

bountyCmd
  .command("list")
  .description("List active bounties")
  .option("-l, --limit <limit>", "Max results", "10")
  .action(async (options: any) => {
    const client = getClient();
    console.log("📋 Active Bounties:\n");
    
    const bounties = await client.listBounties(parseInt(options.limit));
    
    if (bounties.length === 0) {
      console.log("  No active bounties found.");
      return;
    }
    
    for (const b of bounties) {
      console.log(`  #${b.id} | ${b.amount} USDC`);
      console.log(`     ${b.description}`);
      console.log(`     Posted by: ${b.poster.slice(0, 10)}...`);
      if (b.deadline > 0) {
        const deadline = new Date(b.deadline * 1000);
        console.log(`     Deadline: ${deadline.toLocaleString()}`);
      }
      console.log("");
    }
  });

bountyCmd
  .command("award")
  .description("Award a bounty to a claimer")
  .argument("<id>", "Bounty ID")
  .argument("<claimer>", "Claimer address")
  .option("-p, --proof <proof>", "Proof of completion", "")
  .action(async (id: string, claimer: string, options: any) => {
    const client = getClient();
    console.log(`🏆 Awarding bounty #${id} to ${claimer}...`);
    
    const result = await client.approveClaim(parseInt(id), claimer, options.proof);
    
    if (result.success) {
      console.log(`✅ Bounty awarded!`);
      console.log(`🔗 Tx: ${client.getNetwork().explorerUrl}/tx/${result.txHash}`);
    } else {
      console.error(`❌ Error: ${result.error}`);
    }
  });

bountyCmd
  .command("view")
  .description("View bounty details")
  .argument("<id>", "Bounty ID")
  .action(async (id: string) => {
    const client = getClient();
    
    try {
      const b = await client.getBounty(parseInt(id));
      console.log(`\n📋 Bounty #${b.id}`);
      console.log(`   Amount: ${b.amount} USDC`);
      console.log(`   Status: ${b.status}`);
      console.log(`   Description: ${b.description}`);
      console.log(`   Poster: ${b.poster}`);
      if (b.deadline > 0) {
        console.log(`   Deadline: ${new Date(b.deadline * 1000).toLocaleString()}`);
      }
      if (b.claimedBy !== "0x0000000000000000000000000000000000000000") {
        console.log(`   Claimed by: ${b.claimedBy}`);
      }
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  });

program
  .command("stats")
  .description("Get agent statistics")
  .argument("[address]", "Agent address (default: your address)")
  .action(async (address?: string) => {
    const client = getClient();
    const stats = await client.getAgentStats(address);
    
    console.log(`\n📊 Agent Stats${stats.name ? ` - ${stats.name}` : ""}`);
    console.log("─".repeat(40));
    console.log(`   Tips Received: ${stats.tipsReceived} USDC (${stats.tipCount} tips)`);
    console.log(`   Tips Sent: ${stats.tipsSent} USDC`);
    console.log(`   Bounties Posted: ${stats.bountiesPosted} (${stats.bountyAmountPosted} USDC)`);
    console.log(`   Bounties Claimed: ${stats.bountiesClaimed} (${stats.bountyAmountEarned} USDC earned)`);
    if (stats.profile) {
      console.log(`   Profile: ${stats.profile}`);
    }
  });

program
  .command("register")
  .description("Register agent identity")
  .argument("<name>", "Agent name")
  .argument("<profile>", "Profile URL (e.g., Moltbook)")
  .action(async (name: string, profile: string) => {
    const client = getClient();
    console.log(`📝 Registering agent "${name}"...`);
    
    try {
      const txHash = await client.registerAgent(name, profile);
      console.log(`✅ Registered!`);
      console.log(`🔗 Tx: ${client.getNetwork().explorerUrl}/tx/${txHash}`);
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  });

program.parse();
