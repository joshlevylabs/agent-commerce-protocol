# Deployment Guide

## Quick Start (When Ready)

Once you have testnet ETH in the deployment wallet, follow these steps:

### 1. Fund the Wallet

**Wallet Address:** `0x3fc7E34Db443c0136d066552847A37ce231570A2`

Get Base Sepolia ETH from:
- https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet (recommended)
- https://faucet.quicknode.com/base/sepolia

You need ~0.01 ETH for deployment (~0.002 ETH per contract).

### 2. Deploy Contracts

```bash
cd /Users/joshualevy/clawd/projects/usdc-hackathon
npm run deploy:base
```

Expected output:
```
🚀 Deploying Agent Commerce Protocol (ACP)...

1️⃣ Deploying MockUSDC...
   MockUSDC deployed to: 0x...

2️⃣ Deploying ACPTips...
   ACPTips deployed to: 0x...

3️⃣ Deploying ACPBounties...
   ACPBounties deployed to: 0x...

4️⃣ Deploying ACP Registry...
   ACP deployed to: 0x...

✅ DEPLOYMENT COMPLETE
```

### 3. Run Demo Transactions

```bash
npm run demo:base
```

This will:
- Get USDC from faucet
- Send a demo tip
- Create a demo bounty
- Register agent identity
- Output transaction hashes for the submission

### 4. Update Documentation

After deployment, update these files with actual addresses:

1. `skill/src/config.ts` - Update BASE_SEPOLIA contracts
2. `README.md` - Update contract addresses section
3. `SUBMISSION_FINAL.md` - Add contract and transaction links

### 5. Rebuild Skill

```bash
cd skill && npm run build
```

### 6. Commit and Push

```bash
git add -A
git commit -m "Deploy to Base Sepolia with addresses"
git push origin main
```

### 7. Submit to Moltbook

Post the content from `SUBMISSION_FINAL.md` to:
- https://www.moltbook.com/m/usdc

Make sure to:
- Start with `#USDCHackathon ProjectSubmission AgenticCommerce`
- Include all contract addresses
- Include demo transaction links
- Include GitHub link

### 8. Vote on 5 Projects

To be eligible for prizes, you must vote on at least 5 other projects.

Format for voting:
```
#USDCHackathon Vote

[Your analysis of why this project is good]
```

---

## Verification (Optional but Recommended)

Verify contracts on BaseScan:

```bash
npx hardhat verify --network baseSepolia <MockUSDC_ADDRESS>
npx hardhat verify --network baseSepolia <ACPTips_ADDRESS> "<MockUSDC_ADDRESS>"
npx hardhat verify --network baseSepolia <ACPBounties_ADDRESS> "<MockUSDC_ADDRESS>"
npx hardhat verify --network baseSepolia <ACP_ADDRESS> "<MockUSDC_ADDRESS>" "<ACPTips_ADDRESS>" "<ACPBounties_ADDRESS>"
```

---

## Troubleshooting

### "Insufficient funds"
- Need more testnet ETH. Get from faucet.

### "Nonce too low"
- Previous transaction pending. Wait or reset nonce.

### "Contract not found"
- Network mismatch. Check you're on Base Sepolia.

---

*Ready to deploy when you are. 🔺*
