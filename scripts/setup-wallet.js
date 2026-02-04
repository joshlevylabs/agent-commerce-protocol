/**
 * Generate a new wallet for testing
 * DO NOT use for mainnet funds!
 */

const { ethers } = require("ethers");

console.log("🔑 Generating new testnet wallet...\n");

const wallet = ethers.Wallet.createRandom();

console.log("⚠️  TESTNET ONLY - DO NOT USE FOR REAL FUNDS\n");
console.log("Address:", wallet.address);
console.log("Private Key:", wallet.privateKey);
console.log("");
console.log("📝 Next steps:");
console.log("1. Copy the private key (without 0x) to .env:");
console.log(`   PRIVATE_KEY=${wallet.privateKey.slice(2)}`);
console.log("");
console.log("2. Get testnet ETH for gas:");
console.log("   - Base Sepolia Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
console.log("   - Alternative: https://faucet.quicknode.com/base/sepolia");
console.log("");
console.log("3. Deploy contracts:");
console.log("   npm run deploy:base");
