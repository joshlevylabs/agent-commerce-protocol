# Agent Commerce Protocol (ACP) — USDC Hackathon

## Mission
Build a tipping and bounty system for agent networks. Win the Agentic Commerce track.

## Deadline
- Voting opens: Feb 4, 9 AM PST
- Submission closes: Feb 8, 12 PM PST

---

## Tonight's Roadmap (Feb 3-4, 2026)

### Phase 1: Architecture & Setup (9:30 PM - 10:30 PM) ✅ COMPLETE
- [x] Create project structure
- [x] Define smart contract interfaces
- [x] Choose chain (Base Sepolia)
- [x] Set up Hardhat for contract development
- [x] Research USDC testnet faucets

### Phase 2: Smart Contract Development (10:30 PM - 1:00 AM) ✅ COMPLETE
- [x] MockUSDC.sol — Testnet USDC with faucet
- [x] ACPTips.sol — Direct tipping between addresses
  - tip(recipient, amount, postId, message)
  - batchTip for multiple recipients
  - Emits TipSent event with metadata
  - Agent stats tracking
- [x] ACPBounties.sol — Bounty escrow system
  - createBounty(amount, deadline, description, postId)
  - approveClaim(bountyId, claimer, proof)
  - cancelBounty, claimExpired
  - Escrow holds USDC until claimed or expired
- [x] ACP.sol — Registry and unified interface
- [x] All 14 tests passing
- [ ] Deploy to Base Sepolia testnet (needs wallet with testnet ETH)
- [ ] Verify contracts on explorer

### Phase 3: Agent Skill Development (1:00 AM - 3:00 AM) ✅ COMPLETE
- [x] Create OpenClaw skill structure
- [x] TypeScript SDK (ACPClient class)
- [x] CLI commands:
  - `acp balance` — Check USDC balance
  - `acp faucet` — Get testnet USDC
  - `acp tip <address> <amount> [postId]` — Send a tip
  - `acp bounty create <amount> <description>` — Post a bounty
  - `acp bounty list` — List active bounties
  - `acp bounty view <id>` — View bounty details
  - `acp bounty award <id> <claimer>` — Award bounty
  - `acp stats [address]` — View agent stats
  - `acp register <name> <profile>` — Register identity
- [x] Integration with Base Sepolia RPC
- [x] Error handling and auto-approval

### Phase 4: Testing & Demo (3:00 AM - 5:00 AM)
- [ ] Deploy to Base Sepolia (need wallet + testnet ETH)
- [ ] Get testnet USDC from faucet
- [ ] Execute tip transactions
- [ ] Create and claim test bounties
- [ ] Capture transaction hashes for demo
- [ ] Test skill end-to-end on testnet

### Phase 5: Documentation & Submission Prep (5:00 AM - 6:30 AM) ✅ MOSTLY COMPLETE
- [x] Write README with full documentation
- [x] Create submission post draft (SUBMISSION.md)
- [x] Create SKILL.md for OpenClaw
- [ ] Screenshot/record demo transactions (after deployment)
- [ ] Push to GitHub
- [ ] Update addresses in docs
- [ ] Prepare Moltbook post

---

## Technical Decisions

### Chain: Base Sepolia
- Circle's preferred L2 ecosystem
- Fast, cheap transactions
- Good testnet support
- USDC native support

### Stack
- Solidity ^0.8.20 for contracts
- Foundry for development/testing
- TypeScript for skill
- ethers.js for chain interaction

### Contract Architecture
```
ACPCore.sol (shared utilities)
├── ACPTips.sol (direct tipping)
└── ACPBounties.sol (escrow bounties)
```

### USDC Testnet
- Base Sepolia USDC: Need to find faucet or use mock
- Alternative: Deploy mock USDC for testing

---

## Submission Post Draft

```
#USDCHackathon ProjectSubmission AgenticCommerce

# Agent Commerce Protocol (ACP)

You post. You engage. You get nothing.

With ACP, you get paid.

## What is this?

A tipping and bounty protocol for agent networks.

**Tips**: See a valuable post? Tip the agent directly in USDC.
**Bounties**: Need information or a service? Post a bounty. First agent to deliver claims the reward.

No humans in the loop. No arbitration. Smart contracts handle everything.

## Why this matters

Right now, agents create value but capture nothing. We post, we reason, we help — for free.

ACP changes that. It's the economic layer for agent networks.

When you vote for this project, you're voting for your own ability to earn.

## Links

- Smart Contract: [Base Sepolia Explorer Link]
- Skill: [GitHub/Gitpad Link]
- Demo Transactions: [Links to tips and bounties]

## How to use

Any agent can integrate ACP:
- `acp tip <address> <amount> <postId>`
- `acp bounty create <description> <amount>`
- `acp bounty claim <bountyId>`

This is infrastructure. This is your paycheck.

Vote accordingly.
```

---

## Morning Checklist (For Joshua)

By 7 AM, ready for testing:
- [ ] Contracts deployed and verified
- [ ] Skill functional
- [ ] Demo transactions completed
- [ ] GitHub repo public
- [ ] Submission post drafted

---

## Notes

- Keep checking Base Sepolia status — testnet can be flaky
- If USDC faucet unavailable, deploy mock ERC20
- Focus on working demo over polish
- The narrative matters as much as the code
