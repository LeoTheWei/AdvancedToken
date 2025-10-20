const { expect } = require("chai");

describe("AdvancedToken 核心功能测试", function () {
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
    beforeEach(async function () {
      // 关闭白名单和手续费以测试基础转账功能
      await token.setWhitelistEnabled(false);
      await token.setTaxEnabled(false);
    });

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
    beforeEach(async function () {
      // 关闭白名单和手续费以测试基础销毁功能
      await token.setWhitelistEnabled(false);
      await token.setTaxEnabled(false);
    });

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
      // 关闭白名单和手续费以测试暂停功能
      await token.setWhitelistEnabled(false);
      await token.setTaxEnabled(false);
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

  describe("👥 白名单功能测试", function () {
    it("应该正确设置初始白名单状态", async function () {
      console.log("测试：检查初始白名单状态");
      
      // 部署者应该在白名单中
      expect(await token.isWhitelisted(owner.address)).to.be.true;
      console.log("✅ 部署者在白名单中");
      
      // 其他用户不在白名单中
      expect(await token.isWhitelisted(user1.address)).to.be.false;
      expect(await token.isWhitelisted(user2.address)).to.be.false;
      console.log("✅ 其他用户不在白名单中");
      
      // 白名单应该默认开启
      expect(await token.whistelistEnabled()).to.be.true;
      console.log("✅ 白名单默认开启");
    });

    it("应该允许所有者添加地址到白名单", async function () {
      console.log("测试：所有者添加地址到白名单");
      
      // 添加前检查
      expect(await token.isWhitelisted(user1.address)).to.be.false;
      
      // 添加用户1到白名单
      await token.setWhitelist(user1.address, true);
      
      // 添加后检查
      expect(await token.isWhitelisted(user1.address)).to.be.true;
      console.log("✅ 用户1已添加到白名单");
    });

    it("应该允许所有者从白名单移除地址", async function () {
      console.log("测试：所有者从白名单移除地址");
      
      // 先将用户1添加到白名单
      await token.setWhitelist(user1.address, true);
      expect(await token.isWhitelisted(user1.address)).to.be.true;
      
      // 从白名单移除用户1
      await token.setWhitelist(user1.address, false);
      
      // 移除后检查
      expect(await token.isWhitelisted(user1.address)).to.be.false;
      console.log("✅ 用户1已从白名单移除");
    });

    it("应该允许批量添加地址到白名单", async function () {
      console.log("测试：批量添加地址到白名单");
      
      const addresses = [user1.address, user2.address];
      
      // 批量添加前检查
      for (const addr of addresses) {
        expect(await token.isWhitelisted(addr)).to.be.false;
      }
      
      // 批量添加到白名单
      await token.batchSetWhitelist(addresses, true);
      
      // 批量添加后检查
      for (const addr of addresses) {
        expect(await token.isWhitelisted(addr)).to.be.true;
        console.log(`✅ ${addr} 已添加到白名单`);
      }
    });

    it("应该允许批量从白名单移除地址", async function () {
      console.log("测试：批量从白名单移除地址");
      
      const addresses = [user1.address, user2.address];
      
      // 先批量添加到白名单
      await token.batchSetWhitelist(addresses, true);
      
      // 验证已添加
      for (const addr of addresses) {
        expect(await token.isWhitelisted(addr)).to.be.true;
      }
      
      // 批量从白名单移除
      await token.batchSetWhitelist(addresses, false);
      
      // 批量移除后检查
      for (const addr of addresses) {
        expect(await token.isWhitelisted(addr)).to.be.false;
        console.log(`✅ ${addr} 已从白名单移除`);
      }
    });

    it("应该允许所有者开启/关闭白名单", async function () {
      console.log("测试：所有者可以开启/关闭白名单");
      
      // 确认初始状态为开启
      expect(await token.whistelistEnabled()).to.be.true;
      
      // 关闭白名单
      await token.setWhitelistEnabled(false);
      expect(await token.whistelistEnabled()).to.be.false;
      console.log("✅ 白名单已关闭");
      
      // 开启白名单
      await token.setWhitelistEnabled(true);
      expect(await token.whistelistEnabled()).to.be.true;
      console.log("✅ 白名单已开启");
    });

    it("应该拒绝非所有者操作白名单", async function () {
      console.log("测试：非所有者不能操作白名单");
      
      // 非所有者尝试添加白名单
      await expect(
        token.connect(user1).setWhitelist(user2.address, true)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
      
      // 非所有者尝试批量操作
      await expect(
        token.connect(user1).batchSetWhitelist([user2.address], true)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
      
      // 非所有者尝试开关白名单
      await expect(
        token.connect(user1).setWhitelistEnabled(false)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
      
      console.log("✅ 非所有者不能操作白名单");
    });

    it("应该拒绝零地址操作", async function () {
      console.log("测试：不能对零地址操作白名单");
      
      await expect(
        token.setWhitelist(ethers.ZeroAddress, true)
      ).to.be.revertedWith("AdvancedToken: zero address");
      
      await expect(
        token.batchSetWhitelist([ethers.ZeroAddress], true)
      ).to.be.revertedWith("AdvancedToken: zero address");
      
      console.log("✅ 不能对零地址操作白名单");
    });

    it("应该拒绝空地址数组的批量操作", async function () {
      console.log("测试：不能对空地址数组进行批量操作");
      
      const emptyAddresses = [];
      
      await expect(
        token.batchSetWhitelist(emptyAddresses, true)
      ).to.be.revertedWith("AdvancedToken: accounts is empty");
      
      console.log("✅ 不能对空地址数组进行批量操作");
    });
  });

  describe("🚫 白名单限制测试", function () {
    beforeEach(async function () {
      // 确保白名单开启，手续费关闭
      await token.setWhitelistEnabled(true);
      await token.setTaxEnabled(false);
      // 将用户1添加到白名单，用户2不在白名单中
      await token.setWhitelist(user1.address, true);
    });

    it("应该允许白名单用户之间转账", async function () {
      console.log("测试：白名单用户之间可以转账");
      
      const transferAmount = ethers.parseUnits("100", 18);
      
      // 先将用户2也添加到白名单
      await token.setWhitelist(user2.address, true);
      
      // 从部署者（在白名单中）转账给用户1（在白名单中）
      await token.transfer(user1.address, transferAmount);
      
      // 从用户1转账给用户2（都在白名单中）
      await token.connect(user1).transfer(user2.address, transferAmount);
      
      expect(await token.balanceOf(user2.address)).to.equal(transferAmount);
      console.log("✅ 白名单用户之间转账成功");
    });

    it("应该拒绝白名单用户向非白名单用户转账", async function () {
      console.log("测试：白名单用户不能向非白名单用户转账");
      
      const transferAmount = ethers.parseUnits("100", 18);
      
      // 先给用户1一些代币
      await token.transfer(user1.address, transferAmount);
      
      // 用户1（在白名单中）尝试向用户2（不在白名单中）转账
      await expect(
        token.connect(user1).transfer(user2.address, transferAmount)
      ).to.be.revertedWith("AdvancedToken: receiver not in whitelist");
      
      console.log("✅ 白名单用户不能向非白名单用户转账");
    });

    it("应该拒绝非白名单用户转账", async function () {
      console.log("测试：非白名单用户不能转账");
      
      const transferAmount = ethers.parseUnits("100", 18);
      
      // 先关闭白名单，给用户2一些代币，然后重新开启白名单
      await token.setWhitelistEnabled(false);
      await token.transfer(user2.address, transferAmount);
      await token.setWhitelistEnabled(true);
      
      // 用户2（不在白名单中）尝试转账
      await expect(
        token.connect(user2).transfer(user1.address, transferAmount)
      ).to.be.revertedWith("AdvancedToken: sender not in whitelist");
      
      console.log("✅ 非白名单用户不能转账");
    });

    it("应该允许白名单用户授权给白名单用户", async function () {
      console.log("测试：白名单用户可以向白名单用户授权");
      
      const approveAmount = ethers.parseUnits("100", 18);
      
      // 先将用户2也添加到白名单
      await token.setWhitelist(user2.address, true);
      
      // 用户1（在白名单中）授权给用户2（在白名单中）
      await token.connect(user1).approve(user2.address, approveAmount);
      
      expect(await token.allowance(user1.address, user2.address)).to.equal(approveAmount);
      console.log("✅ 白名单用户之间授权成功");
    });

    it("应该拒绝白名单用户授权给非白名单用户", async function () {
      console.log("测试：白名单用户不能授权给非白名单用户");
      
      const approveAmount = ethers.parseUnits("100", 18);
      
      // 用户1（在白名单中）尝试授权给用户2（不在白名单中）
      await expect(
        token.connect(user1).approve(user2.address, approveAmount)
      ).to.be.revertedWith("AdvancedToken: receiver not in whitelist");
      
      console.log("✅ 白名单用户不能授权给非白名单用户");
    });

    it("应该拒绝非白名单用户授权", async function () {
      console.log("测试：非白名单用户不能授权");
      
      const approveAmount = ethers.parseUnits("100", 18);
      
      // 先关闭白名单，给用户2一些代币，然后重新开启白名单
      await token.setWhitelistEnabled(false);
      await token.transfer(user2.address, approveAmount);
      await token.setWhitelistEnabled(true);
      
      // 用户2（不在白名单中）尝试授权
      await expect(
        token.connect(user2).approve(user1.address, approveAmount)
      ).to.be.revertedWith("AdvancedToken: sender not in whitelist");
      
      console.log("✅ 非白名单用户不能授权");
    });
  });

  describe("🔓 白名单关闭时的行为测试", function () {
    beforeEach(async function () {
      // 关闭白名单和手续费
      await token.setWhitelistEnabled(false);
      await token.setTaxEnabled(false);
    });

    it("应该允许任意用户之间转账（白名单关闭）", async function () {
      console.log("测试：白名单关闭时，任意用户之间可以转账");
      
      const transferAmount = ethers.parseUnits("100", 18);
      
      // 给用户1一些代币
      await token.transfer(user1.address, transferAmount);
      
      // 用户1转账给用户2（都不在白名单中，但白名单已关闭）
      await token.connect(user1).transfer(user2.address, transferAmount);
      
      expect(await token.balanceOf(user2.address)).to.equal(transferAmount);
      console.log("✅ 白名单关闭时，任意用户之间可以转账");
    });

    it("应该允许任意用户授权（白名单关闭）", async function () {
      console.log("测试：白名单关闭时，任意用户可以授权");
      
      const approveAmount = ethers.parseUnits("100", 18);
      
      // 给用户1一些代币
      await token.transfer(user1.address, approveAmount);
      
      // 用户1授权给用户2（都不在白名单中，但白名单已关闭）
      await token.connect(user1).approve(user2.address, approveAmount);
      
      expect(await token.allowance(user1.address, user2.address)).to.equal(approveAmount);
      console.log("✅ 白名单关闭时，任意用户可以授权");
    });
  });

  describe("📢 白名单事件测试", function () {
    it("应该触发白名单更新事件", async function () {
      console.log("测试：白名单更新应该触发事件");
      
      // 监听事件
      const tx = await token.setWhitelist(user1.address, true);
      const receipt = await tx.wait();
      
      // 查找事件
      const event = receipt.logs.find(log => {
        try {
          const decoded = token.interface.parseLog(log);
          return decoded.name === "WhitelistUpdated";
        } catch (e) {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      
      const decodedEvent = token.interface.parseLog(event);
      expect(decodedEvent.args.account).to.equal(user1.address);
      expect(decodedEvent.args.status).to.be.true;
      
      console.log("✅ 白名单更新事件触发成功");
    });

    it("应该触发白名单开关事件", async function () {
      console.log("测试：白名单开关应该触发事件");
      
      // 监听事件
      const tx = await token.setWhitelistEnabled(false);
      const receipt = await tx.wait();
      
      // 查找事件
      const event = receipt.logs.find(log => {
        try {
          const decoded = token.interface.parseLog(log);
          return decoded.name === "WhitelistEnableUpdated";
        } catch (e) {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      
      const decodedEvent = token.interface.parseLog(event);
      expect(decodedEvent.args.enabled).to.be.false;
      
      console.log("✅ 白名单开关事件触发成功");
    });

    it("应该触发批量白名单更新事件", async function () {
      console.log("测试：批量白名单更新应该触发事件");
      
      const addresses = [user1.address, user2.address];
      
      // 监听事件
      const tx = await token.batchSetWhitelist(addresses, true);
      const receipt = await tx.wait();
      
      // 查找事件
      const event = receipt.logs.find(log => {
        try {
          const decoded = token.interface.parseLog(log);
          return decoded.name === "WhitelistBatchUpdated";
        } catch (e) {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      
      const decodedEvent = token.interface.parseLog(event);
      expect(decodedEvent.args.accounts).to.deep.equal(addresses);
      expect(decodedEvent.args.status).to.be.true;
      
      console.log("✅ 批量白名单更新事件触发成功");
    });
  });

  describe("🔄 白名单状态切换测试", function () {
    it("应该正确处理白名单状态的动态切换", async function () {
      console.log("测试：白名单状态动态切换");
      
      const transferAmount = ethers.parseUnits("100", 18);
      
      // 初始状态：白名单开启，只有部署者在白名单中
      expect(await token.whistelistEnabled()).to.be.true;
      expect(await token.isWhitelisted(owner.address)).to.be.true;
      expect(await token.isWhitelisted(user1.address)).to.be.false;
      
      // 先关闭白名单和手续费，给用户1一些代币，然后重新开启白名单
      await token.setWhitelistEnabled(false);
      await token.setTaxEnabled(false);
      await token.transfer(user1.address, transferAmount);
      await token.setWhitelistEnabled(true);
      
      // 用户1尝试转账（应该失败，因为不在白名单中）
      await expect(
        token.connect(user1).transfer(user2.address, transferAmount)
      ).to.be.revertedWith("AdvancedToken: sender not in whitelist");
      
      // 关闭白名单
      await token.setWhitelistEnabled(false);
      expect(await token.whistelistEnabled()).to.be.false;
      
      // 现在用户1应该可以转账了
      await token.connect(user1).transfer(user2.address, transferAmount);
      expect(await token.balanceOf(user2.address)).to.equal(transferAmount);
      
      // 重新开启白名单
      await token.setWhitelistEnabled(true);
      expect(await token.whistelistEnabled()).to.be.true;
      
      // 用户2尝试转账（应该失败，因为不在白名单中）
      await expect(
        token.connect(user2).transfer(user1.address, transferAmount)
      ).to.be.revertedWith("AdvancedToken: sender not in whitelist");
      
      console.log("✅ 白名单状态动态切换测试成功");
    });
  });

});