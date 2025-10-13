// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// 导入销毁功能
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title AdvancedToken
 * @dev 高级代币合约，继承自 ERC20 标准，并添加销毁功能
 */

contract AdvancedToken is ERC20, ERC20Burnable {



    /**
    * @dev 构造函数，设置代币名称、符号和初始供应量
    * @param initialSupply 初始供应量
    * - msg.sender 部署者
    * - initialSupply 初始供应量
    * - 10 ** decimals() 转换为最小单位（1 ADV = 10^18 个最小单位）
    */
    constructor(uint256 initialSupply) ERC20("AdvancedToken", "ADV") {
        // 向部署者开始部署初始代币
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }



    /**
     * @dev 销毁代币
     * @param amount 销毁数量 
     * 
     * -- 任何用户都可以销毁自己的代币
     * -- 销毁代币后，代币总数据减少
     * -- 会触发Transfer事件 （转到零地址）
     */

    function burn(uint256 amount) public override {
        // 调用父类销毁函数
        _burn(_msgSender(), amount);
    }
    

    /**
     * @dev 销毁代币 - 允许销毁他人的代币
     * @param account 销毁账户
     * @param amount 销毁数量
     * 
     * -- 允许销毁他人的代币，去中心化交易所可以销毁用户的代币（如果用户授权）
     * -- 合约可以按规则自动销毁代币
     */
    function burnFrom(address account, uint256 amount) public override {
        // 1、检查授权额度
        _spendAllowance(account, _msgSender(), amount);
        // 2、调用父类销毁函数
        _burn(account, amount);
    }

}