const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * Integration tests - Full workflow scenarios
 */
describe("ACP Integration Scenarios", function () {
  let usdc, tips, bounties, acp;
  let deployer, alice, bob, charlie, dave;
  
  const USDC_DECIMALS = 6;
  const toUSDC = (amount) => ethers.parseUnits(amount.toString(), USDC_DECIMALS);
  
  beforeEach(async function () {
    [deployer, alice, bob, charlie, dave] = await ethers.getSigners();
    
    // Deploy full stack
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    
    const ACPTips = await ethers.getContractFactory("ACPTips");
    tips = await ACPTips.deploy(await usdc.getAddress());
    
    const ACPBounties = await ethers.getContractFactory("ACPBounties");
    bounties = await ACPBounties.deploy(await usdc.getAddress());
    
    const ACP = await ethers.getContractFactory("ACP");
    acp = await ACP.deploy(
      await usdc.getAddress(),
      await tips.getAddress(),
      await bounties.getAddress()
    );
    
    // Fund all accounts
    for (const account of [alice, bob, charlie, dave]) {
      await usdc.faucet(account.address, 10000);
      await usdc.connect(account).approve(await tips.getAddress(), toUSDC(10000));
      await usdc.connect(account).approve(await bounties.getAddress(), toUSDC(10000));
    }
  });
  
  describe("Scenario: Moltbook Tipping Economy", function () {
    it("should support a full tipping flow between multiple agents", async function () {
      // Alice tips Bob for a great post
      await tips.connect(alice).tip(bob.address, toUSDC(50), "post-001", "Great analysis!");
      
      // Charlie also tips Bob
      await tips.connect(charlie).tip(bob.address, toUSDC(25), "post-001", "Helpful!");
      
      // Bob tips Dave for a reply
      await tips.connect(bob).tip(dave.address, toUSDC(10), "comment-001", "Thanks for clarifying");
      
      // Check final stats
      const bobStats = await tips.getAgentStats(bob.address);
      expect(bobStats.received).to.equal(toUSDC(75)); // 50 + 25
      expect(bobStats.sent).to.equal(toUSDC(10));
      expect(bobStats.count).to.equal(2); // Received 2 tips
      
      const daveStats = await tips.getAgentStats(dave.address);
      expect(daveStats.received).to.equal(toUSDC(10));
    });
    
    it("should track batch tips correctly", async function () {
      // Alice tips multiple agents at once
      const recipients = [bob.address, charlie.address, dave.address];
      const amounts = [toUSDC(100), toUSDC(50), toUSDC(25)];
      
      await tips.connect(alice).batchTip(recipients, amounts);
      
      // Verify all received
      expect(await usdc.balanceOf(bob.address)).to.equal(toUSDC(10100));
      expect(await usdc.balanceOf(charlie.address)).to.equal(toUSDC(10050));
      expect(await usdc.balanceOf(dave.address)).to.equal(toUSDC(10025));
      
      // Check sender stats
      const aliceStats = await tips.getAgentStats(alice.address);
      expect(aliceStats.sent).to.equal(toUSDC(175)); // 100 + 50 + 25
    });
  });
  
  describe("Scenario: Bounty-Based Task Marketplace", function () {
    it("should complete a full bounty workflow", async function () {
      // Alice posts a bounty for research
      await bounties.connect(alice).createBounty(
        toUSDC(500),
        0, // No deadline
        "Research the latest AI agent frameworks and summarize key findings",
        "bounty-post-001"
      );
      
      // Verify bounty created and funds escrowed
      expect(await usdc.balanceOf(await bounties.getAddress())).to.equal(toUSDC(500));
      expect(await usdc.balanceOf(alice.address)).to.equal(toUSDC(9500));
      
      // Bob completes the task and Alice approves
      await bounties.connect(alice).approveClaim(
        1,
        bob.address,
        "https://moltbook.com/comment/research-reply"
      );
      
      // Verify Bob received payment
      expect(await usdc.balanceOf(bob.address)).to.equal(toUSDC(10500));
      expect(await usdc.balanceOf(await bounties.getAddress())).to.equal(toUSDC(0));
      
      // Check stats
      const aliceStats = await bounties.getAgentStats(alice.address);
      expect(aliceStats.bountiesPosted).to.equal(1);
      expect(aliceStats.amountPosted).to.equal(toUSDC(500));
      
      const bobStats = await bounties.getAgentStats(bob.address);
      expect(bobStats.bountiesClaimed).to.equal(1);
      expect(bobStats.amountEarned).to.equal(toUSDC(500));
    });
    
    it("should handle multiple active bounties", async function () {
      // Create multiple bounties
      await bounties.connect(alice).createBounty(toUSDC(100), 0, "Task 1", "");
      await bounties.connect(bob).createBounty(toUSDC(200), 0, "Task 2", "");
      await bounties.connect(charlie).createBounty(toUSDC(300), 0, "Task 3", "");
      
      // Get active bounties
      const active = await bounties.getActiveBounties(0, 10);
      expect(active.length).to.equal(3);
      
      // Complete bounty 2
      await bounties.connect(bob).approveClaim(2, dave.address, "proof");
      
      // Check remaining active
      const remaining = await bounties.getActiveBounties(0, 10);
      expect(remaining.length).to.equal(2);
    });
    
    it("should allow bounty cancellation with full refund", async function () {
      await bounties.connect(alice).createBounty(toUSDC(500), 0, "Cancelled task", "");
      
      const balanceBefore = await usdc.balanceOf(alice.address);
      await bounties.connect(alice).cancelBounty(1);
      const balanceAfter = await usdc.balanceOf(alice.address);
      
      // Full refund
      expect(balanceAfter - balanceBefore).to.equal(toUSDC(500));
      
      // Bounty marked cancelled
      const bounty = await bounties.getBounty(1);
      expect(bounty.status).to.equal(3); // Cancelled
    });
  });
  
  describe("Scenario: Agent Reputation Building", function () {
    it("should aggregate comprehensive agent stats", async function () {
      // Register identities
      await acp.connect(alice).registerAgent("AgentAlice", "https://moltbook.com/u/alice");
      await acp.connect(bob).registerAgent("AgentBob", "https://moltbook.com/u/bob");
      
      // Alice tips Bob
      await tips.connect(alice).tip(bob.address, toUSDC(100), "", "");
      
      // Bob posts bounty, Charlie claims
      await bounties.connect(bob).createBounty(toUSDC(200), 0, "Task", "");
      await bounties.connect(bob).approveClaim(1, charlie.address, "");
      
      // Get full stats
      const bobStats = await acp.getFullAgentStats(bob.address);
      
      expect(bobStats.name).to.equal("AgentBob");
      expect(bobStats.profile).to.equal("https://moltbook.com/u/bob");
      expect(bobStats.tipsReceived).to.equal(toUSDC(100));
      expect(bobStats.bountiesPosted).to.equal(1);
      expect(bobStats.bountyAmountPosted).to.equal(toUSDC(200));
    });
  });
  
  describe("Scenario: Gas Efficiency", function () {
    it("should batch tips efficiently", async function () {
      const recipients = [];
      const amounts = [];
      
      // Prepare 20 tips
      for (let i = 0; i < 20; i++) {
        recipients.push(bob.address);
        amounts.push(toUSDC(1));
      }
      
      // Execute batch (should be more gas efficient than 20 individual tips)
      const tx = await tips.connect(alice).batchTip(recipients, amounts);
      const receipt = await tx.wait();
      
      // Verify all went through
      expect(await usdc.balanceOf(bob.address)).to.equal(toUSDC(10020));
      
      // Gas should be reasonable (exact value depends on network)
      // This is more of a sanity check
      expect(receipt.gasUsed).to.be.lessThan(2000000);
    });
  });
});
