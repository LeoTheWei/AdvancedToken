const { expect } = require("chai");

describe("AdvancedToken 代币销毁功能测试", function () {
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
    
    // 关闭白名单以专注于测试销毁功能
    await token.setWhitelistEnabled(false);
    
    // 将手续费接收者设置为user3（与owner不同）
    await token.setTaxReceiver(user3.address);
  });

  describe("🔥 销毁参数管理测试", function () {
    it("应该正确设置初始销毁参数", async function () {
      console.log("测试：检查初始销毁参数");
      
      // 检查初始销毁比例（5000 = 50%）
      const burnPercentage = await token.burnPercentage();
      expect(burnPercentage).to.equal(5000);
      console.log("✅ 初始销毁比例:", burnPercentage.toString(), "(50%)");
      
      // 检查销毁开关状态
      const burnEnabled = await token.burnEnabled();
      expect(burnEnabled).to.be.true;
      console.log("✅ 销毁开关:", burnEnabled);
      
      // 检查手续费基数
      const taxBase = await token.TAX_BASE();
      expect(taxBase).to.equal(10000);
      console.log("✅ 手续费基数:", taxBase.toString());
    });

    it("应该允许所有者设置销毁比例", async function () {
      console.log("测试：所有者设置销毁比例");
      
      const newBurnPercentage = 3000; // 30%
      
      // 设置新的销毁比例
      await token.setBurnPercentage(newBurnPercentage);
      
      // 验证销毁比例已更新
      const currentBurnPercentage = await token.burnPercentage();
      expect(currentBurnPercentage).to.equal(newBurnPercentage);
      console.log("✅ 销毁比例已更新为:", currentBurnPercentage.toString(), "(30%)");
    });

    it("应该拒绝设置过高的销毁比例", async function () {
      console.log("测试：拒绝设置过高的销毁比例");
      
      const tooHighBurnPercentage = 10001; // 超过100%
      
      await expect(
        token.setBurnPercentage(tooHighBurnPercentage)
      ).to.be.revertedWith("AdvancedToken: burn percentage too high");
      
      console.log("✅ 正确拒绝过高的销毁比例");
    });

    it("应该拒绝设置相同的销毁比例", async function () {
      console.log("测试：拒绝设置相同的销毁比例");
      
      const currentBurnPercentage = await token.burnPercentage();
      
      await expect(
        token.setBurnPercentage(currentBurnPercentage)
      ).to.be.revertedWith("AdvancedToken: burn percentage already set");
      
      console.log("✅ 正确拒绝设置相同的销毁比例");
    });

    it("应该允许所有者开启/关闭销毁功能", async function () {
      console.log("测试：所有者开启/关闭销毁功能");
      
      // 关闭销毁功能
      await token.setBurnEnabled(false);
      let burnEnabled = await token.burnEnabled();
      expect(burnEnabled).to.be.false;
      console.log("✅ 销毁功能已关闭");
      
      // 开启销毁功能
      await token.setBurnEnabled(true);
      burnEnabled = await token.burnEnabled();
      expect(burnEnabled).to.be.true;
      console.log("✅ 销毁功能已开启");
    });

    it("应该拒绝非所有者设置销毁比例", async function () {
      console.log("测试：非所有者不能设置销毁比例");
      
      await expect(
        token.connect(user1).setBurnPercentage(3000)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
      
      console.log("✅ 非所有者不能设置销毁比例");
    });

    it("应该拒绝非所有者设置销毁开关", async function () {
      console.log("测试：非所有者不能设置销毁开关");
      
      await expect(
        token.connect(user1).setBurnEnabled(false)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
      
      console.log("✅ 非所有者不能设置销毁开关");
    });
  });

  describe("🔥 手续费分配和销毁测试", function () {
    beforeEach(async function () {
      // 确保手续费和销毁功能开启
      await token.setTaxEnabled(true);
      await token.setBurnEnabled(true);
    });

    it("应该正确分配手续费到销毁和接收者", async function () {
      console.log("测试：手续费正确分配到销毁和接收者");
      
      const transferAmount = ethers.parseUnits("1000", 18); // 1000 ADV
      const expectedTax = ethers.parseUnits("20", 18); // 20 ADV (2%)
      const expectedBurnAmount = ethers.parseUnits("10", 18); // 10 ADV (50% of tax)
      const expectedReceiverAmount = ethers.parseUnits("10", 18); // 10 ADV (50% of tax)
      const expectedNetAmount = ethers.parseUnits("980", 18); // 980 ADV
      
      // 记录转账前状态
      const ownerInitialBalance = await token.balanceOf(owner.address);
      const user1InitialBalance = await token.balanceOf(user1.address);
      const taxReceiverInitialBalance = await token.balanceOf(user3.address);
      const initialTotalSupply = await token.totalSupply();
      
      console.log("转账前状态:");
      console.log(`- 部署者余额: ${ethers.formatUnits(ownerInitialBalance, 18)} ADV`);
      console.log(`- user1余额: ${ethers.formatUnits(user1InitialBalance, 18)} ADV`);
      console.log(`- 手续费接收者余额: ${ethers.formatUnits(taxReceiverInitialBalance, 18)} ADV`);
      console.log(`- 总供应量: ${ethers.formatUnits(initialTotalSupply, 18)} ADV`);
      
      // 执行转账
      await token.transfer(user1.address, transferAmount);
      
      // 记录转账后状态
      const ownerFinalBalance = await token.balanceOf(owner.address);
      const user1FinalBalance = await token.balanceOf(user1.address);
      const taxReceiverFinalBalance = await token.balanceOf(user3.address);
      const finalTotalSupply = await token.totalSupply();
      
      console.log("转账后状态:");
      console.log(`- 部署者余额: ${ethers.formatUnits(ownerFinalBalance, 18)} ADV`);
      console.log(`- user1余额: ${ethers.formatUnits(user1FinalBalance, 18)} ADV`);
      console.log(`- 手续费接收者余额: ${ethers.formatUnits(taxReceiverFinalBalance, 18)} ADV`);
      console.log(`- 总供应量: ${ethers.formatUnits(finalTotalSupply, 18)} ADV`);
      
      // 验证余额变化
      expect(ownerFinalBalance).to.equal(ownerInitialBalance - transferAmount);
      expect(user1FinalBalance).to.equal(user1InitialBalance + expectedNetAmount);
      expect(taxReceiverFinalBalance).to.equal(taxReceiverInitialBalance + expectedReceiverAmount);
      expect(finalTotalSupply).to.equal(initialTotalSupply - expectedBurnAmount);
      
      console.log("✅ 手续费分配和销毁正确");
    });

    it("应该正确处理不同销毁比例的计算", async function () {
      console.log("测试：不同销毁比例的计算");
      
      const transferAmount = ethers.parseUnits("1000", 18);
      const expectedTax = ethers.parseUnits("20", 18); // 20 ADV (2%)
      
      // 测试30%销毁比例
      await token.setBurnPercentage(3000); // 30%
      const burnAmount30 = ethers.parseUnits("6", 18); // 6 ADV (30% of 20)
      const receiverAmount30 = ethers.parseUnits("14", 18); // 14 ADV (70% of 20)
      
      const initialSupply30 = await token.totalSupply();
      await token.transfer(user1.address, transferAmount);
      const finalSupply30 = await token.totalSupply();
      
      expect(finalSupply30).to.equal(initialSupply30 - burnAmount30);
      console.log("✅ 30%销毁比例计算正确");
      
      // 重置余额进行下一个测试
      await token.connect(user1).transfer(owner.address, await token.balanceOf(user1.address));
      
      // 测试70%销毁比例
      await token.setBurnPercentage(7000); // 70%
      const burnAmount70 = ethers.parseUnits("14", 18); // 14 ADV (70% of 20)
      const receiverAmount70 = ethers.parseUnits("6", 18); // 6 ADV (30% of 20)
      
      const initialSupply70 = await token.totalSupply();
      await token.transfer(user1.address, transferAmount);
      const finalSupply70 = await token.totalSupply();
      
      expect(finalSupply70).to.equal(initialSupply70 - burnAmount70);
      console.log("✅ 70%销毁比例计算正确");
    });

    it("应该正确处理销毁功能关闭时的行为", async function () {
      console.log("测试：销毁功能关闭时的行为");
      
      // 关闭销毁功能
      await token.setBurnEnabled(false);
      
      const transferAmount = ethers.parseUnits("1000", 18);
      const expectedTax = ethers.parseUnits("20", 18); // 20 ADV (2%)
      const expectedNetAmount = ethers.parseUnits("980", 18); // 980 ADV
      
      // 记录转账前状态
      const ownerInitialBalance = await token.balanceOf(owner.address);
      const user1InitialBalance = await token.balanceOf(user1.address);
      const taxReceiverInitialBalance = await token.balanceOf(user3.address);
      const initialTotalSupply = await token.totalSupply();
      
      // 执行转账
      await token.transfer(user1.address, transferAmount);
      
      // 记录转账后状态
      const ownerFinalBalance = await token.balanceOf(owner.address);
      const user1FinalBalance = await token.balanceOf(user1.address);
      const taxReceiverFinalBalance = await token.balanceOf(user3.address);
      const finalTotalSupply = await token.totalSupply();
      
      // 验证余额变化
      expect(ownerFinalBalance).to.equal(ownerInitialBalance - transferAmount);
      expect(user1FinalBalance).to.equal(user1InitialBalance + expectedNetAmount);
      expect(taxReceiverFinalBalance).to.equal(taxReceiverInitialBalance + expectedTax); // 全部手续费给接收者
      expect(finalTotalSupply).to.equal(initialTotalSupply); // 总供应量不变
      
      console.log("✅ 销毁功能关闭时正确不销毁代币");
    });

    it("应该正确处理授权转账的销毁功能", async function () {
      console.log("测试：授权转账的销毁功能");
      
      const transferAmount = ethers.parseUnits("500", 18); // 500 ADV
      const expectedTax = ethers.parseUnits("10", 18); // 10 ADV (2%)
      const expectedBurnAmount = ethers.parseUnits("5", 18); // 5 ADV (50% of tax)
      const expectedReceiverAmount = ethers.parseUnits("5", 18); // 5 ADV (50% of tax)
      const expectedNetAmount = ethers.parseUnits("490", 18); // 490 ADV
      
      // 先给user1足够的代币（包括手续费）
      const totalAmount = transferAmount + expectedTax; // 500 + 10 = 510 ADV
      await token.transfer(user1.address, totalAmount);
      
      // user1授权给user2（授权总金额，包括手续费）
      await token.connect(user1).approve(user2.address, totalAmount);
      
      // 记录转账前状态
      const user1InitialBalance = await token.balanceOf(user1.address);
      const user2InitialBalance = await token.balanceOf(user2.address);
      const taxReceiverInitialBalance = await token.balanceOf(user3.address);
      const initialTotalSupply = await token.totalSupply();
      
      console.log("授权转账前状态:");
      console.log(`- user1余额: ${ethers.formatUnits(user1InitialBalance, 18)} ADV`);
      console.log(`- user2余额: ${ethers.formatUnits(user2InitialBalance, 18)} ADV`);
      console.log(`- 手续费接收者余额: ${ethers.formatUnits(taxReceiverInitialBalance, 18)} ADV`);
      console.log(`- 总供应量: ${ethers.formatUnits(initialTotalSupply, 18)} ADV`);
      
      // user2使用授权转账
      await token.connect(user2).transferFrom(user1.address, user2.address, transferAmount);
      
      // 记录转账后状态
      const user1FinalBalance = await token.balanceOf(user1.address);
      const user2FinalBalance = await token.balanceOf(user2.address);
      const taxReceiverFinalBalance = await token.balanceOf(user3.address);
      const finalTotalSupply = await token.totalSupply();
      
      console.log("授权转账后状态:");
      console.log(`- user1余额: ${ethers.formatUnits(user1FinalBalance, 18)} ADV`);
      console.log(`- user2余额: ${ethers.formatUnits(user2FinalBalance, 18)} ADV`);
      console.log(`- 手续费接收者余额: ${ethers.formatUnits(taxReceiverFinalBalance, 18)} ADV`);
      console.log(`- 总供应量: ${ethers.formatUnits(finalTotalSupply, 18)} ADV`);
      
      // 验证余额变化
      expect(user1FinalBalance).to.equal(user1InitialBalance - transferAmount);
      expect(user2FinalBalance).to.equal(user2InitialBalance + expectedNetAmount);
      expect(taxReceiverFinalBalance).to.equal(taxReceiverInitialBalance + expectedReceiverAmount);
      expect(finalTotalSupply).to.equal(initialTotalSupply - expectedBurnAmount);
      
      console.log("✅ 授权转账销毁功能正确");
    });
  });

  describe("📢 销毁事件测试", function () {
    it("应该触发销毁比例更新事件", async function () {
      console.log("测试：销毁比例更新应该触发事件");
      
      const newBurnPercentage = 3000;
      
      // 监听事件
      const tx = await token.setBurnPercentage(newBurnPercentage);
      const receipt = await tx.wait();
      
      // 查找事件
      const event = receipt.logs.find(log => {
        try {
          const decoded = token.interface.parseLog(log);
          return decoded.name === "BurnPercentageUpdated";
        } catch (e) {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      
      const decodedEvent = token.interface.parseLog(event);
      expect(decodedEvent.args.newBurnPercentage).to.equal(newBurnPercentage);
      
      console.log("✅ 销毁比例更新事件触发成功");
    });

    it("应该触发销毁开关事件", async function () {
      console.log("测试：销毁开关应该触发事件");
      
      // 监听事件
      const tx = await token.setBurnEnabled(false);
      const receipt = await tx.wait();
      
      // 查找事件
      const event = receipt.logs.find(log => {
        try {
          const decoded = token.interface.parseLog(log);
          return decoded.name === "BurnEnabledUpdated";
        } catch (e) {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      
      const decodedEvent = token.interface.parseLog(event);
      expect(decodedEvent.args.burnEnabled).to.be.false;
      
      console.log("✅ 销毁开关事件触发成功");
    });

    it("应该触发代币销毁事件", async function () {
      console.log("测试：代币销毁应该触发事件");
      
      // 确保手续费和销毁功能开启
      await token.setTaxEnabled(true);
      await token.setBurnEnabled(true);
      
      const transferAmount = ethers.parseUnits("1000", 18);
      const expectedBurnAmount = ethers.parseUnits("10", 18); // 10 ADV (50% of 2% tax)
      
      // 监听事件
      const tx = await token.transfer(user1.address, transferAmount);
      const receipt = await tx.wait();
      
      // 查找ToekensBurned事件
      const event = receipt.logs.find(log => {
        try {
          const decoded = token.interface.parseLog(log);
          return decoded.name === "ToekensBurned";
        } catch (e) {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      
      const decodedEvent = token.interface.parseLog(event);
      expect(decodedEvent.args.from).to.equal(owner.address);
      expect(decodedEvent.args.burnAmount).to.equal(expectedBurnAmount);
      
      console.log("✅ 代币销毁事件触发成功");
    });

    it("应该触发手续费分配事件", async function () {
      console.log("测试：手续费分配应该触发事件");
      
      // 确保手续费和销毁功能开启
      await token.setTaxEnabled(true);
      await token.setBurnEnabled(true);
      
      const transferAmount = ethers.parseUnits("1000", 18);
      const totalTaxAmount = ethers.parseUnits("20", 18); // 20 ADV (2%)
      const expectedReceiverAmount = ethers.parseUnits("10", 18); // 10 ADV (50% of tax)
      
      // 监听事件
      const tx = await token.transfer(user1.address, transferAmount);
      const receipt = await tx.wait();
      
      // 查找TaxDistrubuted事件
      const event = receipt.logs.find(log => {
        try {
          const decoded = token.interface.parseLog(log);
          return decoded.name === "TaxDistrubuted";
        } catch (e) {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      
      const decodedEvent = token.interface.parseLog(event);
      expect(decodedEvent.args.from).to.equal(owner.address);
      expect(decodedEvent.args.taxAmount).to.equal(totalTaxAmount);
      expect(decodedEvent.args.receiverAmount).to.equal(expectedReceiverAmount);
      
      console.log("✅ 手续费分配事件触发成功");
    });
  });

  describe("🔍 销毁边界测试", function () {
    it("应该正确处理100%销毁的情况", async function () {
      console.log("测试：100%销毁的情况");
      
      // 设置100%销毁比例
      await token.setBurnPercentage(10000); // 100%
      
      const transferAmount = ethers.parseUnits("1000", 18);
      const expectedTax = ethers.parseUnits("20", 18); // 20 ADV (2%)
      const expectedBurnAmount = ethers.parseUnits("20", 18); // 20 ADV (100% of tax)
      const expectedReceiverAmount = ethers.parseUnits("0", 18); // 0 ADV (0% of tax)
      const expectedNetAmount = ethers.parseUnits("980", 18); // 980 ADV
      
      const initialSupply = await token.totalSupply();
      const taxReceiverInitialBalance = await token.balanceOf(user3.address);
      
      await token.transfer(user1.address, transferAmount);
      
      const finalSupply = await token.totalSupply();
      const taxReceiverFinalBalance = await token.balanceOf(user3.address);
      const user1Balance = await token.balanceOf(user1.address);
      
      expect(finalSupply).to.equal(initialSupply - expectedBurnAmount);
      expect(taxReceiverFinalBalance).to.equal(taxReceiverInitialBalance + expectedReceiverAmount);
      expect(user1Balance).to.equal(expectedNetAmount);
      
      console.log("✅ 100%销毁比例计算正确");
    });

    it("应该正确处理0%销毁的情况", async function () {
      console.log("测试：0%销毁的情况");
      
      // 设置0%销毁比例
      await token.setBurnPercentage(0); // 0%
      
      const transferAmount = ethers.parseUnits("1000", 18);
      const expectedTax = ethers.parseUnits("20", 18); // 20 ADV (2%)
      const expectedBurnAmount = ethers.parseUnits("0", 18); // 0 ADV (0% of tax)
      const expectedReceiverAmount = ethers.parseUnits("20", 18); // 20 ADV (100% of tax)
      const expectedNetAmount = ethers.parseUnits("980", 18); // 980 ADV
      
      const initialSupply = await token.totalSupply();
      const taxReceiverInitialBalance = await token.balanceOf(user3.address);
      
      await token.transfer(user1.address, transferAmount);
      
      const finalSupply = await token.totalSupply();
      const taxReceiverFinalBalance = await token.balanceOf(user3.address);
      const user1Balance = await token.balanceOf(user1.address);
      
      expect(finalSupply).to.equal(initialSupply - expectedBurnAmount);
      expect(taxReceiverFinalBalance).to.equal(taxReceiverInitialBalance + expectedReceiverAmount);
      expect(user1Balance).to.equal(expectedNetAmount);
      
      console.log("✅ 0%销毁比例计算正确");
    });

    it("应该正确处理极小转账金额的销毁", async function () {
      console.log("测试：极小转账金额的销毁");
      
      const transferAmount = ethers.parseUnits("1", 18); // 1 ADV
      const expectedTax = ethers.parseUnits("0.02", 18); // 0.02 ADV (2%)
      const expectedBurnAmount = ethers.parseUnits("0.01", 18); // 0.01 ADV (50% of tax)
      const expectedReceiverAmount = ethers.parseUnits("0.01", 18); // 0.01 ADV (50% of tax)
      const expectedNetAmount = ethers.parseUnits("0.98", 18); // 0.98 ADV
      
      const initialSupply = await token.totalSupply();
      const taxReceiverInitialBalance = await token.balanceOf(user3.address);
      
      await token.transfer(user1.address, transferAmount);
      
      const finalSupply = await token.totalSupply();
      const taxReceiverFinalBalance = await token.balanceOf(user3.address);
      const user1Balance = await token.balanceOf(user1.address);
      
      expect(finalSupply).to.equal(initialSupply - expectedBurnAmount);
      expect(taxReceiverFinalBalance).to.equal(taxReceiverInitialBalance + expectedReceiverAmount);
      expect(user1Balance).to.equal(expectedNetAmount);
      
      console.log("✅ 极小转账金额销毁计算正确");
    });
  });

  describe("🔧 工具函数测试", function () {
    it("应该正确计算手续费分配", async function () {
      console.log("测试：手续费分配计算函数");
      
      const taxAmount = ethers.parseUnits("100", 18);
      
      // 测试50%销毁比例
      const [burnAmount50, receiverAmount50] = await token.calculateTaxDistribution(taxAmount);
      expect(burnAmount50).to.equal(ethers.parseUnits("50", 18));
      expect(receiverAmount50).to.equal(ethers.parseUnits("50", 18));
      
      // 测试30%销毁比例
      await token.setBurnPercentage(3000);
      const [burnAmount30, receiverAmount30] = await token.calculateTaxDistribution(taxAmount);
      expect(burnAmount30).to.equal(ethers.parseUnits("30", 18));
      expect(receiverAmount30).to.equal(ethers.parseUnits("70", 18));
      
      // 测试销毁功能关闭
      await token.setBurnEnabled(false);
      const [burnAmountOff, receiverAmountOff] = await token.calculateTaxDistribution(taxAmount);
      expect(burnAmountOff).to.equal(0);
      expect(receiverAmountOff).to.equal(taxAmount);
      
      console.log("✅ 手续费分配计算函数正确");
    });

    it("应该正确获取代币经济设置", async function () {
      console.log("测试：代币经济设置获取函数");
      
      const [taxRate, burnPercentage, taxReceiver, taxEnabled, burnEnabled] = await token.getTokenEconomics();
      
      expect(taxRate).to.equal(200); // 2%
      expect(burnPercentage).to.equal(5000); // 50%
      expect(taxReceiver).to.equal(user3.address);
      expect(taxEnabled).to.be.true;
      expect(burnEnabled).to.be.true;
      
      console.log("✅ 代币经济设置获取函数正确");
    });

    it("应该正确计算详细转账结果", async function () {
      console.log("测试：详细转账结果计算函数");
      
      const amount = ethers.parseUnits("1000", 18);
      const [originalAmount, taxAmount, netAmount, burnAmount, receiverAmount] = await token.getDetailedTransferCalculation(amount);
      
      expect(originalAmount).to.equal(amount);
      expect(taxAmount).to.equal(ethers.parseUnits("20", 18)); // 2%
      expect(netAmount).to.equal(ethers.parseUnits("980", 18)); // 98%
      expect(burnAmount).to.equal(ethers.parseUnits("10", 18)); // 50% of tax
      expect(receiverAmount).to.equal(ethers.parseUnits("10", 18)); // 50% of tax
      
      console.log("✅ 详细转账结果计算函数正确");
    });
  });

  describe("🔄 销毁状态切换测试", function () {
    it("应该正确处理销毁功能的动态切换", async function () {
      console.log("测试：销毁功能动态切换");
      
      const transferAmount = ethers.parseUnits("1000", 18);
      
      // 初始状态：销毁功能开启，50%
      expect(await token.burnEnabled()).to.be.true;
      expect(await token.burnPercentage()).to.equal(5000);
      
      // 第一次转账（50%销毁）
      const initialSupply1 = await token.totalSupply();
      await token.transfer(user1.address, transferAmount);
      const finalSupply1 = await token.totalSupply();
      
      expect(finalSupply1).to.equal(initialSupply1 - ethers.parseUnits("10", 18)); // 销毁10个代币
      console.log("✅ 50%销毁正确");
      
      // 重置余额
      await token.connect(user1).transfer(owner.address, await token.balanceOf(user1.address));
      
      // 关闭销毁功能
      await token.setBurnEnabled(false);
      expect(await token.burnEnabled()).to.be.false;
      
      // 第二次转账（不销毁）
      const initialSupply2 = await token.totalSupply();
      await token.transfer(user1.address, transferAmount);
      const finalSupply2 = await token.totalSupply();
      
      expect(finalSupply2).to.equal(initialSupply2); // 总供应量不变
      console.log("✅ 销毁功能关闭时正确不销毁代币");
      
      // 重新开启销毁功能，设置30%
      await token.setBurnEnabled(true);
      await token.setBurnPercentage(3000);
      
      expect(await token.burnEnabled()).to.be.true;
      expect(await token.burnPercentage()).to.equal(3000);
      
      // 第三次转账（30%销毁）
      const initialSupply3 = await token.totalSupply();
      await token.transfer(user1.address, transferAmount);
      const finalSupply3 = await token.totalSupply();
      
      expect(finalSupply3).to.equal(initialSupply3 - ethers.parseUnits("6", 18)); // 销毁6个代币
      console.log("✅ 30%销毁正确");
      console.log("✅ 销毁功能动态切换测试成功");
    });
  });
});
