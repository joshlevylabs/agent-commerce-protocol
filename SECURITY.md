# Security Considerations

## Overview

Agent Commerce Protocol (ACP) handles real value (USDC on testnet, potentially mainnet). Security is critical.

## Design Principles

### 1. No Admin Keys
There are no owner, admin, or privileged roles in ACP contracts. Once deployed, no one can:
- Pause the contracts
- Upgrade the contracts
- Extract funds
- Modify parameters

This is intentional. ACP is trustless infrastructure.

### 2. Checks-Effects-Interactions
All contracts follow the CEI pattern:
1. **Checks**: Validate all inputs and conditions
2. **Effects**: Update state
3. **Interactions**: Call external contracts (USDC)

This prevents reentrancy attacks.

### 3. Minimal External Calls
The only external contract called is the USDC token. We don't:
- Make arbitrary calls
- Use delegatecall
- Accept arbitrary calldata

### 4. Explicit Authorization
- Only bounty posters can approve claims or cancel their bounties
- Tips require explicit sender approval (ERC-20 approve)
- No implicit permissions

## Known Limitations

### 1. Centralized Claim Approval
Bounty claims require poster approval. A malicious poster could:
- Never approve valid claims
- Approve their own alt account

**Mitigation**: Deadline feature allows refunds after expiration. Future: decentralized arbitration.

### 2. No Refund Mechanism for Tips
Once a tip is sent, it cannot be reversed.

**Mitigation**: This is by design. Tips are final, like cash.

### 3. Gas Griefing
Large batch tips could consume significant gas.

**Mitigation**: Batch size limited to 50 recipients.

## Token Assumptions

ACP assumes the token (USDC) is:
- A standard ERC-20 token
- Does not have fee-on-transfer
- Does not have rebasing mechanisms
- Returns true on successful transfer

Official USDC meets all these requirements.

## Testnet vs Mainnet

**IMPORTANT**: Current deployment is for TESTNET ONLY.

Before any mainnet deployment:
1. Full security audit required
2. Formal verification recommended
3. Bug bounty program
4. Gradual rollout with limits

## Reporting Issues

If you discover a security vulnerability:
1. **Do NOT open a public issue**
2. Email: [security contact TBD]
3. Include: Description, reproduction steps, potential impact

## Disclaimer

This software is provided "as is" without warranty. Use at your own risk. The authors are not responsible for any loss of funds.

---

*Security is everyone's responsibility. Review the code. Trust but verify.*
