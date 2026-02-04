/**
 * Demo script - runs after deployment to generate demo transactions
 */

const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const network = hre.network.name;
  console.log(`\n🎬 Running demo on ${network}...\n`);
  
  // Load deployment
  const deploymentPath = `./deployments/${network}.json`;
  if (!fs.existsSync(deploymentPath)) {
    console.error(`❌ No deployment found for ${network}`);
    console.log("   Run: npm run deploy:base");
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath));
  console.log("📋 Loaded deployment:", deployment.contracts);
  
  // Get signers
  const [deployer, agent1, agent2] = await hre.ethers.getSigners();
  console.log("\n👤 Deployer:", deployer.address);
  
  // Get contracts
  const usdc = await hre.ethers.getContractAt("MockUSDC", deployment.contracts.MockUSDC);
  const tips = await hre.ethers.getContractAt("ACPTips", deployment.contracts.ACPTips);
  const bounties = await hre.ethers.getContractAt("ACPBounties", deployment.contracts.ACPBounties);
  const acp = await hre.ethers.getContractAt("ACP", deployment.contracts.ACP);
  
  const demoTxs = [];
  
  // 1. Faucet - get USDC
  console.log("\n1️⃣ Getting USDC from faucet...");
  let tx = await usdc.faucet(deployer.address, 10000);
  let receipt = await tx.wait();
  demoTxs.push({ action: "Faucet", hash: receipt.hash });
  console.log("   ✅ Received 10,000 USDC");
  console.log("   🔗 Tx:", receipt.hash);
  
  // 2. Approve tips contract
  console.log("\n2️⃣ Approving tips contract...");
  tx = await usdc.approve(deployment.contracts.ACPTips, hre.ethers.parseUnits("10000", 6));
  receipt = await tx.wait();
  demoTxs.push({ action: "Approve Tips", hash: receipt.hash });
  console.log("   ✅ Approved");
  
  // 3. Send a tip (to self for demo, or use a demo address)
  const demoRecipient = "0x0000000000000000000000000000000000000001"; // Burn address for demo
  console.log("\n3️⃣ Sending tip...");
  tx = await tips.tip(
    demoRecipient,
    hre.ethers.parseUnits("100", 6),
    "demo-post-001",
    "Great post! Here's a tip via ACP."
  );
  receipt = await tx.wait();
  demoTxs.push({ action: "Tip", hash: receipt.hash, amount: "100 USDC" });
  console.log("   ✅ Tipped 100 USDC");
  console.log("   🔗 Tx:", receipt.hash);
  
  // 4. Approve bounties contract
  console.log("\n4️⃣ Approving bounties contract...");
  tx = await usdc.approve(deployment.contracts.ACPBounties, hre.ethers.parseUnits("10000", 6));
  receipt = await tx.wait();
  demoTxs.push({ action: "Approve Bounties", hash: receipt.hash });
  console.log("   ✅ Approved");
  
  // 5. Create a bounty
  console.log("\n5️⃣ Creating bounty...");
  const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours
  tx = await bounties.createBounty(
    hre.ethers.parseUnits("500", 6),
    deadline,
    "Find information about the latest AI agent developments",
    "demo-bounty-post"
  );
  receipt = await tx.wait();
  demoTxs.push({ action: "Create Bounty", hash: receipt.hash, amount: "500 USDC" });
  console.log("   ✅ Bounty #1 created for 500 USDC");
  console.log("   🔗 Tx:", receipt.hash);
  
  // 6. Register agent identity
  console.log("\n6️⃣ Registering agent identity...");
  tx = await acp.registerAgent("TheoACP", "https://moltbook.com/u/TheoLevy");
  receipt = await tx.wait();
  demoTxs.push({ action: "Register Agent", hash: receipt.hash });
  console.log("   ✅ Registered as TheoACP");
  console.log("   🔗 Tx:", receipt.hash);
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ DEMO COMPLETE");
  console.log("=".repeat(60));
  console.log("\n📋 Demo Transactions:");
  for (const demo of demoTxs) {
    const explorerUrl = network === "baseSepolia" 
      ? `https://sepolia.basescan.org/tx/${demo.hash}`
      : demo.hash;
    console.log(`   ${demo.action}${demo.amount ? ` (${demo.amount})` : ""}`);
    console.log(`   └─ ${explorerUrl}`);
  }
  
  // Save demo transactions
  const demoPath = `./deployments/${network}-demo.json`;
  fs.writeFileSync(demoPath, JSON.stringify({
    network,
    timestamp: new Date().toISOString(),
    transactions: demoTxs
  }, null, 2));
  console.log(`\n📁 Demo saved to: ${demoPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Demo failed:", error);
    process.exit(1);
  });
