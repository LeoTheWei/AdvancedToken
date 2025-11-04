const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 开始部署 AdvancedToken 合约...");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("📋 部署者地址:", deployer.address);
  
  // 检查账户余额
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 账户余额:", ethers.formatEther(balance), "ETH");

  // 检查是否有足够的 ETH 支付 gas 费用
  if (balance < ethers.parseEther("0.01")) {
    console.log("⚠️  警告: 账户余额可能不足以支付 gas 费用");
    console.log("💡 请确保账户至少有 0.01 ETH");
  }

  // 部署合约
  console.log("📦 正在部署合约...");
  const AdvancedToken = await ethers.getContractFactory("AdvancedToken");
  
  // 初始供应量：100万 ADV
  const initialSupply = ethers.parseUnits("1000000", 18);
  
  const token = await AdvancedToken.deploy(initialSupply);
  await token.waitForDeployment();

  const tokenAddress = await token.getAddress();
  console.log("✅ 合约部署成功!");
  console.log("📍 合约地址:", tokenAddress);
  console.log("🔗 在 Sepolia 浏览器中查看:", `https://sepolia.etherscan.io/address/${tokenAddress}`);

  // 验证合约信息
  console.log("\n📊 合约信息:");
  const name = await token.name();
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  const totalSupply = await token.totalSupply();
  
  console.log("📛 代币名称:", name);
  console.log("🔤 代币符号:", symbol);
  console.log("🔢 小数位数:", decimals.toString());
  console.log("📈 总供应量:", ethers.formatUnits(totalSupply, 18), symbol);

  // 验证治理参数
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

  // 验证手续费参数
  console.log("\n💸 手续费参数:");
  const taxRate = await token.taxRate();
  const taxEnabled = await token.taxEnabled();
  const taxReceiver = await token.taxReceiver();
  
  console.log("📊 手续费率:", taxRate.toString(), "基点 (", (Number(taxRate) / 100).toFixed(2), "%)");
  console.log("🔛 手续费开关:", taxEnabled);
  console.log("🏦 手续费接收者:", taxReceiver);

  // 验证销毁参数
  console.log("\n🔥 销毁参数:");
  const burnPercentage = await token.burnPercentage();
  const burnEnabled = await token.burnEnabled();
  
  console.log("📊 销毁比例:", burnPercentage.toString(), "基点 (", (Number(burnPercentage) / 100).toFixed(2), "%)");
  console.log("🔛 销毁开关:", burnEnabled);

  // 保存部署信息
  const deploymentInfo = {
    network: "sepolia",
    contractAddress: tokenAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    contractInfo: {
      name,
      symbol,
      decimals: decimals.toString(),
      totalSupply: totalSupply.toString(),
      governance: {
        votingDelay: votingDelay.toString(),
        votingPeriod: votingPeriod.toString(),
        proposalThreshold: proposalThreshold.toString(),
        quorumVotes: quorumVotes.toString(),
        timelockDelay: timelockDelay.toString()
      },
      tax: {
        rate: taxRate.toString(),
        enabled: taxEnabled,
        receiver: taxReceiver
      },
      burn: {
        percentage: burnPercentage.toString(),
        enabled: burnEnabled
      }
    }
  };

  // 将部署信息保存到文件
  const fs = require('fs');
  const path = require('path');
  
  const deploymentDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentDir, `sepolia-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n💾 部署信息已保存到:", deploymentFile);
  console.log("\n🎉 部署完成！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  });
