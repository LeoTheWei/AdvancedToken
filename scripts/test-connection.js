const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 测试网络连接...");
  
  try {
    // 获取网络信息
    const network = await ethers.provider.getNetwork();
    console.log("🌐 网络名称:", network.name);
    console.log("🔗 链 ID:", network.chainId.toString());
    
    // 获取最新区块
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log("📦 最新区块号:", blockNumber);
    
    // 获取 gas 价格
    const feeData = await ethers.provider.getFeeData();
    console.log("⛽ Gas 价格:", ethers.formatUnits(feeData.gasPrice, "gwei"), "Gwei");
    
    // 获取账户信息
    const [deployer] = await ethers.getSigners();
    console.log("👤 部署者地址:", deployer.address);
    
    // 获取账户余额
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 账户余额:", ethers.formatEther(balance), "ETH");
    
    if (balance < ethers.parseEther("0.01")) {
      console.log("⚠️  警告: 账户余额可能不足以支付 gas 费用");
      console.log("💡 请访问以下 faucet 获取 Sepolia ETH:");
      console.log("   - https://sepoliafaucet.com/");
      console.log("   - https://faucet.sepolia.dev/");
      console.log("   - https://sepolia-faucet.pk910.de/");
    } else {
      console.log("✅ 账户余额充足，可以部署合约");
    }
    
    console.log("\n🎉 网络连接测试成功！");
    
  } catch (error) {
    console.error("❌ 网络连接测试失败:", error.message);
    
    if (error.message.includes("HeadersTimeoutError")) {
      console.log("\n💡 解决方案:");
      console.log("1. 检查网络连接");
      console.log("2. 尝试使用不同的 RPC 提供商");
      console.log("3. 检查防火墙设置");
      console.log("4. 稍后重试");
    }
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 测试失败:", error);
    process.exit(1);
  });
