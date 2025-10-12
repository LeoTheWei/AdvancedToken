# 🚀 AdvancedToken 项目开发计划

## 📘 项目简介
**项目名称**：AdvancedToken  
**项目周期**：约 3 周  
**目标**：构建一个具有白名单、手续费、销毁和治理功能的高级 ERC20 智能合约，部署到以太坊测试网（Sepolia），并完成单元测试。

**展示价值**：  
本项目能体现你具备：
- Solidity 合约结构与逻辑编写能力  
- OpenZeppelin 库使用经验  
- 合约安全控制（权限、modifier、require）  
- 基本治理逻辑（mapping + struct + event）  
- Hardhat 测试与部署流程  
非常适合放进简历作为“入门 Web3 项目展示”。

---

## 🧱 项目概览

| 模块 | 功能描述 | 技术点 |
|------|------------|----------|
| ERC20 基础 | 标准代币逻辑（转账、授权） | OpenZeppelin ERC20 |
| 权限控制 | 管理员修改费率、收款地址 | Ownable + modifier |
| 白名单机制 | 限制可交易用户 | mapping + require |
| 手续费系统 | 转账自动收取 2%，部分销毁 | 重写 `_transfer()` |
| 治理模块 | 用户发起提案、投票 | struct + mapping + event |
| 安全设计 | 防止越权、溢出 | require 检查 + 0.8 语法 |
| 测试部署 | Hardhat 测试 + Sepolia 部署 | Hardhat + Ethers.js |

---

## 🗓️ 第1周：环境准备 + ERC20 基础实现

### 🎯 目标
完成项目结构搭建，写出可运行的 ERC20 合约。

### 🧩 任务清单
| 任务 | 内容 |
|------|------|
| 1️⃣ | 安装并初始化 Hardhat 项目 |
| 2️⃣ | 安装 OpenZeppelin 库 |
| 3️⃣ | 创建 `AdvancedToken.sol` 文件 |
| 4️⃣ | 实现基础 ERC20（继承 + 构造函数） |
| 5️⃣ | 完成 Mint/Transfer/Balance 测试 |

### 📦 操作命令
```bash
mkdir AdvancedToken && cd AdvancedToken
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
npx hardhat compile

