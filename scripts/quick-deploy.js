const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 快速部署 AdvancedToken 合约...");
  
  try {
    // 获取网络信息
    const network = await ethers.provider.getNetwork();
    console.log("🌐 网络:", network.name, "链 ID:", network.chainId.toString());
    
    // 获取账户
    const [deployer] = await ethers.getSigners();
    console.log("👤 部署者:", deployer.address);
    
    // 获取余额
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 余额:", ethers.formatEther(balance), "ETH");
    
    // 部署合约
    console.log("📦 部署合约...");
    const AdvancedToken = await ethers.getContractFactory("AdvancedToken");
    const token = await AdvancedToken.deploy(ethers.parseUnits("1000000", 18));
    
    console.log("⏳ 等待部署...");
    await token.waitForDeployment();
    
    const address = await token.getAddress();
    console.log("✅ 部署成功!");
    console.log("📍 地址:", address);
    
    // 测试基本功能
    const name = await token.name();
    const symbol = await token.symbol();
    const totalSupply = await token.totalSupply();
    
    console.log("📛 名称:", name);
    console.log("🔤 符号:", symbol);
    console.log("📈 供应量:", ethers.formatUnits(totalSupply, 18), symbol);
    
    // 测试转账
    const [user1] = await ethers.getSigners();
    const tx = await token.transfer(user1.address, ethers.parseUnits("100", 18));
    await tx.wait();
    console.log("✅ 转账测试成功!");
    
    const userBalance = await token.balanceOf(user1.address);
    console.log("👤 用户余额:", ethers.formatUnits(userBalance, 18), symbol);
    
    console.log("\n🎉 部署和测试完成!");
    
  } catch (error) {
    console.error("❌ 错误:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 失败:", error);
    process.exit(1);
  });
