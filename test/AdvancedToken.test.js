const { expect } = require("chai");

describe("第一章：AdvancedToken 基础功能测试", function () {
  let AdvancedToken;
  let token;
  let owner;    // 合约部署者
  let user1;    // 测试用户1
  let user2;    // 测试用户2

  /**
   * 学习点：
   * - beforeEach 在每个测试前运行，确保测试独立
   * - ethers.getSigners() 获取测试账户
   * - ContractFactory 用于部署合约
   */
  beforeEach(async function () {
    // 获取测试账户
    [owner, user1, user2] = await ethers.getSigners();
    
    // 部署合约：初始供应量 100万 ADV
    AdvancedToken = await ethers.getContractFactory("AdvancedToken");
    token = await AdvancedToken.deploy(1000000);
  });

  describe("🎯 基础信息测试", function () {
    it("应该正确设置代币名称和符号", async function () {
      // 测试名称
      console.log("测试：代币名称应该是 'AdvancedToken'");
      expect(await token.name()).to.equal("AdvancedToken");
      
      // 测试符号  
      console.log("测试：代币符号应该是 'ADV'");
      expect(await token.symbol()).to.equal("ADV");
    });

    it("应该正确设置小数位数", async function () {
      // ERC20 标准是 18 位小数
      console.log("测试：小数位数应该是 18");
      expect(await token.decimals()).to.equal(18);
    });

    it("应该正确设置总供应量", async function () {
      // 100万 * 10^18
      const expectedSupply = ethers.parseUnits("1000000", 18);
      console.log(`测试：总供应量应该是 ${ethers.formatUnits(expectedSupply, 18)} ADV`);
      
      expect(await token.totalSupply()).to.equal(expectedSupply);
    });
  });

  describe("💳 余额查询测试", function () {
    it("应该向部署者分配所有初始代币", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      const totalSupply = await token.totalSupply();
      
      console.log(`部署者余额: ${ethers.formatUnits(ownerBalance, 18)} ADV`);
      console.log(`总供应量: ${ethers.formatUnits(totalSupply, 18)} ADV`);
      
      expect(ownerBalance).to.equal(totalSupply);
    });

    it("新用户初始余额应该为0", async function () {
      const user1Balance = await token.balanceOf(user1.address);
      console.log(`新用户余额: ${ethers.formatUnits(user1Balance, 18)} ADV`);
      
      expect(user1Balance).to.equal(0);
    });
  });

  describe("🔄 转账功能测试", function () {
    it("应该允许代币转账", async function () {
      // 转账 100 ADV 给 user1
      const transferAmount = ethers.parseUnits("100", 18);
      
      console.log("转账前:");
      console.log(`- 部署者余额: ${ethers.formatUnits(await token.balanceOf(owner.address), 18)} ADV`);
      console.log(`- user1 余额: ${ethers.formatUnits(await token.balanceOf(user1.address), 18)} ADV`);
      
      // 执行转账
      await token.transfer(user1.address, transferAmount);
      
      console.log("转账后:");
      console.log(`- 部署者余额: ${ethers.formatUnits(await token.balanceOf(owner.address), 18)} ADV`);
      console.log(`- user1 余额: ${ethers.formatUnits(await token.balanceOf(user1.address), 18)} ADV`);
      
      // 验证转账结果
      expect(await token.balanceOf(user1.address)).to.equal(transferAmount);
    });

    it("应该拒绝余额不足的转账", async function () {
      // user1 尝试转账，但余额为0
      const transferAmount = ethers.parseUnits("1", 18);
      
      console.log("测试：余额不足时应拒绝转账");
      
      await expect(
        token.connect(user1).transfer(owner.address, transferAmount)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });
  });

  describe("🔥 销毁功能测试", function () {
    it("应该允许用户销毁自己的代币", async function () {
      // 先给 user1 一些代币
      const transferAmount = ethers.parseUnits("1000", 18);
      await token.transfer(user1.address, transferAmount);
      
      const burnAmount = ethers.parseUnits("100", 18);
      
      console.log("销毁前:");
      console.log(`- user1 余额: ${ethers.formatUnits(await token.balanceOf(user1.address), 18)} ADV`);
      console.log(`- 总供应量: ${ethers.formatUnits(await token.totalSupply(), 18)} ADV`);
      
      // 执行销毁
      await token.connect(user1).burn(burnAmount);
      
      console.log("销毁后:");
      console.log(`- user1 余额: ${ethers.formatUnits(await token.balanceOf(user1.address), 18)} ADV`);
      console.log(`- 总供应量: ${ethers.formatUnits(await token.totalSupply(), 18)} ADV`);
      
      // 验证销毁结果
      const expectedBalance = transferAmount - burnAmount;
      expect(await token.balanceOf(user1.address)).to.equal(expectedBalance);
      
      const expectedTotalSupply = ethers.parseUnits("1000000", 18) - burnAmount;
      expect(await token.totalSupply()).to.equal(expectedTotalSupply);
    });

    it("应该拒绝销毁超过余额的代币", async function () {
      const user1Balance = await token.balanceOf(user1.address);
      const burnAmount = user1Balance + ethers.parseUnits("1", 18);
      
      console.log("测试：销毁超过余额的代币时应拒绝");
      
      await expect(
        token.connect(user1).burn(burnAmount)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });

    it("应该允许销毁0个代币（不改变余额）", async function () {
      const initialBalance = await token.balanceOf(user1.address);
      
      console.log("测试：销毁0个代币应该被允许但不改变余额");
      console.log(`销毁前 user1 余额: ${ethers.formatUnits(initialBalance, 18)} ADV`);
      
      // 销毁0个代币应该成功（不会抛出错误）
      await token.connect(user1).burn(0);
      
      const finalBalance = await token.balanceOf(user1.address);
      console.log(`销毁后 user1 余额: ${ethers.formatUnits(finalBalance, 18)} ADV`);
      
      // 余额应该保持不变
      expect(finalBalance).to.equal(initialBalance);
    });

    it("应该允许销毁他人的代币（burnFrom）", async function () {
      // 先给 user1 一些代币
      const transferAmount = ethers.parseUnits("1000", 18);
      await token.transfer(user1.address, transferAmount);
      
      const burnAmount = ethers.parseUnits("200", 18);
      
      // user1 授权给 user2 销毁权限
      await token.connect(user1).approve(user2.address, burnAmount);
      
      console.log("burnFrom 销毁前:");
      console.log(`- user1 余额: ${ethers.formatUnits(await token.balanceOf(user1.address), 18)} ADV`);
      console.log(`- user1 给 user2 的授权额度: ${ethers.formatUnits(await token.allowance(user1.address, user2.address), 18)} ADV`);
      console.log(`- 总供应量: ${ethers.formatUnits(await token.totalSupply(), 18)} ADV`);
      
      // user2 使用 burnFrom 销毁 user1 的代币
      await token.connect(user2).burnFrom(user1.address, burnAmount);
      
      console.log("burnFrom 销毁后:");
      console.log(`- user1 余额: ${ethers.formatUnits(await token.balanceOf(user1.address), 18)} ADV`);
      console.log(`- user1 给 user2 的授权额度: ${ethers.formatUnits(await token.allowance(user1.address, user2.address), 18)} ADV`);
      console.log(`- 总供应量: ${ethers.formatUnits(await token.totalSupply(), 18)} ADV`);
      
      // 验证销毁结果
      const expectedBalance = transferAmount - burnAmount;
      expect(await token.balanceOf(user1.address)).to.equal(expectedBalance);
      
      // 验证授权额度被消耗
      expect(await token.allowance(user1.address, user2.address)).to.equal(0);
      
      // 验证总供应量减少
      const expectedTotalSupply = ethers.parseUnits("1000000", 18) - burnAmount;
      expect(await token.totalSupply()).to.equal(expectedTotalSupply);
    });

    it("应该拒绝未授权的 burnFrom", async function () {
      // 给 user1 一些代币，但不给 user2 授权
      const transferAmount = ethers.parseUnits("1000", 18);
      await token.transfer(user1.address, transferAmount);
      
      const burnAmount = ethers.parseUnits("100", 18);
      
      console.log("测试：未授权时应拒绝 burnFrom");
      
      await expect(
        token.connect(user2).burnFrom(user1.address, burnAmount)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    });

    it("应该拒绝授权额度不足的 burnFrom", async function () {
      // 给 user1 一些代币
      const transferAmount = ethers.parseUnits("1000", 18);
      await token.transfer(user1.address, transferAmount);
      
      const burnAmount = ethers.parseUnits("100", 18);
      const approveAmount = ethers.parseUnits("50", 18); // 授权额度小于销毁数量
      
      // user1 给 user2 少量授权
      await token.connect(user1).approve(user2.address, approveAmount);
      
      console.log("测试：授权额度不足时应拒绝 burnFrom");
      
      await expect(
        token.connect(user2).burnFrom(user1.address, burnAmount)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    });
  });

  describe("👑 管理功能测试", function () {
    it("应该正确设置合约所有者", async function () {
      console.log("测试：合约所有者应该是部署者");
      
      const ownerAddress = await token.getOwner();
      expect(ownerAddress).to.equal(owner.address);
      
      console.log(`合约所有者: ${ownerAddress}`);
      console.log(`部署者地址: ${owner.address}`);
    });

    it("应该允许所有者铸造代币", async function () {
      const mintAmount = ethers.parseUnits("5000", 18);
      const initialSupply = await token.totalSupply();
      const user1InitialBalance = await token.balanceOf(user1.address);
      
      console.log("铸造前:");
      console.log(`- 总供应量: ${ethers.formatUnits(initialSupply, 18)} ADV`);
      console.log(`- user1 余额: ${ethers.formatUnits(user1InitialBalance, 18)} ADV`);
      
      // 所有者铸造代币给 user1
      await token.mint(mintAmount, user1.address);
      
      console.log("铸造后:");
      console.log(`- 总供应量: ${ethers.formatUnits(await token.totalSupply(), 18)} ADV`);
      console.log(`- user1 余额: ${ethers.formatUnits(await token.balanceOf(user1.address), 18)} ADV`);
      
      // 验证铸造结果
      expect(await token.totalSupply()).to.equal(initialSupply + mintAmount);
      expect(await token.balanceOf(user1.address)).to.equal(user1InitialBalance + mintAmount);
    });

    it("应该拒绝非所有者铸造代币", async function () {
      const mintAmount = ethers.parseUnits("1000", 18);
      
      console.log("测试：非所有者不能铸造代币");
      
      await expect(
        token.connect(user1).mint(mintAmount, user2.address)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });

    it("应该拒绝向零地址铸造代币", async function () {
      const mintAmount = ethers.parseUnits("1000", 18);
      
      console.log("测试：不能向零地址铸造代币");
      
      await expect(
        token.mint(mintAmount, ethers.ZeroAddress)
      ).to.be.revertedWith("AdvancedToken: cannot mint to zero address");
    });

    it("应该允许所有者暂停合约", async function () {
      console.log("测试：所有者可以暂停合约");
      
      expect(await token.getPaused()).to.be.false;
      
      await token.pause();
      
      expect(await token.getPaused()).to.be.true;
      console.log("合约已暂停");
    });

    it("应该拒绝非所有者暂停合约", async function () {
      console.log("测试：非所有者不能暂停合约");
      
      await expect(
        token.connect(user1).pause()
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });

    it("应该允许所有者恢复合约", async function () {
      // 先暂停合约
      await token.pause();
      expect(await token.getPaused()).to.be.true;
      
      console.log("测试：所有者可以恢复合约");
      
      await token.unpause();
      
      expect(await token.getPaused()).to.be.false;
      console.log("合约已恢复");
    });

    it("应该拒绝非所有者恢复合约", async function () {
      // 先暂停合约
      await token.pause();
      
      console.log("测试：非所有者不能恢复合约");
      
      await expect(
        token.connect(user1).unpause()
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });

  describe("⏸️ 暂停状态测试", function () {
    beforeEach(async function () {
      // 暂停合约
      await token.pause();
    });

    it("应该拒绝暂停状态下的转账", async function () {
      const transferAmount = ethers.parseUnits("100", 18);
      
      console.log("测试：暂停状态下不能转账");
      
      await expect(
        token.transfer(user1.address, transferAmount)
      ).to.be.revertedWithCustomError(token, "EnforcedPause");
    });

    it("应该拒绝暂停状态下的授权", async function () {
      const approveAmount = ethers.parseUnits("100", 18);
      
      console.log("测试：暂停状态下不能授权");
      
      await expect(
        token.approve(user1.address, approveAmount)
      ).to.be.revertedWithCustomError(token, "EnforcedPause");
    });

    it("应该拒绝暂停状态下的销毁", async function () {
      const burnAmount = ethers.parseUnits("100", 18);
      
      console.log("测试：暂停状态下不能销毁");
      
      await expect(
        token.burn(burnAmount)
      ).to.be.revertedWithCustomError(token, "EnforcedPause");
    });

    it("应该拒绝暂停状态下的 burnFrom", async function () {
      // 先给 user1 一些代币并授权
      await token.unpause(); // 临时恢复以设置测试环境
      const transferAmount = ethers.parseUnits("1000", 18);
      await token.transfer(user1.address, transferAmount);
      await token.connect(user1).approve(user2.address, ethers.parseUnits("100", 18));
      await token.pause(); // 重新暂停
      
      const burnAmount = ethers.parseUnits("100", 18);
      
      console.log("测试：暂停状态下不能 burnFrom");
      
      await expect(
        token.connect(user2).burnFrom(user1.address, burnAmount)
      ).to.be.revertedWithCustomError(token, "EnforcedPause");
    });

    it("应该允许暂停状态下的铸造（仅所有者）", async function () {
      const mintAmount = ethers.parseUnits("1000", 18);
      const initialSupply = await token.totalSupply();
      
      console.log("测试：暂停状态下所有者仍可以铸造");
      
      // 所有者即使在暂停状态下也可以铸造
      await token.mint(mintAmount, user1.address);
      
      expect(await token.totalSupply()).to.equal(initialSupply + mintAmount);
      expect(await token.balanceOf(user1.address)).to.equal(mintAmount);
    });
  });
});