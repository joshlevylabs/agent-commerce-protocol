const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Agent Commerce Protocol", function () {
  let usdc, tips, bounties, acp;
  let deployer, alice, bob, charlie;
  
  const USDC_DECIMALS = 6;
  const toUSDC = (amount) => ethers.parseUnits(amount.toString(), USDC_DECIMALS);
  
  beforeEach(async function () {
    [deployer, alice, bob, charlie] = await ethers.getSigners();
    
    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    
    // Deploy ACPTips
    const ACPTips = await ethers.getContractFactory("ACPTips");
    tips = await ACPTips.deploy(await usdc.getAddress());
    await tips.waitForDeployment();
    
    // Deploy ACPBounties
    const ACPBounties = await ethers.getContractFactory("ACPBounties");
    bounties = await ACPBounties.deploy(await usdc.getAddress());
    await bounties.waitForDeployment();
    
    // Deploy ACP
    const ACP = await ethers.getContractFactory("ACP");
    acp = await ACP.deploy(
      await usdc.getAddress(),
      await tips.getAddress(),
      await bounties.getAddress()
    );
    await acp.waitForDeployment();
    
    // Fund test accounts with USDC
    await usdc.faucet(alice.address, 10000);
    await usdc.faucet(bob.address, 10000);
    await usdc.faucet(charlie.address, 10000);
  });
  
  describe("MockUSDC", function () {
    it("should have correct decimals", async function () {
      expect(await usdc.decimals()).to.equal(6);
    });
    
    it("should allow faucet minting", async function () {
      const balance = await usdc.balanceOf(alice.address);
      expect(balance).to.equal(toUSDC(10000));
    });
    
    it("should limit faucet to 10,000 USDC", async function () {
      await expect(usdc.faucet(alice.address, 10001))
        .to.be.revertedWith("MockUSDC: max 10,000 USDC per mint");
    });
  });
  
  describe("ACPTips", function () {
    beforeEach(async function () {
      // Approve tips contract to spend Alice's USDC
      await usdc.connect(alice).approve(await tips.getAddress(), toUSDC(10000));
    });
    
    it("should allow tipping another agent", async function () {
      const tipAmount = toUSDC(100);
      const postId = "post-123";
      const message = "Great analysis!";
      
      await expect(tips.connect(alice).tip(bob.address, tipAmount, postId, message))
        .to.emit(tips, "TipSent");
      
      // Check balances
      expect(await usdc.balanceOf(bob.address)).to.equal(toUSDC(10100));
      expect(await usdc.balanceOf(alice.address)).to.equal(toUSDC(9900));
      
      // Check stats
      const stats = await tips.getAgentStats(bob.address);
      expect(stats.received).to.equal(tipAmount);
      expect(stats.count).to.equal(1);
    });
    
    it("should not allow self-tipping", async function () {
      await expect(tips.connect(alice).tip(alice.address, toUSDC(100), "", ""))
        .to.be.revertedWith("ACP: cannot tip yourself");
    });
    
    it("should not allow zero amount tips", async function () {
      await expect(tips.connect(alice).tip(bob.address, 0, "", ""))
        .to.be.revertedWith("ACP: zero amount");
    });
    
    it("should support batch tipping", async function () {
      const recipients = [bob.address, charlie.address];
      const amounts = [toUSDC(50), toUSDC(100)];
      
      await tips.connect(alice).batchTip(recipients, amounts);
      
      expect(await usdc.balanceOf(bob.address)).to.equal(toUSDC(10050));
      expect(await usdc.balanceOf(charlie.address)).to.equal(toUSDC(10100));
      expect(await usdc.balanceOf(alice.address)).to.equal(toUSDC(9850));
    });
  });
  
  describe("ACPBounties", function () {
    beforeEach(async function () {
      // Approve bounties contract
      await usdc.connect(alice).approve(await bounties.getAddress(), toUSDC(10000));
      await usdc.connect(bob).approve(await bounties.getAddress(), toUSDC(10000));
    });
    
    it("should create a bounty", async function () {
      const amount = toUSDC(500);
      const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours
      const description = "Find information about X";
      const postId = "post-456";
      
      await expect(bounties.connect(alice).createBounty(amount, deadline, description, postId))
        .to.emit(bounties, "BountyCreated");
      
      const bounty = await bounties.getBounty(1);
      expect(bounty.poster).to.equal(alice.address);
      expect(bounty.amount).to.equal(amount);
      expect(bounty.description).to.equal(description);
      expect(bounty.status).to.equal(0); // Active
      
      // Check escrow
      expect(await usdc.balanceOf(await bounties.getAddress())).to.equal(amount);
      expect(await usdc.balanceOf(alice.address)).to.equal(toUSDC(9500));
    });
    
    it("should allow poster to approve claim", async function () {
      const amount = toUSDC(500);
      await bounties.connect(alice).createBounty(amount, 0, "Task", "");
      
      const bobBalanceBefore = await usdc.balanceOf(bob.address);
      
      await expect(bounties.connect(alice).approveClaim(1, bob.address, "proof-link"))
        .to.emit(bounties, "BountyClaimed");
      
      expect(await usdc.balanceOf(bob.address)).to.equal(bobBalanceBefore + amount);
      
      const bounty = await bounties.getBounty(1);
      expect(bounty.status).to.equal(1); // Claimed
      expect(bounty.claimedBy).to.equal(bob.address);
    });
    
    it("should allow poster to cancel bounty", async function () {
      await bounties.connect(alice).createBounty(toUSDC(500), 0, "Task", "");
      
      await expect(bounties.connect(alice).cancelBounty(1))
        .to.emit(bounties, "BountyCancelled");
      
      expect(await usdc.balanceOf(alice.address)).to.equal(toUSDC(10000));
      
      const bounty = await bounties.getBounty(1);
      expect(bounty.status).to.equal(3); // Cancelled
    });
    
    it("should not allow non-poster to approve claim", async function () {
      await bounties.connect(alice).createBounty(toUSDC(500), 0, "Task", "");
      
      await expect(bounties.connect(bob).approveClaim(1, charlie.address, ""))
        .to.be.revertedWith("ACP: not poster");
    });
    
    it("should list active bounties", async function () {
      await bounties.connect(alice).createBounty(toUSDC(100), 0, "Task 1", "");
      await bounties.connect(alice).createBounty(toUSDC(200), 0, "Task 2", "");
      await bounties.connect(bob).createBounty(toUSDC(300), 0, "Task 3", "");
      
      const active = await bounties.getActiveBounties(0, 10);
      expect(active.length).to.equal(3);
    });
  });
  
  describe("ACP Registry", function () {
    it("should register agent identity", async function () {
      await acp.connect(alice).registerAgent("AgentAlice", "https://moltbook.com/u/alice");
      
      expect(await acp.agentNames(alice.address)).to.equal("AgentAlice");
      expect(await acp.agentProfiles(alice.address)).to.equal("https://moltbook.com/u/alice");
    });
    
    it("should aggregate stats from tips and bounties", async function () {
      // Setup: tip and bounty activity
      await usdc.connect(alice).approve(await tips.getAddress(), toUSDC(10000));
      await usdc.connect(bob).approve(await bounties.getAddress(), toUSDC(10000));
      
      await tips.connect(alice).tip(bob.address, toUSDC(100), "", "");
      await bounties.connect(bob).createBounty(toUSDC(500), 0, "Task", "");
      await bounties.connect(bob).approveClaim(1, charlie.address, "");
      
      const bobStats = await acp.getFullAgentStats(bob.address);
      expect(bobStats.tipsReceived).to.equal(toUSDC(100));
      expect(bobStats.bountiesPosted).to.equal(1);
      
      const charlieStats = await acp.getFullAgentStats(charlie.address);
      expect(charlieStats.bountiesClaimed).to.equal(1);
      expect(charlieStats.bountyAmountEarned).to.equal(toUSDC(500));
    });
  });
  
  // Helper to get current block timestamp
  async function getTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
  }
});
