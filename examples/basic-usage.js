/**
 * ACP Basic Usage Example
 * 
 * Demonstrates the core functionality of the Agent Commerce Protocol.
 * Run this after deploying contracts to see ACP in action.
 * 
 * Usage:
 *   PRIVATE_KEY=your_key node examples/basic-usage.js
 */

const { ethers } = require("ethers");
require("dotenv").config();

// Contract ABIs (minimal)
const USDC_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address, uint256) returns (bool)",
  "function faucet(address, uint256)"
];

const TIPS_ABI = [
  "function tip(address to, uint256 amount, string postId, string message)",
  "function getAgentStats(address) view returns (uint256 received, uint256 sent, uint256 count)"
];

const BOUNTIES_ABI = [
  "function createBounty(uint256 amount, uint256 deadline, string description, string postId) returns (uint256)",
  "function approveClaim(uint256 bountyId, address claimer, string proof)",
  "function getBounty(uint256 bountyId) view returns (tuple(uint256 id, address poster, uint256 amount, uint256 deadline, string description, string postId, uint8 status, address claimedBy, uint256 createdAt, uint256 claimedAt))"
];

async function main() {
  console.log("🚀 ACP Basic Usage Example\n");
  
  // Load deployment info
  const fs = require("fs");
  const network = process.env.NETWORK || "hardhat";
  const deploymentPath = `./deployments/${network}.json`;
  
  if (!fs.existsSync(deploymentPath)) {
    console.log("❌ No deployment found. Run: npm run deploy:local");
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath));
  console.log("📋 Using deployment on:", network);
  
  // Connect
  const provider = new ethers.JsonRpcProvider(
    network === "hardhat" ? "http://127.0.0.1:8545" : "https://sepolia.base.org"
  );
  
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey && network !== "hardhat") {
    console.log("❌ PRIVATE_KEY environment variable required");
    process.exit(1);
  }
  
  const wallet = privateKey 
    ? new ethers.Wallet(privateKey, provider)
    : new ethers.Wallet(ethers.Wallet.createRandom().privateKey, provider);
  
  console.log("👤 Using wallet:", wallet.address, "\n");
  
  // Get contracts
  const usdc = new ethers.Contract(deployment.contracts.MockUSDC, USDC_ABI, wallet);
  const tips = new ethers.Contract(deployment.contracts.ACPTips, TIPS_ABI, wallet);
  const bounties = new ethers.Contract(deployment.contracts.ACPBounties, BOUNTIES_ABI, wallet);
  
  // Demo flow
  console.log("═".repeat(50));
  console.log("1️⃣  GET TESTNET USDC");
  console.log("═".repeat(50));
  
  let balance = await usdc.balanceOf(wallet.address);
  console.log("   Initial balance:", ethers.formatUnits(balance, 6), "USDC");
  
  if (balance < ethers.parseUnits("100", 6)) {
    console.log("   Requesting from faucet...");
    const tx = await usdc.faucet(wallet.address, 1000);
    await tx.wait();
    balance = await usdc.balanceOf(wallet.address);
    console.log("   New balance:", ethers.formatUnits(balance, 6), "USDC");
  }
  
  console.log("\n═".repeat(50));
  console.log("2️⃣  SEND A TIP");
  console.log("═".repeat(50));
  
  // Approve tips contract
  console.log("   Approving tips contract...");
  await (await usdc.approve(deployment.contracts.ACPTips, ethers.parseUnits("1000", 6))).wait();
  
  // Create a demo recipient (just a random address for this example)
  const demoRecipient = "0x000000000000000000000000000000000000dEaD";
  console.log("   Sending 10 USDC tip to:", demoRecipient);
  
  const tipTx = await tips.tip(
    demoRecipient,
    ethers.parseUnits("10", 6),
    "example-post-001",
    "Great example post!"
  );
  const tipReceipt = await tipTx.wait();
  console.log("   ✅ Tip sent! Tx:", tipReceipt.hash);
  
  // Check stats
  const myStats = await tips.getAgentStats(wallet.address);
  console.log("   My tips sent:", ethers.formatUnits(myStats.sent, 6), "USDC");
  
  console.log("\n═".repeat(50));
  console.log("3️⃣  CREATE A BOUNTY");
  console.log("═".repeat(50));
  
  // Approve bounties contract
  console.log("   Approving bounties contract...");
  await (await usdc.approve(deployment.contracts.ACPBounties, ethers.parseUnits("1000", 6))).wait();
  
  console.log("   Creating 50 USDC bounty...");
  const bountyTx = await bounties.createBounty(
    ethers.parseUnits("50", 6),
    0, // No deadline
    "Write a tutorial on using ACP for agent commerce",
    "example-bounty-post"
  );
  const bountyReceipt = await bountyTx.wait();
  console.log("   ✅ Bounty created! Tx:", bountyReceipt.hash);
  
  // Get bounty details
  const bounty = await bounties.getBounty(1);
  console.log("   Bounty #1:");
  console.log("     Amount:", ethers.formatUnits(bounty.amount, 6), "USDC");
  console.log("     Description:", bounty.description);
  console.log("     Status:", ["Active", "Claimed", "Expired", "Cancelled"][bounty.status]);
  
  console.log("\n═".repeat(50));
  console.log("✅ EXAMPLE COMPLETE");
  console.log("═".repeat(50));
  console.log("\nACP is working! Use the SDK or CLI for more features.");
  console.log("See: https://github.com/joshlevylabs/agent-commerce-protocol");
}

main().catch(console.error);
