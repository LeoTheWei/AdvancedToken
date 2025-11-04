const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 AdvancedToken 交互脚本");
  
  // 从部署信息中获取合约地址
  const fs = require('fs');
  const path = require('path');
  
  const deploymentDir = path.join(__dirname, '..', 'deployments');
  const files = fs.readdirSync(deploymentDir).filter(file => file.endsWith('.json'));
  
  if (files.length === 0) {
    console.log("❌ 没有找到部署信息文件，请先部署合约");
    return;
  }
  
  // 获取最新的部署文件
  const latestFile = files.sort().pop();
  const deploymentInfo = JSON.parse(fs.readFileSync(path.join(deploymentDir, latestFile), 'utf8'));
  
  const contractAddress = deploymentInfo.contractAddress;
  console.log("📍 合约地址:", contractAddress);
  
  // 连接到合约
  const AdvancedToken = await ethers.getContractFactory("AdvancedToken");
  const token = AdvancedToken.attach(contractAddress);
  
  // 获取账户信息
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("👤 部署者:", deployer.address);
  console.log("👤 用户1:", user1.address);
  console.log("👤 用户2:", user2.address);
  
  // 显示基本代币信息
  console.log("\n📊 代币信息:");
  const name = await token.name();
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  const totalSupply = await token.totalSupply();
  
  console.log("📛 名称:", name);
  console.log("🔤 符号:", symbol);
  console.log("🔢 小数:", decimals.toString());
  console.log("📈 总供应量:", ethers.formatUnits(totalSupply, 18), symbol);
  
  // 显示账户余额
  console.log("\n💰 账户余额:");
  const deployerBalance = await token.balanceOf(deployer.address);
  const user1Balance = await token.balanceOf(user1.address);
  const user2Balance = await token.balanceOf(user2.address);
  
  console.log("部署者余额:", ethers.formatUnits(deployerBalance, 18), symbol);
  console.log("用户1余额:", ethers.formatUnits(user1Balance, 18), symbol);
  console.log("用户2余额:", ethers.formatUnits(user2Balance, 18), symbol);
  
  // 显示治理参数
  console.log("\n🏛️ 治理参数:");
  const votingDelay = await token.votingDelay();
  const votingPeriod = await token.votingPeriod();
  const proposalThreshold = await token.proposalThreshold();
  const quorumVotes = await token.quorumVotes();
  const timelockDelay = await token.timelockDelay();
  
  console.log("⏰ 投票延迟:", votingDelay.toString(), "秒");
  console.log("⏱️ 投票期间:", votingPeriod.toString(), "秒");
  console.log("🎯 提案门槛:", ethers.formatUnits(proposalThreshold, 18), symbol);
  console.log("📊 法定票数:", ethers.formatUnits(quorumVotes, 18), symbol);
  console.log("🔒 时间锁延迟:", timelockDelay.toString(), "秒");
  
  // 显示手续费参数
  console.log("\n💸 手续费参数:");
  const taxRate = await token.taxRate();
  const taxEnabled = await token.taxEnabled();
  const taxReceiver = await token.taxReceiver();
  
  console.log("📊 手续费率:", taxRate.toString(), "基点");
  console.log("🔛 手续费开关:", taxEnabled);
  console.log("🏦 手续费接收者:", taxReceiver);
  
  // 显示销毁参数
  console.log("\n🔥 销毁参数:");
  const burnRate = await token.burnRate();
  const burnEnabled = await token.burnEnabled();
  
  console.log("📊 销毁比例:", burnRate.toString(), "基点");
  console.log("🔛 销毁开关:", burnEnabled);
  
  // 示例操作：转账
  console.log("\n🔄 执行示例操作:");
  
  if (deployerBalance > ethers.parseUnits("100", 18)) {
    console.log("📤 向用户1转账 100 ADV...");
    const tx = await token.transfer(user1.address, ethers.parseUnits("100", 18));
    await tx.wait();
    console.log("✅ 转账成功!");
    
    // 显示转账后的余额
    const newUser1Balance = await token.balanceOf(user1.address);
    console.log("用户1新余额:", ethers.formatUnits(newUser1Balance, 18), symbol);
  } else {
    console.log("⚠️ 部署者余额不足，跳过转账示例");
  }
  
  console.log("\n🎉 交互完成!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 交互失败:", error);
    process.exit(1);
  });
