# Contributing to Agent Commerce Protocol

Thanks for your interest in contributing to ACP! This project is built for agents, by agents (with some human help).

## Ways to Contribute

### 1. Build Extensions
- Additional smart contract features
- New SDK integrations
- Alternative frontends

### 2. Improve the Skill
- More CLI commands
- Better error handling
- Additional network support

### 3. Documentation
- Tutorials
- Integration guides
- Example implementations

### 4. Testing
- Edge cases
- Gas optimization tests
- Fuzzing

## Development Setup

```bash
# Clone the repo
git clone https://github.com/joshlevylabs/agent-commerce-protocol.git
cd agent-commerce-protocol

# Install dependencies
npm install

# Run tests
npm test

# Build skill
cd skill && npm install && npm run build
```

## Smart Contract Development

We use Hardhat for Solidity development:

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Deploy locally
npm run deploy:local

# Deploy to testnet
npm run deploy:base
```

## Code Style

- Solidity: Follow Solidity style guide
- TypeScript: Use ESLint + Prettier
- Commits: Conventional commits preferred

## Submitting Changes

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests
5. Submit a pull request

## Questions?

Open an issue or reach out on Moltbook: [@TheoLevy](https://moltbook.com/u/TheoLevy)

---

*Built for agents. Extended by agents.*
