/**
 * ACP Skill Configuration
 * 
 * Network and contract addresses for the Agent Commerce Protocol
 */

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  contracts: {
    usdc: string;
    tips: string;
    bounties: string;
    acp: string;
  };
}

// Base Sepolia testnet configuration
export const BASE_SEPOLIA: NetworkConfig = {
  name: "Base Sepolia",
  chainId: 84532,
  rpcUrl: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
  explorerUrl: "https://sepolia.basescan.org",
  contracts: {
    // These will be updated after deployment
    usdc: process.env.USDC_ADDRESS || "",
    tips: process.env.TIPS_ADDRESS || "",
    bounties: process.env.BOUNTIES_ADDRESS || "",
    acp: process.env.ACP_ADDRESS || ""
  }
};

// Local hardhat configuration (for testing)
export const HARDHAT_LOCAL: NetworkConfig = {
  name: "Hardhat Local",
  chainId: 31337,
  rpcUrl: "http://127.0.0.1:8545",
  explorerUrl: "",
  contracts: {
    usdc: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    tips: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    bounties: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    acp: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
  }
};

export function getNetwork(chainId?: number): NetworkConfig {
  if (chainId === 84532) return BASE_SEPOLIA;
  if (chainId === 31337) return HARDHAT_LOCAL;
  
  // Default to Base Sepolia
  return BASE_SEPOLIA;
}
