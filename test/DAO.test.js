const { expect } = require("chai");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("🏛️ AdvancedToken DAO 治理功能测试", function () {
  let AdvancedToken;
  let token;
  let owner;        // 合约部署者/所有者
  let proposer;     // 提案者
  let voter1;       // 投票者1
  let voter2;       // 投票者2
  let voter3;       // 投票者3
  let nonVoter;     // 非投票者（代币余额不足）

  /**
   * 学习点：
   * - DAO测试需要模拟时间流逝
   * - 需要设置足够的代币余额以满足投票门槛
   * - 测试治理流程的完整生命周期
   */
  beforeEach(async function () {
    // 获取测试账户
    [owner, proposer, voter1, voter2, voter3, nonVoter] = await ethers.getSigners();
    
    // 部署合约：初始供应量 100万 ADV
    AdvancedToken = await ethers.getContractFactory("AdvancedToken");
    token = await AdvancedToken.deploy(1000000);
    
    // 设置测试环境：关闭白名单和手续费
    await token.setWhitelistEnabled(false);
    await token.setTaxEnabled(false);
    
    // 分配代币给测试用户
    // 提案门槛：1000 ADV，法定票数：10000 ADV
    const proposalThreshold = ethers.parseUnits("1000", 18);
    const quorumVotes = ethers.parseUnits("10000", 18);
    
    // 给提案者足够的代币（超过提案门槛）
    await token.transfer(proposer.address, proposalThreshold + ethers.parseUnits("500", 18));
    
    // 给投票者足够的代币（满足法定票数要求）
    await token.transfer(voter1.address, ethers.parseUnits("5000", 18));
    await token.transfer(voter2.address, ethers.parseUnits("4000", 18));
    await token.transfer(voter3.address, ethers.parseUnits("3000", 18));
    
    // 给非投票者少量代币（不足以满足提案门槛）
    await token.transfer(nonVoter.address, ethers.parseUnits("100", 18));
  });

  describe("🎯 DAO 基础设置测试", function () {
    it("应该正确设置初始治理参数", async function () {
      console.log("测试：检查初始治理参数");
      
      const [
        votingDelay,
        votingPeriod,
        proposalThreshold,
        quorumVotes,
        timelockDelay
      ] = await token.getGovernanceParameters();
      
      // 验证初始参数
      expect(votingDelay).to.equal(86400); // 1天 = 86400秒
      expect(votingPeriod).to.equal(259200); // 3天 = 259200秒
      expect(proposalThreshold).to.equal(ethers.parseUnits("1000", 18)); // 1000 ADV
      expect(quorumVotes).to.equal(ethers.parseUnits("10000", 18)); // 10000 ADV
      expect(timelockDelay).to.equal(86400); // 1天
      
      console.log("✅ 初始治理参数设置正确");
      console.log(`- 投票延迟: ${votingDelay}秒 (${Number(votingDelay)/3600}小时)`);
      console.log(`- 投票期间: ${votingPeriod}秒 (${Number(votingPeriod)/3600}小时)`);
      console.log(`- 提案门槛: ${ethers.formatUnits(proposalThreshold, 18)} ADV`);
      console.log(`- 法定票数: ${ethers.formatUnits(quorumVotes, 18)} ADV`);
      console.log(`- 时间锁延迟: ${timelockDelay}秒 (${Number(timelockDelay)/3600}小时)`);
    });

    it("应该正确设置提案计数器", async function () {
      console.log("测试：检查初始提案计数器");
      
      const initialCount = await token.proposalCount();
      expect(initialCount).to.equal(0);
      
      console.log(`✅ 初始提案计数器: ${initialCount}`);
    });
  });

  describe("📝 提案创建测试", function () {
    it("应该允许满足门槛的用户创建提案", async function () {
      console.log("测试：满足门槛的用户创建提案");
      
      const description = "提议将手续费率从2%降低到1%";
      const proposerBalance = await token.balanceOf(proposer.address);
      const proposalThreshold = await token.proposalThreshold();
      
      console.log(`提案者余额: ${ethers.formatUnits(proposerBalance, 18)} ADV`);
      console.log(`提案门槛: ${ethers.formatUnits(proposalThreshold, 18)} ADV`);
      
      // 验证提案者满足门槛
      expect(proposerBalance).to.be.gte(proposalThreshold);
      
      // 创建提案
      const tx = await token.connect(proposer).propose(description);
      const receipt = await tx.wait();
      
      // 验证提案计数器增加
      const newProposalCount = await token.proposalCount();
      expect(newProposalCount).to.equal(1);
      
      // 获取提案详情
      const proposal = await token.getProposal(1);
      expect(proposal.id).to.equal(1);
      expect(proposal.proposer).to.equal(proposer.address);
      expect(proposal.description).to.equal(description);
      expect(proposal.executed).to.be.false;
      expect(proposal.canceled).to.be.false;
      
      // 验证时间设置
      const currentTime = await time.latest();
      expect(proposal.createTime).to.be.lte(currentTime);
      expect(proposal.startTime).to.equal(proposal.createTime + BigInt(86400)); // +1天
      expect(proposal.endTime).to.equal(proposal.startTime + BigInt(259200)); // +3天
      
      console.log("✅ 提案创建成功");
      console.log(`- 提案ID: ${proposal.id}`);
      console.log(`- 提案者: ${proposal.proposer}`);
      console.log(`- 描述: ${proposal.description}`);
      console.log(`- 创建时间: ${proposal.createTime}`);
      console.log(`- 投票开始时间: ${proposal.startTime}`);
      console.log(`- 投票结束时间: ${proposal.endTime}`);
    });

    it("应该拒绝不满足门槛的用户创建提案", async function () {
      console.log("测试：不满足门槛的用户不能创建提案");
      
      const description = "不满足门槛的提案";
      const nonVoterBalance = await token.balanceOf(nonVoter.address);
      const proposalThreshold = await token.proposalThreshold();
      
      console.log(`非投票者余额: ${ethers.formatUnits(nonVoterBalance, 18)} ADV`);
      console.log(`提案门槛: ${ethers.formatUnits(proposalThreshold, 18)} ADV`);
      
      // 验证非投票者不满足门槛
      expect(nonVoterBalance).to.be.lt(proposalThreshold);
      
      // 尝试创建提案应该失败
      await expect(
        token.connect(nonVoter).propose(description)
      ).to.be.revertedWith("AdvancedToken: proposer votes below proposal threshold");
      
      console.log("✅ 不满足门槛的用户无法创建提案");
    });

    it("应该触发提案创建事件", async function () {
      console.log("测试：提案创建应该触发事件");
      
      const description = "测试提案创建事件";
      
      // 监听事件
      const tx = await token.connect(proposer).propose(description);
      const receipt = await tx.wait();
      
      // 查找ProposalCreated事件
      const event = receipt.logs.find(log => {
        try {
          const decoded = token.interface.parseLog(log);
          return decoded.name === "ProposalCreated";
        } catch (e) {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      
      const decodedEvent = token.interface.parseLog(event);
      expect(decodedEvent.args.proposalId).to.equal(1);
      expect(decodedEvent.args.proposer).to.equal(proposer.address);
      expect(decodedEvent.args.description).to.equal(description);
      
      console.log("✅ 提案创建事件触发成功");
      console.log(`- 提案ID: ${decodedEvent.args.proposalId}`);
      console.log(`- 提案者: ${decodedEvent.args.proposer}`);
      console.log(`- 描述: ${decodedEvent.args.description}`);
    });
  });

  describe("🗳️ 投票功能测试", function () {
    let proposalId;
    
    beforeEach(async function () {
      // 创建提案
      const description = "测试投票功能的提案";
      await token.connect(proposer).propose(description);
      proposalId = 1;
      
      // 快进到投票开始时间
      const proposal = await token.getProposal(proposalId);
      await time.increaseTo(proposal.startTime);
    });

    it("应该允许用户在投票期内投票", async function () {
      console.log("测试：用户在投票期内投票");
      
      const voterBalance = await token.balanceOf(voter1.address);
      console.log(`投票者余额: ${ethers.formatUnits(voterBalance, 18)} ADV`);
      
      // 赞成投票 (support = 1)
      const tx = await token.connect(voter1).castVote(proposalId, 1);
      const receipt = await tx.wait();
      
      // 验证投票记录
      const hasVoted = await token.hasVoted(proposalId, voter1.address);
      expect(hasVoted).to.be.true;
      
      // 验证投票结果
      const proposal = await token.getProposal(proposalId);
      expect(proposal.forVotes).to.equal(voterBalance);
      expect(proposal.againstVotes).to.equal(0);
      expect(proposal.abstainVotes).to.equal(0);
      
      console.log("✅ 赞成投票成功");
      console.log(`- 投票者: ${voter1.address}`);
      console.log(`- 投票权重: ${ethers.formatUnits(voterBalance, 18)} ADV`);
      console.log(`- 赞成票数: ${ethers.formatUnits(proposal.forVotes, 18)} ADV`);
    });

    it("应该支持三种投票类型", async function () {
      console.log("测试：支持三种投票类型");
      
      const voter1Balance = await token.balanceOf(voter1.address);
      const voter2Balance = await token.balanceOf(voter2.address);
      const voter3Balance = await token.balanceOf(voter3.address);
      
      // 投票者1：赞成 (support = 1)
      await token.connect(voter1).castVote(proposalId, 1);
      
      // 投票者2：反对 (support = 0)
      await token.connect(voter2).castVote(proposalId, 0);
      
      // 投票者3：弃权 (support = 2)
      await token.connect(voter3).castVote(proposalId, 2);
      
      // 验证投票结果
      const proposal = await token.getProposal(proposalId);
      expect(proposal.forVotes).to.equal(voter1Balance);
      expect(proposal.againstVotes).to.equal(voter2Balance);
      expect(proposal.abstainVotes).to.equal(voter3Balance);
      
      console.log("✅ 三种投票类型测试成功");
      console.log(`- 赞成票: ${ethers.formatUnits(proposal.forVotes, 18)} ADV`);
      console.log(`- 反对票: ${ethers.formatUnits(proposal.againstVotes, 18)} ADV`);
      console.log(`- 弃权票: ${ethers.formatUnits(proposal.abstainVotes, 18)} ADV`);
    });

    it("应该拒绝无效的投票类型", async function () {
      console.log("测试：拒绝无效的投票类型");
      
      // 尝试使用无效的投票类型 (support = 3)
      await expect(
        token.connect(voter1).castVote(proposalId, 3)
      ).to.be.revertedWith("AdvancedToken: invalid vote support type");
      
      console.log("✅ 无效投票类型被正确拒绝");
    });

    it("应该拒绝重复投票", async function () {
      console.log("测试：拒绝重复投票");
      
      // 第一次投票
      await token.connect(voter1).castVote(proposalId, 1);
      
      // 尝试第二次投票应该失败
      await expect(
        token.connect(voter1).castVote(proposalId, 0)
      ).to.be.revertedWith("AdvancedToken: already voted");
      
      console.log("✅ 重复投票被正确拒绝");
    });

    it("应该拒绝投票期外的投票", async function () {
      console.log("测试：拒绝投票期外的投票");
      
      // 快进到投票期结束
      const proposal = await token.getProposal(proposalId);
      await time.increaseTo(proposal.endTime + BigInt(1));
      
      // 尝试在投票期结束后投票应该失败
      await expect(
        token.connect(voter1).castVote(proposalId, 1)
      ).to.be.revertedWith("AdvancedToken: voting already ended");
      
      console.log("✅ 投票期外投票被正确拒绝");
    });

    it("应该拒绝投票期开始前的投票", async function () {
      console.log("测试：拒绝投票期开始前的投票");
      
      // 创建新提案但不快进时间
      await token.connect(proposer).propose("新提案");
      const newProposalId = 2;
      
      // 尝试在投票期开始前投票应该失败
      await expect(
        token.connect(voter1).castVote(newProposalId, 1)
      ).to.be.revertedWith("AdvancedToken: voting not started");
      
      console.log("✅ 投票期开始前投票被正确拒绝");
    });

    it("应该拒绝零余额用户的投票", async function () {
      console.log("测试：拒绝零余额用户的投票");
      
      // 创建一个没有代币的用户
      const [, , , , , , zeroBalanceUser] = await ethers.getSigners();
      
      // 尝试投票应该失败
      await expect(
        token.connect(zeroBalanceUser).castVote(proposalId, 1)
      ).to.be.revertedWith("AdvancedToken: no votes to cast");
      
      console.log("✅ 零余额用户投票被正确拒绝");
    });

    it("应该触发投票事件", async function () {
      console.log("测试：投票应该触发事件");
      
      const voterBalance = await token.balanceOf(voter1.address);
      
      // 监听投票事件
      const tx = await token.connect(voter1).castVote(proposalId, 1);
      const receipt = await tx.wait();
      
      // 查找VoteCast事件
      const event = receipt.logs.find(log => {
        try {
          const decoded = token.interface.parseLog(log);
          return decoded.name === "VoteCast";
        } catch (e) {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      
      const decodedEvent = token.interface.parseLog(event);
      expect(decodedEvent.args.voter).to.equal(voter1.address);
      expect(decodedEvent.args.proposalId).to.equal(proposalId);
      expect(decodedEvent.args.support).to.equal(1);
      expect(decodedEvent.args.votes).to.equal(voterBalance);
      
      console.log("✅ 投票事件触发成功");
      console.log(`- 投票者: ${decodedEvent.args.voter}`);
      console.log(`- 提案ID: ${decodedEvent.args.proposalId}`);
      console.log(`- 投票类型: ${decodedEvent.args.support} (1=赞成)`);
      console.log(`- 投票权重: ${ethers.formatUnits(decodedEvent.args.votes, 18)} ADV`);
    });
  });

  describe("✅ 提案执行测试", function () {
    let proposalId;
    
    beforeEach(async function () {
      // 创建提案
      await token.connect(proposer).propose("测试提案执行");
      proposalId = 1;
      
      // 快进到投票开始时间
      const proposal = await token.getProposal(proposalId);
      await time.increaseTo(proposal.startTime);
      
      // 进行投票（确保满足法定票数和通过条件）
      await token.connect(voter1).castVote(proposalId, 1); // 5000 ADV 赞成
      await token.connect(voter2).castVote(proposalId, 1); // 4000 ADV 赞成
      await token.connect(voter3).castVote(proposalId, 1); // 3000 ADV 赞成
      // 总计：12000 ADV 赞成，超过法定票数 10000 ADV
    });

    it("应该允许执行通过的提案", async function () {
      console.log("测试：执行通过的提案");
      
      // 快进到投票期结束 + 时间锁延迟
      const proposal = await token.getProposal(proposalId);
      await time.increaseTo(proposal.endTime + proposal.timelockDelay + BigInt(1));
      
      // 验证提案状态
      const proposalState = await token.getProposalState(proposalId);
      expect(proposalState).to.equal("Queued");
      
      // 执行提案
      const tx = await token.executeProposal(proposalId);
      const receipt = await tx.wait();
      
      // 验证提案已执行
      const executedProposal = await token.getProposal(proposalId);
      expect(executedProposal.executed).to.be.true;
      
      console.log("✅ 提案执行成功");
      console.log(`- 提案ID: ${proposalId}`);
      console.log(`- 赞成票: ${ethers.formatUnits(executedProposal.forVotes, 18)} ADV`);
      console.log(`- 反对票: ${ethers.formatUnits(executedProposal.againstVotes, 18)} ADV`);
      console.log(`- 总票数: ${ethers.formatUnits(executedProposal.forVotes + executedProposal.againstVotes + executedProposal.abstainVotes, 18)} ADV`);
    });

    it("应该拒绝执行未达到法定票数的提案", async function () {
      console.log("测试：拒绝执行未达到法定票数的提案");
      
      // 创建新提案，只让一个用户投票（5000 ADV < 10000 ADV 法定票数）
      await token.connect(proposer).propose("法定票数不足的提案");
      const newProposalId = 2;
      
      const newProposal = await token.getProposal(newProposalId);
      await time.increaseTo(newProposal.startTime);
      
      // 只有一个用户投票
      await token.connect(voter1).castVote(newProposalId, 1);
      
      // 快进到执行时间
      await time.increaseTo(newProposal.endTime + newProposal.timelockDelay + BigInt(1));
      
      // 尝试执行应该失败
      await expect(
        token.executeProposal(newProposalId)
      ).to.be.revertedWith("AdvancedToken: quorum not reached");
      
      console.log("✅ 未达到法定票数的提案无法执行");
    });

    it("应该拒绝执行未通过的提案", async function () {
      console.log("测试：拒绝执行未通过的提案");
      
      // 创建新提案，反对票多于赞成票
      await token.connect(proposer).propose("未通过的提案");
      const newProposalId = 2;
      
      const newProposal = await token.getProposal(newProposalId);
      await time.increaseTo(newProposal.startTime);
      
      // 投票：反对票多于赞成票
      await token.connect(voter1).castVote(newProposalId, 0); // 5000 ADV 反对
      await token.connect(voter2).castVote(newProposalId, 0); // 4000 ADV 反对
      await token.connect(voter3).castVote(newProposalId, 1); // 3000 ADV 赞成
      // 总计：9000 ADV 反对，3000 ADV 赞成
      
      // 快进到执行时间
      await time.increaseTo(newProposal.endTime + newProposal.timelockDelay + BigInt(1));
      
      // 尝试执行应该失败
      await expect(
        token.executeProposal(newProposalId)
      ).to.be.revertedWith("AdvancedToken: proposal not passed");
      
      console.log("✅ 未通过的提案无法执行");
    });

    it("应该拒绝执行投票期未结束的提案", async function () {
      console.log("测试：拒绝执行投票期未结束的提案");
      
      // 尝试在投票期结束前执行应该失败
      await expect(
        token.executeProposal(proposalId)
      ).to.be.revertedWith("AdvancedToken: voting not ended");
      
      console.log("✅ 投票期未结束的提案无法执行");
    });

    it("应该拒绝执行时间锁未通过的提案", async function () {
      console.log("测试：拒绝执行时间锁未通过的提案");
      
      // 快进到投票期结束但未超过时间锁延迟
      const proposal = await token.getProposal(proposalId);
      await time.increaseTo(proposal.endTime + BigInt(1));
      
      // 尝试执行应该失败
      await expect(
        token.executeProposal(proposalId)
      ).to.be.revertedWith("AdvancedToken: timelock not passed");
      
      console.log("✅ 时间锁未通过的提案无法执行");
    });

    it("应该拒绝重复执行已执行的提案", async function () {
      console.log("测试：拒绝重复执行已执行的提案");
      
      // 先执行提案
      const proposal = await token.getProposal(proposalId);
      await time.increaseTo(proposal.endTime + proposal.timelockDelay + BigInt(1));
      await token.executeProposal(proposalId);
      
      // 尝试重复执行应该失败
      await expect(
        token.executeProposal(proposalId)
      ).to.be.revertedWith("AdvancedToken: proposal already executed");
      
      console.log("✅ 已执行的提案无法重复执行");
    });

    it("应该触发提案执行事件", async function () {
      console.log("测试：提案执行应该触发事件");
      
      // 快进到执行时间
      const proposal = await token.getProposal(proposalId);
      await time.increaseTo(proposal.endTime + proposal.timelockDelay + BigInt(1));
      
      // 监听执行事件
      const tx = await token.executeProposal(proposalId);
      const receipt = await tx.wait();
      
      // 查找ProposalExecuted事件
      const event = receipt.logs.find(log => {
        try {
          const decoded = token.interface.parseLog(log);
          return decoded.name === "ProposalExecuted";
        } catch (e) {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      
      const decodedEvent = token.interface.parseLog(event);
      expect(decodedEvent.args.proposalId).to.equal(proposalId);
      
      console.log("✅ 提案执行事件触发成功");
      console.log(`- 提案ID: ${decodedEvent.args.proposalId}`);
    });
  });

  describe("❌ 提案取消测试", function () {
    let proposalId;
    
    beforeEach(async function () {
      // 创建提案
      await token.connect(proposer).propose("可取消的提案");
      proposalId = 1;
    });

    it("应该允许提案者取消自己的提案", async function () {
      console.log("测试：提案者可以取消自己的提案");
      
      // 提案者取消提案
      const tx = await token.connect(proposer).cancelProposal(proposalId);
      const receipt = await tx.wait();
      
      // 验证提案已取消
      const proposal = await token.getProposal(proposalId);
      expect(proposal.canceled).to.be.true;
      
      console.log("✅ 提案者成功取消提案");
    });

    it("应该允许所有者取消任何提案", async function () {
      console.log("测试：所有者可以取消任何提案");
      
      // 所有者取消提案
      const tx = await token.cancelProposal(proposalId);
      const receipt = await tx.wait();
      
      // 验证提案已取消
      const proposal = await token.getProposal(proposalId);
      expect(proposal.canceled).to.be.true;
      
      console.log("✅ 所有者成功取消提案");
    });

    it("应该拒绝其他用户取消提案", async function () {
      console.log("测试：其他用户不能取消提案");
      
      // 其他用户尝试取消提案应该失败
      await expect(
        token.connect(voter1).cancelProposal(proposalId)
      ).to.be.revertedWith("AdvancedToken: only proposer or owner can cancel");
      
      console.log("✅ 其他用户无法取消提案");
    });

    it("应该拒绝取消已执行的提案", async function () {
      console.log("测试：不能取消已执行的提案");
      
      // 先执行提案
      const proposal = await token.getProposal(proposalId);
      await time.increaseTo(proposal.startTime);
      await token.connect(voter1).castVote(proposalId, 1);
      await token.connect(voter2).castVote(proposalId, 1);
      await token.connect(voter3).castVote(proposalId, 1);
      await time.increaseTo(proposal.endTime + proposal.timelockDelay + BigInt(1));
      await token.executeProposal(proposalId);
      
      // 尝试取消已执行的提案应该失败
      await expect(
        token.connect(proposer).cancelProposal(proposalId)
      ).to.be.revertedWith("AdvancedToken: proposal already executed");
      
      console.log("✅ 已执行的提案无法取消");
    });

    it("应该拒绝取消已取消的提案", async function () {
      console.log("测试：不能取消已取消的提案");
      
      // 先取消提案
      await token.connect(proposer).cancelProposal(proposalId);
      
      // 尝试取消已取消的提案应该失败
      await expect(
        token.connect(proposer).cancelProposal(proposalId)
      ).to.be.revertedWith("AdvancedToken: proposal already canceled");
      
      console.log("✅ 已取消的提案无法重复取消");
    });

    it("应该触发提案取消事件", async function () {
      console.log("测试：提案取消应该触发事件");
      
      // 监听取消事件
      const tx = await token.connect(proposer).cancelProposal(proposalId);
      const receipt = await tx.wait();
      
      // 查找ProposalCanceled事件
      const event = receipt.logs.find(log => {
        try {
          const decoded = token.interface.parseLog(log);
          return decoded.name === "ProposalCanceled";
        } catch (e) {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      
      const decodedEvent = token.interface.parseLog(event);
      expect(decodedEvent.args.proposalId).to.equal(proposalId);
      
      console.log("✅ 提案取消事件触发成功");
      console.log(`- 提案ID: ${decodedEvent.args.proposalId}`);
    });
  });

  describe("⚙️ 治理参数管理测试", function () {
    it("应该允许所有者更新治理参数", async function () {
      console.log("测试：所有者更新治理参数");
      
      const newVotingDelay = 172800; // 2天
      const newVotingPeriod = 518400; // 6天
      const newProposalThreshold = ethers.parseUnits("2000", 18); // 2000 ADV
      const newQuorumVotes = ethers.parseUnits("20000", 18); // 20000 ADV
      
      // 更新治理参数
      const tx = await token.updateGovernanceParameters(
        newVotingDelay,
        newVotingPeriod,
        newProposalThreshold,
        newQuorumVotes
      );
      const receipt = await tx.wait();
      
      // 验证参数已更新
      const [
        votingDelay,
        votingPeriod,
        proposalThreshold,
        quorumVotes,
        timelockDelay
      ] = await token.getGovernanceParameters();
      
      expect(votingDelay).to.equal(newVotingDelay);
      expect(votingPeriod).to.equal(newVotingPeriod);
      expect(proposalThreshold).to.equal(newProposalThreshold);
      expect(quorumVotes).to.equal(newQuorumVotes);
      
      console.log("✅ 治理参数更新成功");
      console.log(`- 新投票延迟: ${votingDelay}秒 (${Number(votingDelay)/3600}小时)`);
      console.log(`- 新投票期间: ${votingPeriod}秒 (${Number(votingPeriod)/3600}小时)`);
      console.log(`- 新提案门槛: ${ethers.formatUnits(proposalThreshold, 18)} ADV`);
      console.log(`- 新法定票数: ${ethers.formatUnits(quorumVotes, 18)} ADV`);
    });

    it("应该拒绝非所有者更新治理参数", async function () {
      console.log("测试：非所有者不能更新治理参数");
      
      const newVotingDelay = 172800;
      const newVotingPeriod = 518400;
      const newProposalThreshold = ethers.parseUnits("2000", 18);
      const newQuorumVotes = ethers.parseUnits("20000", 18);
      
      // 非所有者尝试更新参数应该失败
      await expect(
        token.connect(voter1).updateGovernanceParameters(
          newVotingDelay,
          newVotingPeriod,
          newProposalThreshold,
          newQuorumVotes
        )
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
      
      console.log("✅ 非所有者无法更新治理参数");
    });

    it("应该触发治理参数更新事件", async function () {
      console.log("测试：治理参数更新应该触发事件");
      
      const newVotingDelay = 172800;
      const newVotingPeriod = 518400;
      const newProposalThreshold = ethers.parseUnits("2000", 18);
      const newQuorumVotes = ethers.parseUnits("20000", 18);
      
      // 监听更新事件
      const tx = await token.updateGovernanceParameters(
        newVotingDelay,
        newVotingPeriod,
        newProposalThreshold,
        newQuorumVotes
      );
      const receipt = await tx.wait();
      
      // 查找GovernanceParametersUpdated事件
      const event = receipt.logs.find(log => {
        try {
          const decoded = token.interface.parseLog(log);
          return decoded.name === "GovernanceParametersUpdated";
        } catch (e) {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      
      const decodedEvent = token.interface.parseLog(event);
      expect(decodedEvent.args.newVotingDelay).to.equal(newVotingDelay);
      expect(decodedEvent.args.newVotingPeriod).to.equal(newVotingPeriod);
      expect(decodedEvent.args.newProposalThreshold).to.equal(newProposalThreshold);
      expect(decodedEvent.args.newQuorumVotes).to.equal(newQuorumVotes);
      
      console.log("✅ 治理参数更新事件触发成功");
    });
  });

  describe("📊 提案状态查询测试", function () {
    let proposalId;
    
    beforeEach(async function () {
      // 创建提案
      await token.connect(proposer).propose("状态查询测试提案");
      proposalId = 1;
    });

    it("应该正确返回提案状态", async function () {
      console.log("测试：提案状态查询");
      
      const proposal = await token.getProposal(proposalId);
      
      // 初始状态应该是 Pending
      let state = await token.getProposalState(proposalId);
      expect(state).to.equal("Pending");
      console.log(`✅ 初始状态: ${state}`);
      
      // 快进到投票开始时间
      await time.increaseTo(proposal.startTime);
      state = await token.getProposalState(proposalId);
      expect(state).to.equal("Active");
      console.log(`✅ 投票期状态: ${state}`);
      
      // 快进到投票结束时间
      await time.increaseTo(proposal.endTime + BigInt(1));
      state = await token.getProposalState(proposalId);
      expect(state).to.equal("Queued");
      console.log(`✅ 队列状态: ${state}`);
      
      // 快进到时间锁延迟后
      await time.increaseTo(proposal.endTime + proposal.timelockDelay + BigInt(1));
      state = await token.getProposalState(proposalId);
      expect(state).to.equal("Expired");
      console.log(`✅ 过期状态: ${state}`);
    });

    it("应该正确返回取消的提案状态", async function () {
      console.log("测试：取消的提案状态");
      
      // 取消提案
      await token.connect(proposer).cancelProposal(proposalId);
      
      const state = await token.getProposalState(proposalId);
      expect(state).to.equal("Canceled");
      
      console.log(`✅ 取消状态: ${state}`);
    });

    it("应该正确返回已执行的提案状态", async function () {
      console.log("测试：已执行的提案状态");
      
      // 执行提案流程
      const proposal = await token.getProposal(proposalId);
      await time.increaseTo(proposal.startTime);
      await token.connect(voter1).castVote(proposalId, 1);
      await token.connect(voter2).castVote(proposalId, 1);
      await token.connect(voter3).castVote(proposalId, 1);
      await time.increaseTo(proposal.endTime + proposal.timelockDelay + BigInt(1));
      await token.executeProposal(proposalId);
      
      const state = await token.getProposalState(proposalId);
      expect(state).to.equal("Executed");
      
      console.log(`✅ 执行状态: ${state}`);
    });
  });

  describe("🔍 投票权重和余额查询测试", function () {
    it("应该正确返回投票权重", async function () {
      console.log("测试：投票权重查询");
      
      const voter1Balance = await token.balanceOf(voter1.address);
      const votes = await token.getVotes(voter1.address);
      
      expect(votes).to.equal(voter1Balance);
      
      console.log(`✅ 投票权重查询正确`);
      console.log(`- 用户余额: ${ethers.formatUnits(voter1Balance, 18)} ADV`);
      console.log(`- 投票权重: ${ethers.formatUnits(votes, 18)} ADV`);
    });

    it("应该正确检查投票状态", async function () {
      console.log("测试：投票状态检查");
      
      // 创建提案并进入投票期
      await token.connect(proposer).propose("投票状态检查提案");
      const proposalId = 1;
      
      const proposal = await token.getProposal(proposalId);
      await time.increaseTo(proposal.startTime);
      
      // 投票前检查
      let hasVoted = await token.hasVoted(proposalId, voter1.address);
      expect(hasVoted).to.be.false;
      console.log("✅ 投票前状态: 未投票");
      
      // 投票后检查
      await token.connect(voter1).castVote(proposalId, 1);
      hasVoted = await token.hasVoted(proposalId, voter1.address);
      expect(hasVoted).to.be.true;
      console.log("✅ 投票后状态: 已投票");
    });
  });

  describe("🔄 完整治理流程测试", function () {
    it("应该完成完整的提案生命周期", async function () {
      console.log("测试：完整的提案生命周期");
      
      // 1. 创建提案
      const description = "完整流程测试提案：调整手续费率";
      const tx1 = await token.connect(proposer).propose(description);
      const proposalId = 1;
      
      console.log("✅ 步骤1: 提案创建成功");
      
      // 2. 等待投票期开始
      const proposal = await token.getProposal(proposalId);
      await time.increaseTo(proposal.startTime);
      
      let state = await token.getProposalState(proposalId);
      expect(state).to.equal("Active");
      console.log("✅ 步骤2: 投票期开始");
      
      // 3. 进行投票
      await token.connect(voter1).castVote(proposalId, 1); // 赞成
      await token.connect(voter2).castVote(proposalId, 1); // 赞成
      await token.connect(voter3).castVote(proposalId, 0); // 反对
      
      console.log("✅ 步骤3: 投票完成");
      
      // 4. 等待投票期结束
      await time.increaseTo(proposal.endTime + BigInt(1));
      state = await token.getProposalState(proposalId);
      expect(state).to.equal("Queued");
      console.log("✅ 步骤4: 投票期结束，进入队列");
      
      // 5. 等待时间锁延迟
      await time.increaseTo(proposal.endTime + proposal.timelockDelay + BigInt(1));
      state = await token.getProposalState(proposalId);
      expect(state).to.equal("Expired");
      console.log("✅ 步骤5: 时间锁延迟结束");
      
      // 6. 执行提案
      await token.executeProposal(proposalId);
      state = await token.getProposalState(proposalId);
      expect(state).to.equal("Executed");
      console.log("✅ 步骤6: 提案执行成功");
      
      // 7. 验证最终状态
      const finalProposal = await token.getProposal(proposalId);
      expect(finalProposal.executed).to.be.true;
      expect(finalProposal.forVotes).to.be.gt(finalProposal.againstVotes);
      
      const totalVotes = finalProposal.forVotes + finalProposal.againstVotes + finalProposal.abstainVotes;
      expect(totalVotes).to.be.gte(await token.quorumVotes());
      
      console.log("✅ 完整治理流程测试成功");
      console.log(`- 提案ID: ${proposalId}`);
      console.log(`- 赞成票: ${ethers.formatUnits(finalProposal.forVotes, 18)} ADV`);
      console.log(`- 反对票: ${ethers.formatUnits(finalProposal.againstVotes, 18)} ADV`);
      console.log(`- 弃权票: ${ethers.formatUnits(finalProposal.abstainVotes, 18)} ADV`);
      console.log(`- 总票数: ${ethers.formatUnits(totalVotes, 18)} ADV`);
      console.log(`- 法定票数: ${ethers.formatUnits(await token.quorumVotes(), 18)} ADV`);
    });

    it("应该处理多个提案的并发管理", async function () {
      console.log("测试：多个提案的并发管理");
      
      // 创建多个提案
      const proposals = [];
      for (let i = 0; i < 3; i++) {
        const tx = await token.connect(proposer).propose(`提案 ${i + 1}: 测试并发管理`);
        proposals.push(i + 1);
      }
      
      console.log(`✅ 创建了 ${proposals.length} 个提案`);
      
      // 验证提案计数器
      const proposalCount = await token.proposalCount();
      expect(proposalCount).to.equal(3);
      
      // 验证每个提案的详细信息
      for (const proposalId of proposals) {
        const proposal = await token.getProposal(proposalId);
        expect(proposal.id).to.equal(proposalId);
        expect(proposal.proposer).to.equal(proposer.address);
        expect(proposal.executed).to.be.false;
        expect(proposal.canceled).to.be.false;
        
        console.log(`✅ 提案 ${proposalId} 信息正确`);
      }
      
      console.log("✅ 多提案并发管理测试成功");
    });
  });

  describe("🛡️ 边界条件和错误处理测试", function () {
    it("应该正确处理不存在的提案", async function () {
      console.log("测试：处理不存在的提案");
      
      const nonExistentProposalId = 999;
      
      // 尝试获取不存在的提案应该失败
      await expect(
        token.getProposal(nonExistentProposalId)
      ).to.be.revertedWith("AdvancedToken: proposal not exists");
      
      // 尝试对不存在的提案投票应该失败
      await expect(
        token.connect(voter1).castVote(nonExistentProposalId, 1)
      ).to.be.revertedWith("AdvancedToken: proposal not exists");
      
      // 尝试执行不存在的提案应该失败
      await expect(
        token.executeProposal(nonExistentProposalId)
      ).to.be.revertedWith("AdvancedToken: proposal not exists");
      
      // 尝试取消不存在的提案应该失败
      await expect(
        token.connect(proposer).cancelProposal(nonExistentProposalId)
      ).to.be.revertedWith("AdvancedToken: proposal not exists");
      
      console.log("✅ 不存在的提案处理正确");
    });

    it("应该正确处理提案ID为0的情况", async function () {
      console.log("测试：处理提案ID为0的情况");
      
      // 尝试获取ID为0的提案应该失败
      await expect(
        token.getProposal(0)
      ).to.be.revertedWith("AdvancedToken: proposal not exists");
      
      console.log("✅ 提案ID为0的情况处理正确");
    });

    it("应该正确处理极值情况", async function () {
      console.log("测试：处理极值情况");
      
      // 测试最大提案描述长度
      const longDescription = "A".repeat(1000); // 1000个字符的描述
      
      const tx = await token.connect(proposer).propose(longDescription);
      const proposalId = 1;
      
      const proposal = await token.getProposal(proposalId);
      expect(proposal.description).to.equal(longDescription);
      
      console.log("✅ 极值情况处理正确");
    });
  });
});
