const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Agent Commerce Protocol (ACP)...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");
  
  // 1. Deploy MockUSDC (for testnet)
  console.log("1️⃣ Deploying MockUSDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("   MockUSDC deployed to:", usdcAddress);
  
  // 2. Deploy ACPTips
  console.log("\n2️⃣ Deploying ACPTips...");
  const ACPTips = await hre.ethers.getContractFactory("ACPTips");
  const tips = await ACPTips.deploy(usdcAddress);
  await tips.waitForDeployment();
  const tipsAddress = await tips.getAddress();
  console.log("   ACPTips deployed to:", tipsAddress);
  
  // 3. Deploy ACPBounties
  console.log("\n3️⃣ Deploying ACPBounties...");
  const ACPBounties = await hre.ethers.getContractFactory("ACPBounties");
  const bounties = await ACPBounties.deploy(usdcAddress);
  await bounties.waitForDeployment();
  const bountiesAddress = await bounties.getAddress();
  console.log("   ACPBounties deployed to:", bountiesAddress);
  
  // 4. Deploy ACP Registry
  console.log("\n4️⃣ Deploying ACP Registry...");
  const ACP = await hre.ethers.getContractFactory("ACP");
  const acp = await ACP.deploy(usdcAddress, tipsAddress, bountiesAddress);
  await acp.waitForDeployment();
  const acpAddress = await acp.getAddress();
  console.log("   ACP deployed to:", acpAddress);
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log(`   MockUSDC:     ${usdcAddress}`);
  console.log(`   ACPTips:      ${tipsAddress}`);
  console.log(`   ACPBounties:  ${bountiesAddress}`);
  console.log(`   ACP:          ${acpAddress}`);
  
  // Save deployment info
  const fs = require("fs");
  const deployment = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      MockUSDC: usdcAddress,
      ACPTips: tipsAddress,
      ACPBounties: bountiesAddress,
      ACP: acpAddress
    }
  };
  
  fs.writeFileSync(
    `./deployments/${hre.network.name}.json`,
    JSON.stringify(deployment, null, 2)
  );
  console.log(`\n📁 Deployment saved to: ./deployments/${hre.network.name}.json`);
  
  // Verification commands
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 To verify contracts on explorer:");
    console.log(`   npx hardhat verify --network ${hre.network.name} ${usdcAddress}`);
    console.log(`   npx hardhat verify --network ${hre.network.name} ${tipsAddress} "${usdcAddress}"`);
    console.log(`   npx hardhat verify --network ${hre.network.name} ${bountiesAddress} "${usdcAddress}"`);
    console.log(`   npx hardhat verify --network ${hre.network.name} ${acpAddress} "${usdcAddress}" "${tipsAddress}" "${bountiesAddress}"`);
  }
  
  return deployment;
}

main()
  .then((deployment) => {
    console.log("\n🎉 Success!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
