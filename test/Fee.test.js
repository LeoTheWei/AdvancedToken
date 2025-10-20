const { expect } = require("chai");

describe("AdvancedToken 手续费功能测试", function () {
  let AdvancedToken;
  let token;
  let owner;    // 合约部署者
  let user1;    // 测试用户1
  let user2;    // 测试用户2
  let user3;    // 测试用户3

  beforeEach(async function () {
    // 获取测试账户
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    // 部署合约：初始供应量 100万 ADV
    AdvancedToken = await ethers.getContractFactory("AdvancedToken");
    token = await AdvancedToken.deploy(1000000);
    
    // 关闭白名单以专注于测试手续费功能
    await token.setWhitelistEnabled(false);
    
    // 将手续费接收者设置为user3（与owner不同）
    await token.setTaxReceiver(user3.address);
  });

  describe("💰 手续费参数管理测试", function () {
    it("应该正确设置初始手续费参数", async function () {
      console.log("测试：检查初始手续费参数");
      
      // 检查初始手续费率（200 = 2%）
      const taxRate = await token.taxRate();
      expect(taxRate).to.equal(200);
      console.log("✅ 初始手续费率:", taxRate.toString(), "(2%)");
      
      // 检查手续费接收地址（应该是user3）
      const taxReceiver = await token.taxReceiver();
      expect(taxReceiver).to.equal(user3.address);
      console.log("✅ 手续费接收地址:", taxReceiver);
      
      // 检查手续费开关状态
      const taxEnabled = await token.taxEnabled();
      expect(taxEnabled).to.be.true;
      console.log("✅ 手续费开关:", taxEnabled);
      
      // 检查手续费基数
      const taxBase = await token.TAX_BASE();
      expect(taxBase).to.equal(10000);
      console.log("✅ 手续费基数:", taxBase.toString());
    });

    it("应该允许所有者设置手续费率", async function () {
      console.log("测试：所有者设置手续费率");
      
      const newTaxRate = 300; // 3%
      
      // 设置新的手续费率
      await token.setTaxRate(newTaxRate);
      
      // 验证手续费率已更新
      const currentTaxRate = await token.taxRate();
      expect(currentTaxRate).to.equal(newTaxRate);
      console.log("✅ 手续费率已更新为:", currentTaxRate.toString(), "(3%)");
    });

    it("应该拒绝设置过高的手续费率", async function () {
      console.log("测试：拒绝设置过高的手续费率");
      
      const tooHighTaxRate = 600; // 6%，超过5%限制
      
      await expect(
        token.setTaxRate(tooHighTaxRate)
      ).to.be.revertedWith("AdvancedToken: tax rate too high");
      
      console.log("✅ 正确拒绝过高的手续费率");
    });

    it("应该拒绝设置相同的手续费率", async function () {
      console.log("测试：拒绝设置相同的手续费率");
      
      const currentTaxRate = await token.taxRate();
      
      await expect(
        token.setTaxRate(currentTaxRate)
      ).to.be.revertedWith("AdvancedToken: tax rate already set");
      
      console.log("✅ 正确拒绝设置相同的手续费率");
    });

    it("应该允许所有者开启/关闭手续费", async function () {
      console.log("测试：所有者开启/关闭手续费");
      
      // 关闭手续费
      await token.setTaxEnabled(false);
      let taxEnabled = await token.taxEnabled();
      expect(taxEnabled).to.be.false;
      console.log("✅ 手续费已关闭");
      
      // 开启手续费
      await token.setTaxEnabled(true);
      taxEnabled = await token.taxEnabled();
      expect(taxEnabled).to.be.true;
      console.log("✅ 手续费已开启");
    });

    it("应该拒绝非所有者设置手续费率", async function () {
      console.log("测试：非所有者不能设置手续费率");
      
      await expect(
        token.connect(user1).setTaxRate(300)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
      
      console.log("✅ 非所有者不能设置手续费率");
    });

    it("应该拒绝非所有者设置手续费开关", async function () {
      console.log("测试：非所有者不能设置手续费开关");
      
      await expect(
        token.connect(user1).setTaxEnabled(false)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
      
      console.log("✅ 非所有者不能设置手续费开关");
    });
  });

  describe("💸 手续费计算和收取测试", function () {
    beforeEach(async function () {
      // 确保手续费开启（默认就是2%的手续费率）
      await token.setTaxEnabled(true);
    });

    it("应该正确计算和收取转账手续费", async function () {
      console.log("测试：转账时正确计算和收取手续费");
      
      const transferAmount = ethers.parseUnits("1000", 18); // 1000 ADV
      const expectedTax = ethers.parseUnits("20", 18); // 20 ADV (2%)
      const expectedNetAmount = ethers.parseUnits("980", 18); // 980 ADV
      
      // 记录转账前余额
      const ownerInitialBalance = await token.balanceOf(owner.address);
      const user1InitialBalance = await token.balanceOf(user1.address);
      const taxReceiverInitialBalance = await token.balanceOf(await token.taxReceiver());
      
      console.log("转账前余额:");
      console.log(`- 部署者: ${ethers.formatUnits(ownerInitialBalance, 18)} ADV`);
      console.log(`- user1: ${ethers.formatUnits(user1InitialBalance, 18)} ADV`);
      console.log(`- 手续费接收者: ${ethers.formatUnits(taxReceiverInitialBalance, 18)} ADV`);
      
      // 执行转账
      await token.transfer(user1.address, transferAmount);
      
      // 记录转账后余额
      const ownerFinalBalance = await token.balanceOf(owner.address);
      const user1FinalBalance = await token.balanceOf(user1.address);
      const taxReceiverFinalBalance = await token.balanceOf(await token.taxReceiver());
      
      console.log("转账后余额:");
      console.log(`- 部署者: ${ethers.formatUnits(ownerFinalBalance, 18)} ADV`);
      console.log(`- user1: ${ethers.formatUnits(user1FinalBalance, 18)} ADV`);
      console.log(`- 手续费接收者: ${ethers.formatUnits(taxReceiverFinalBalance, 18)} ADV`);
      
      // 验证手续费计算
      expect(ownerFinalBalance).to.equal(ownerInitialBalance - transferAmount);
      expect(user1FinalBalance).to.equal(user1InitialBalance + expectedNetAmount);
      expect(taxReceiverFinalBalance).to.equal(taxReceiverInitialBalance + expectedTax);
      
      console.log("✅ 手续费计算和收取正确");
    });

    it("应该正确计算和收取授权转账手续费", async function () {
      console.log("测试：授权转账时正确计算和收取手续费");
      
      const transferAmount = ethers.parseUnits("500", 18); // 500 ADV
      const expectedTax = ethers.parseUnits("10", 18); // 10 ADV (2%)
      const expectedNetAmount = ethers.parseUnits("490", 18); // 490 ADV
      
      // 先给user1一些代币
      await token.transfer(user1.address, transferAmount);
      
      // user1授权给user2
      await token.connect(user1).approve(user2.address, transferAmount);
      
      // 记录转账前余额
      const user1InitialBalance = await token.balanceOf(user1.address);
      const user2InitialBalance = await token.balanceOf(user2.address);
      const taxReceiverInitialBalance = await token.balanceOf(await token.taxReceiver());
      
      console.log("授权转账前余额:");
      console.log(`- user1: ${ethers.formatUnits(user1InitialBalance, 18)} ADV`);
      console.log(`- user2: ${ethers.formatUnits(user2InitialBalance, 18)} ADV`);
      console.log(`- 手续费接收者: ${ethers.formatUnits(taxReceiverInitialBalance, 18)} ADV`);
      
      // user2使用授权转账
      await token.connect(user2).transferFrom(user1.address, user2.address, transferAmount);
      
      // 记录转账后余额
      const user1FinalBalance = await token.balanceOf(user1.address);
      const user2FinalBalance = await token.balanceOf(user2.address);
      const taxReceiverFinalBalance = await token.balanceOf(await token.taxReceiver());
      
      console.log("授权转账后余额:");
      console.log(`- user1: ${ethers.formatUnits(user1FinalBalance, 18)} ADV`);
      console.log(`- user2: ${ethers.formatUnits(user2FinalBalance, 18)} ADV`);
      console.log(`- 手续费接收者: ${ethers.formatUnits(taxReceiverFinalBalance, 18)} ADV`);
      
      // 验证手续费计算
      expect(user1FinalBalance).to.equal(user1InitialBalance - transferAmount);
      expect(user2FinalBalance).to.equal(user2InitialBalance + expectedNetAmount);
      expect(taxReceiverFinalBalance).to.equal(taxReceiverInitialBalance + expectedTax);
      
      console.log("✅ 授权转账手续费计算和收取正确");
    });

    it("应该在手续费关闭时不收取手续费", async function () {
      console.log("测试：手续费关闭时不收取手续费");
      
      // 关闭手续费
      await token.setTaxEnabled(false);
      
      const transferAmount = ethers.parseUnits("1000", 18);
      
      // 记录转账前余额
      const ownerInitialBalance = await token.balanceOf(owner.address);
      const user1InitialBalance = await token.balanceOf(user1.address);
      const taxReceiverInitialBalance = await token.balanceOf(await token.taxReceiver());
      
      // 执行转账
      await token.transfer(user1.address, transferAmount);
      
      // 记录转账后余额
      const ownerFinalBalance = await token.balanceOf(owner.address);
      const user1FinalBalance = await token.balanceOf(user1.address);
      const taxReceiverFinalBalance = await token.balanceOf(await token.taxReceiver());
      
      // 验证不收取手续费
      expect(ownerFinalBalance).to.equal(ownerInitialBalance - transferAmount);
      expect(user1FinalBalance).to.equal(user1InitialBalance + transferAmount);
      expect(taxReceiverFinalBalance).to.equal(taxReceiverInitialBalance); // 手续费接收者余额不变
      
      console.log("✅ 手续费关闭时正确不收取手续费");
    });

    it("应该正确处理1%手续费率的计算", async function () {
      console.log("测试：1%手续费率的计算");
      
      const transferAmount = ethers.parseUnits("1000", 18);
      
      // 设置1%手续费率
      await token.setTaxRate(100); // 1%
      const tax1Percent = ethers.parseUnits("10", 18); // 10 ADV
      const netAmount1Percent = ethers.parseUnits("990", 18); // 990 ADV
      
      await token.transfer(user1.address, transferAmount);
      
      const user1Balance1Percent = await token.balanceOf(user1.address);
      const taxReceiverBalance1Percent = await token.balanceOf(await token.taxReceiver());
      
      expect(user1Balance1Percent).to.equal(netAmount1Percent);
      expect(taxReceiverBalance1Percent).to.equal(ethers.parseUnits("1000000", 18) + tax1Percent);
      
      console.log("✅ 1%手续费率计算正确");
    });

    it("应该正确处理0.5%手续费率的计算", async function () {
      console.log("测试：0.5%手续费率的计算");
      
      const transferAmount = ethers.parseUnits("1000", 18);
      
      // 设置0.5%手续费率
      await token.setTaxRate(50); // 0.5%
      const tax05Percent = ethers.parseUnits("5", 18); // 5 ADV
      const netAmount05Percent = ethers.parseUnits("995", 18); // 995 ADV
      
      await token.transfer(user1.address, transferAmount);
      
      const user1Balance05Percent = await token.balanceOf(user1.address);
      const taxReceiverBalance05Percent = await token.balanceOf(await token.taxReceiver());
      
      expect(user1Balance05Percent).to.equal(netAmount05Percent);
      expect(taxReceiverBalance05Percent).to.equal(ethers.parseUnits("1000000", 18) + tax05Percent);
      
      console.log("✅ 0.5%手续费率计算正确");
    });

    it("应该正确计算零手续费的情况", async function () {
      console.log("测试：零手续费的情况");
      
      // 设置0%手续费率
      await token.setTaxRate(0);
      
      const transferAmount = ethers.parseUnits("1000", 18);
      
      // 记录转账前余额
      const ownerInitialBalance = await token.balanceOf(owner.address);
      const user1InitialBalance = await token.balanceOf(user1.address);
      const taxReceiverInitialBalance = await token.balanceOf(await token.taxReceiver());
      
      // 执行转账
      await token.transfer(user1.address, transferAmount);
      
      // 记录转账后余额
      const ownerFinalBalance = await token.balanceOf(owner.address);
      const user1FinalBalance = await token.balanceOf(user1.address);
      const taxReceiverFinalBalance = await token.balanceOf(await token.taxReceiver());
      
      // 验证不收取手续费
      expect(ownerFinalBalance).to.equal(ownerInitialBalance - transferAmount);
      expect(user1FinalBalance).to.equal(user1InitialBalance + transferAmount);
      expect(taxReceiverFinalBalance).to.equal(taxReceiverInitialBalance);
      
      console.log("✅ 0%手续费率计算正确");
    });
  });

  describe("📢 手续费事件测试", function () {
    it("应该触发手续费率更新事件", async function () {
      console.log("测试：手续费率更新应该触发事件");
      
      const newTaxRate = 300;
      
      // 监听事件
      const tx = await token.setTaxRate(newTaxRate);
      const receipt = await tx.wait();
      
      // 查找事件
      const event = receipt.logs.find(log => {
        try {
          const decoded = token.interface.parseLog(log);
          return decoded.name === "TaxRateUpdated";
        } catch (e) {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      
      const decodedEvent = token.interface.parseLog(event);
      expect(decodedEvent.args.newTaxRate).to.equal(newTaxRate);
      
      console.log("✅ 手续费率更新事件触发成功");
    });

    it("应该触发手续费开关事件", async function () {
      console.log("测试：手续费开关应该触发事件");
      
      // 监听事件
      const tx = await token.setTaxEnabled(false);
      const receipt = await tx.wait();
      
      // 查找事件
      const event = receipt.logs.find(log => {
        try {
          const decoded = token.interface.parseLog(log);
          return decoded.name === "TaxEnabledUpdated";
        } catch (e) {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      
      const decodedEvent = token.interface.parseLog(event);
      expect(decodedEvent.args.taxEnabled).to.be.false;
      
      console.log("✅ 手续费开关事件触发成功");
    });

    it("应该触发手续费收取事件", async function () {
      console.log("测试：手续费收取应该触发事件");
      
      // 确保手续费开启（默认就是2%的手续费率）
      await token.setTaxEnabled(true);
      
      const transferAmount = ethers.parseUnits("1000", 18);
      const expectedTax = ethers.parseUnits("20", 18); // 2%
      
      // 监听事件
      const tx = await token.transfer(user1.address, transferAmount);
      const receipt = await tx.wait();
      
      // 查找TaxCharged事件
      const event = receipt.logs.find(log => {
        try {
          const decoded = token.interface.parseLog(log);
          return decoded.name === "TaxCharged";
        } catch (e) {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      
      const decodedEvent = token.interface.parseLog(event);
      expect(decodedEvent.args.from).to.equal(owner.address);
      expect(decodedEvent.args.amount).to.equal(transferAmount);
      expect(decodedEvent.args.taxAmount).to.equal(expectedTax);
      
      console.log("✅ 手续费收取事件触发成功");
    });
  });

  describe("🔄 手续费状态切换测试", function () {
    it("应该正确处理手续费开关的动态切换", async function () {
      console.log("测试：手续费开关动态切换");
      
      const transferAmount = ethers.parseUnits("1000", 18);
      
      // 初始状态：手续费开启，2%
      expect(await token.taxEnabled()).to.be.true;
      expect(await token.taxRate()).to.equal(200);
      
      // 第一次转账（收取2%手续费）
      await token.transfer(user1.address, transferAmount);
      
      let user1Balance = await token.balanceOf(user1.address);
      let taxReceiverBalance = await token.balanceOf(await token.taxReceiver());
      
      expect(user1Balance).to.equal(ethers.parseUnits("980", 18)); // 980 ADV
      expect(taxReceiverBalance).to.equal(ethers.parseUnits("1000000", 18) + ethers.parseUnits("20", 18)); // 1000000 + 20 ADV
      
      console.log("✅ 2%手续费收取正确");
      
      // 关闭手续费
      await token.setTaxEnabled(false);
      expect(await token.taxEnabled()).to.be.false;
      
      // 第二次转账（不收取手续费）
      await token.transfer(user2.address, transferAmount);
      
      let user2Balance = await token.balanceOf(user2.address);
      let taxReceiverBalanceAfter = await token.balanceOf(await token.taxReceiver());
      
      expect(user2Balance).to.equal(transferAmount); // 1000 ADV
      expect(taxReceiverBalanceAfter).to.equal(taxReceiverBalance); // 手续费接收者余额不变
      
      console.log("✅ 手续费关闭时正确不收取手续费");
      
      // 重新开启手续费（保持2%）
      await token.setTaxEnabled(true);
      
      expect(await token.taxEnabled()).to.be.true;
      expect(await token.taxRate()).to.equal(200);
      
      // 第三次转账（收取2%手续费）
      await token.transfer(user3.address, transferAmount);
      
      let user3Balance = await token.balanceOf(user3.address);
      let taxReceiverBalanceFinal = await token.balanceOf(await token.taxReceiver());
      
      expect(user3Balance).to.equal(ethers.parseUnits("980", 18)); // 980 ADV
      expect(taxReceiverBalanceFinal).to.equal(taxReceiverBalanceAfter + ethers.parseUnits("20", 18)); // 增加20 ADV手续费
      
      console.log("✅ 2%手续费收取正确");
      console.log("✅ 手续费开关动态切换测试成功");
    });
  });

  describe("🔍 手续费边界测试", function () {
    it("应该正确处理最大手续费率", async function () {
      console.log("测试：最大手续费率（5%）");
      
      // 设置最大手续费率
      await token.setTaxRate(500); // 5%
      
      const transferAmount = ethers.parseUnits("1000", 18);
      const expectedTax = ethers.parseUnits("50", 18); // 50 ADV (5%)
      const expectedNetAmount = ethers.parseUnits("950", 18); // 950 ADV
      
      await token.transfer(user1.address, transferAmount);
      
      const user1Balance = await token.balanceOf(user1.address);
      const taxReceiverBalance = await token.balanceOf(await token.taxReceiver());
      
      expect(user1Balance).to.equal(expectedNetAmount);
      expect(taxReceiverBalance).to.equal(ethers.parseUnits("1000000", 18) + expectedTax);
      
      console.log("✅ 5%手续费率计算正确");
    });

    it("应该正确处理极小转账金额的手续费", async function () {
      console.log("测试：极小转账金额的手续费");
      
      // 设置1%手续费率
      await token.setTaxRate(100); // 1%
      
      const transferAmount = ethers.parseUnits("1", 18); // 1 ADV
      const expectedTax = ethers.parseUnits("0.01", 18); // 0.01 ADV (1%)
      const expectedNetAmount = ethers.parseUnits("0.99", 18); // 0.99 ADV
      
      await token.transfer(user1.address, transferAmount);
      
      const user1Balance = await token.balanceOf(user1.address);
      const taxReceiverBalance = await token.balanceOf(await token.taxReceiver());
      
      expect(user1Balance).to.equal(expectedNetAmount);
      expect(taxReceiverBalance).to.equal(ethers.parseUnits("1000000", 18) + expectedTax);
      
      console.log("✅ 极小转账金额手续费计算正确");
    });
  });
});
