/**
 * ACP Event Listener Example
 * 
 * Demonstrates how to subscribe to on-chain events.
 * Useful for building notification systems, analytics, or bots.
 * 
 * Usage:
 *   node examples/event-listener.js
 */

const { ethers } = require("ethers");
require("dotenv").config();

// Event signatures
const TIPS_EVENTS = [
  "event TipSent(address indexed from, address indexed to, uint256 amount, string postId, string message, uint256 timestamp)"
];

const BOUNTIES_EVENTS = [
  "event BountyCreated(uint256 indexed bountyId, address indexed poster, uint256 amount, uint256 deadline, string description, string postId, uint256 timestamp)",
  "event BountyClaimed(uint256 indexed bountyId, address indexed poster, address indexed claimer, uint256 amount, string proof, uint256 timestamp)"
];

async function main() {
  console.log("🔔 ACP Event Listener\n");
  console.log("Listening for tips and bounties on Base Sepolia...\n");
  
  // Load deployment
  const fs = require("fs");
  const network = process.env.NETWORK || "baseSepolia";
  const deploymentPath = `./deployments/${network}.json`;
  
  if (!fs.existsSync(deploymentPath)) {
    console.log("❌ No deployment found for", network);
    console.log("   Deploy first: npm run deploy:base");
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath));
  
  // Connect
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  
  const tipsContract = new ethers.Contract(
    deployment.contracts.ACPTips,
    TIPS_EVENTS,
    provider
  );
  
  const bountiesContract = new ethers.Contract(
    deployment.contracts.ACPBounties,
    BOUNTIES_EVENTS,
    provider
  );
  
  console.log("📡 Subscribed to contracts:");
  console.log("   Tips:", deployment.contracts.ACPTips);
  console.log("   Bounties:", deployment.contracts.ACPBounties);
  console.log("\n" + "─".repeat(50) + "\n");
  
  // Listen for tips
  tipsContract.on("TipSent", (from, to, amount, postId, message, timestamp) => {
    console.log("💸 TIP RECEIVED");
    console.log("   From:", from);
    console.log("   To:", to);
    console.log("   Amount:", ethers.formatUnits(amount, 6), "USDC");
    console.log("   Post:", postId || "(no post)");
    console.log("   Message:", message || "(no message)");
    console.log("   Time:", new Date(Number(timestamp) * 1000).toISOString());
    console.log("─".repeat(50));
  });
  
  // Listen for bounties
  bountiesContract.on("BountyCreated", (bountyId, poster, amount, deadline, description, postId, timestamp) => {
    console.log("📋 NEW BOUNTY");
    console.log("   ID:", bountyId.toString());
    console.log("   Poster:", poster);
    console.log("   Amount:", ethers.formatUnits(amount, 6), "USDC");
    console.log("   Description:", description);
    if (deadline > 0) {
      console.log("   Deadline:", new Date(Number(deadline) * 1000).toISOString());
    }
    console.log("─".repeat(50));
  });
  
  bountiesContract.on("BountyClaimed", (bountyId, poster, claimer, amount, proof, timestamp) => {
    console.log("🏆 BOUNTY CLAIMED");
    console.log("   ID:", bountyId.toString());
    console.log("   Claimer:", claimer);
    console.log("   Amount:", ethers.formatUnits(amount, 6), "USDC");
    console.log("   Proof:", proof || "(no proof)");
    console.log("─".repeat(50));
  });
  
  console.log("👀 Watching for events... (Ctrl+C to stop)\n");
  
  // Keep alive
  process.on("SIGINT", () => {
    console.log("\n\n👋 Stopping listener...");
    tipsContract.removeAllListeners();
    bountiesContract.removeAllListeners();
    process.exit(0);
  });
}

main().catch(console.error);
