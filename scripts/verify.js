const { run } = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 开始验证合约...");

  // 从部署信息中获取合约地址
  const fs = require('fs');
  const path = require('path');
  
  const deploymentDir = path.join(__dirname, '..', 'deployments');
  const files = fs.readdirSync(deploymentDir).filter(file => file.endsWith('.json'));
  
  if (files.length === 0) {
    console.log("❌ 没有找到部署信息文件");
    return;
  }

  // 获取最新的部署文件
  const latestFile = files.sort().pop();
  const deploymentInfo = JSON.parse(fs.readFileSync(path.join(deploymentDir, latestFile), 'utf8'));
  
  const contractAddress = deploymentInfo.contractAddress;
  console.log("📍 合约地址:", contractAddress);
  
  // 构造函数参数：initialSupply = 1000000 * 10^18
  const initialSupply = ethers.parseUnits("1000000", 18);
  const constructorArguments = [initialSupply];
  
  console.log("🔧 构造函数参数:", constructorArguments[0].toString());

  try {
    // 验证合约
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArguments,
    });
    
    console.log("✅ 合约验证成功!");
    console.log("🔗 在 Etherscan 中查看:", `https://sepolia.etherscan.io/address/${contractAddress}`);
  } catch (error) {
    if (error.message.includes("Already Verified") || error.message.toLowerCase().includes("already verified")) {
      console.log("✅ 合约已经验证过了");
      console.log("🔗 查看合约: https://sepolia.etherscan.io/address/" + contractAddress);
    } else {
      console.error("❌ 验证失败:", error.message);
      console.log("\n💡 如果自动验证失败，可以尝试手动验证：");
      console.log("   1. 使用修复后的 flattened_fixed.sol 文件");
      console.log("   2. 编译器版本: v0.8.28");
      console.log("   3. 优化设置: Yes, Runs: 200");
      console.log("   4. 构造函数参数 (hex):", ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [initialSupply]));
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 验证失败:", error);
    process.exit(1);
  });
