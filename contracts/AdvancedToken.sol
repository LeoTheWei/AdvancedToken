// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// 导入销毁功能
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
// 导入管理功能
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "hardhat/console.sol";

/**
 * @title AdvancedToken
 * @dev 高级代币合约，继承自 ERC20 标准，并添加销毁功能
 */

contract AdvancedToken is ERC20, ERC20Burnable, Ownable, Pausable {

    /**
    * @dev 构造函数，设置代币名称、符号和初始供应量
    * @param initialSupply 初始供应量
    * - msg.sender 部署者
    * - initialSupply 初始供应量
    * - 10 ** decimals() 转换为最小单位（1 ADV = 10^18 个最小单位）
    * - Ownable(msg.sender) 将所有权转移给部署者
    */
    constructor(uint256 initialSupply) ERC20("AdvancedToken", "ADV") Ownable(msg.sender) {
        // 向部署者开始部署初始代币
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    // 管理员铸造币的功能
    /**
     * 
     * @param amount 铸造数量
     * @param to 铸造地址
     */
    function mint(uint256 amount, address to) public onlyOwner {
        require(to != address(0), "AdvancedToken: cannot mint to zero address");
        console.log(unicode"铸造代币");
        console.log(unicode"铸造数量", amount);
        console.log(unicode"接受地址", to);
        console.log(unicode"铸造时间", block.timestamp);
        console.log(unicode"铸造区块", block.number);
        console.log(unicode"铸造交易", _msgSender());
        
        // 调用父类铸造函数
        _mint(to, amount);
    }

    // 暂停/恢复功能
    /**
     * 
     * @dev 暂停/恢复功能 只有部署者可以暂停/恢复
     *  停止所有的转账操作
     */
     function pause() public onlyOwner {
        console.log(unicode"合约已暂停");
        _pause();
    }
    /**
     * 
     * @dev 恢复代币
     *  恢复所有的转账操作
     */
    function unpause() public onlyOwner {
        console.log(unicode"合约已恢复");
        _unpause();
    }


    // 重写转账的函数和授权的函数，添加暂停检查
    /**
     * @dev 重写转账的函数和授权的函数，添加暂停检查
     */
    function transfer(address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        console.log(unicode"转账代币");
        return super.transfer(to, amount);
    }

    /**
     * @dev 重写授权的函数，添加暂停检查
     */
    function approve(address spender, uint256 amount) public virtual override whenNotPaused returns (bool) {
        console.log(unicode"授权代币");
        return super.approve(spender, amount);
    }



    /**
     * @dev 销毁代币
     * @param amount 销毁数量 
     * 
     * -- 任何用户都可以销毁自己的代币
     * -- 销毁代币后，代币总数据减少
     * -- 会触发Transfer事件 （转到零地址）
     */

    function burn(uint256 amount) public virtual override whenNotPaused {
        // 调用父类销毁函数
        super.burn(amount);
    }
    

    /**
     * @dev 销毁代币 - 允许销毁他人的代币
     * @param account 销毁账户
     * @param amount 销毁数量
     * 
     * -- 允许销毁他人的代币，去中心化交易所可以销毁用户的代币（如果用户授权）
     * -- 合约可以按规则自动销毁代币
     */
     function burnFrom(address account, uint256 amount) public override whenNotPaused {
        super.burnFrom(account, amount);
    }



    // 视图函数 
    /**
     * @dev 获取合约的所有者
     */
    function getOwner() public view returns (address) {
        return owner();
    }

    /**
     * @dev 获取合约的暂停状态
     */
    function getPaused() public view returns (bool) {
        return paused();
    }

}