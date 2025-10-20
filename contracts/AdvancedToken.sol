// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Import burn functionality
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
// Import management functionality
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "hardhat/console.sol";

/**
 * @title AdvancedToken
 * @dev Advanced token contract, inheriting from ERC20 standard and adding burn functionality
 */

contract AdvancedToken is ERC20, ERC20Burnable, Ownable, Pausable {

    // ============= Whitelist State Variables =============
    // Whitelist mapping to record which addresses can trade
    mapping(address => bool) public whiteList;
    // Whitelist switch: whether to enable whitelist
    bool public whistelistEnabled;


    // ===============TaxRate State Variables ==============
    // taxRate 100 = 1%
    uint256 public taxRate = 200;
    // taxRecipient tax rate 10000 = 100%
    uint256  public constant TAX_BASE = 10000;
    // taxRate receive address
    address public taxReceiver;
    // taxRate switch: whether to enable taxRate
    bool public taxEnabled;

    // ================burn state variables ================
    // default burn percentage is 50%
    uint256 public burnPercentage = 5000;
    // burn switch: whether to enable burn
    bool public burnEnabled;



    // ============== Events ==============
    event WhitelistUpdated(address indexed account, bool status);
    event WhitelistEnableUpdated(bool enabled);
    event WhitelistBatchUpdated(address[] accounts, bool status);

    // TaxRate Events
    event TaxRateUpdated(uint256 newTaxRate);
    event TaxReceiverUpdated(address newTaxReceiver);
    event TaxEnabledUpdated(bool taxEnabled);
    event TaxCharged(address indexed from, uint256 amount, uint256 taxAmount);

    // Burn Events
    event BurnPercentageUpdated(uint256 newBurnPercentage);
    event BurnEnabledUpdated(bool burnEnabled);
    event ToekensBurned(address indexed from, uint256 amount, uint256 burnAmount);
    event TaxDistrubuted(address indexed from, uint256 amount, uint256 taxAmount);




    /**
    * @dev Constructor, sets token name, symbol and initial supply
    * @param initialSupply Initial supply
    * - msg.sender Deployer
    * - initialSupply Initial supply
    * - 10 ** decimals() Convert to smallest unit (1 ADV = 10^18 smallest units)
    * - Ownable(msg.sender) Transfer ownership to deployer
    */
    constructor(uint256 initialSupply) ERC20("AdvancedToken", "ADV") Ownable(msg.sender) Pausable() {
        // Mint initial tokens to deployer
        _mint(msg.sender, initialSupply * 10 ** decimals());

        // Add deployer to whitelist by default
        whiteList[msg.sender] = true;
        // Enable whitelist by default
        whistelistEnabled = true;

        // init  taxTate
        taxReceiver = msg.sender;
        taxEnabled = true;

        // init burn
        burnEnabled = true;
    }

    // ============== Burn Management Functions ==============
    /**
     * 
     * @dev set burn percentage
     * @param newBurnPercentage new burn percentage
     */
    function setBurnPercentage(uint256 newBurnPercentage) public onlyOwner {
        require(newBurnPercentage <= TAX_BASE, "AdvancedToken: burn percentage too high");
        require(newBurnPercentage != burnPercentage, "AdvancedToken: burn percentage already set");


        burnPercentage = newBurnPercentage;
        emit BurnPercentageUpdated(newBurnPercentage);
        console.log("Burn percentage updated:", newBurnPercentage);
    }

    /**
     * 
     * @dev 启用/禁用销毁功能
     * @param enable enable burn
     */
    function setBurnEnabled(bool enable) public onlyOwner {
        burnEnabled = enable;
        emit BurnEnabledUpdated(enable);
        console.log("Burn switch:", enable);
    }

    // ============== TaxRate Management Functions ==============
    /**
     * 
     * @dev 设置手续费
     * @param newTaxRate new tax rate bas 200 = 2&
     * - 使用基点避免小数计算 1% = 100
     * - set taxRate must be less than TAX_BASE
     */
    function setTaxRate(uint256 newTaxRate) public onlyOwner {
        require(newTaxRate <= 500, "AdvancedToken: tax rate too high");
        require(newTaxRate != taxRate, "AdvancedToken: tax rate already set");

        taxRate = newTaxRate;
        emit TaxRateUpdated(newTaxRate);
        console.log("TaxRate updated:", newTaxRate);
    }

    /**
     * 
     * @dev 设置手续费开关
     * @param enable 是否启用手续费
     * - user since
     * - 市场推广期间：禁用手续费吸引用户
     * - 正常运营期间：启用手续费增加收入
     */
    function setTaxEnabled(bool enable) public onlyOwner {
        taxEnabled = enable;
        emit TaxEnabledUpdated(enable);
        console.log("TaxEnabled switch:", enable);
    }

    /**
     * 
     * @dev Set tax receiver address
     * @param newReceiver New tax receiver address
     */
    function setTaxReceiver(address newReceiver) public onlyOwner {
        require(newReceiver != address(0), "AdvancedToken: zero address");
        taxReceiver = newReceiver;
        emit TaxReceiverUpdated(newReceiver);
        console.log("Tax receiver updated");
    }


    // ============== Whitelist Functions =============
    /**
     * 
     * @dev Admin sets whitelist
     * @param account Address to modify
     * @param status Status true means add to whitelist, false means remove from whitelist
     */
    function setWhitelist(address account, bool status) public onlyOwner {
        require(account != address(0), "AdvancedToken: zero address" );
        whiteList[account] = status;
        emit WhitelistUpdated(account, status);
        console.log("Whitelist updated:", status);
    }

    /**
     * 
     * @dev Admin batch sets whitelist
     * @param accounts Addresses to modify
     * @param status Status true means add to whitelist, false means remove from whitelist
     */
    function batchSetWhitelist(address[] memory accounts, bool status) public onlyOwner {
        require(accounts.length > 0, "AdvancedToken: accounts is empty");
        
        for (uint256 i = 0; i < accounts.length; i++) {
            require(accounts[i] != address(0), "AdvancedToken: zero address");
            whiteList[accounts[i]] = status;
        }

        emit WhitelistBatchUpdated(accounts, status);
        console.log("Batch whitelist update:", accounts.length, status);
    }

    /**
     * 
     * @dev Admin enables/disables whitelist restriction
     * @param enabled Status true means enable whitelist, false means disable whitelist
     */
    function setWhitelistEnabled(bool enabled) public onlyOwner {
        whistelistEnabled = enabled;
        emit WhitelistEnableUpdated(enabled);
        console.log("Whitelist switch:", enabled);
    }

    /**
     * 
     * @dev Check if address is in whitelist
     * @param account Address to check
     * @return Whether in whitelist
     */
    function isWhitelisted(address account) public view returns (bool) {
        return whiteList[account];
    }

    // Admin minting functionality
    /**
     * 
     * @param amount Amount to mint
     * @param to Address to mint to
     */
    function mint(uint256 amount, address to) public onlyOwner {
        require(to != address(0), "AdvancedToken: cannot mint to zero address");
        console.log("Minting tokens");
        console.log("Mint amount", amount);
        console.log("Recipient address updated");
        console.log("Mint timestamp", block.timestamp);
        console.log("Mint block", block.number);
        console.log("Mint transaction sender");
        
        // Call parent class minting function
        _mint(to, amount);
    }

    // Pause/Resume functionality
    /**
     * 
     * @dev Pause/Resume functionality, only deployer can pause/resume
     *  Stop all transfer operations
     */
     function pause() public onlyOwner {
        console.log("Contract paused");
        _pause();
    }
    /**
     * 
     * @dev Resume token
     *  Resume all transfer operations
     */
    function unpause() public onlyOwner {
        console.log("Contract unpaused");
        _unpause();
    }


    // ============== Override transfer and approval functions, add pause check and whitelist check =============
    /**
     * @dev Override transfer and approval functions, add pause check and tax and burn check
     */
    function transfer(address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        console.log("Transferring tokens");
        _checkWhitelist(msg.sender, to);
        (uint256 newAmount, uint256 taxAmount) = _calculateTax(amount);

        address from = _msgSender();

        if (taxAmount > 0) {
            // deal tax amount(distribute tax to taxReceiver and burn tax)
            _processTax(from, taxAmount);
        }

        // start actural transfer
        bool success = super.transfer(to, newAmount);
        if (taxAmount > 0) {
           emit TaxCharged(from, amount, taxAmount);
        }
        return success;
    }

    /**
     * @dev 重写授权转账函数，添加手续费计算, burn check
     */
    function transferFrom(address from, address to, uint256 amount) 
        public 
        virtual 
        override 
        whenNotPaused
        returns (bool) 
    {
        _checkWhitelist(from, to);
        
        // 计算手续费和净转账金额
        (uint256 netAmount, uint256 taxAmount) = _calculateTax(amount);
        
        if (taxAmount > 0) {
            // 收取手续费（从授权额度中扣除）
            _spendAllowance(from, _msgSender(), taxAmount);
            _processTax(from, taxAmount);
        }
        
        // 执行实际转账（净金额）
        _spendAllowance(from, _msgSender(), netAmount);
        _transfer(from, to, netAmount);
        
        if (taxAmount > 0) {
            emit TaxCharged(from, amount, taxAmount);
        }
        
        return true;
    }

    /**
     * @dev Override approval function, add pause check and whitelist check
     */
    function approve(address spender, uint256 amount) public virtual override whenNotPaused returns (bool) {
        console.log("Approving tokens");
        _checkWhitelist(msg.sender, spender);
        return super.approve(spender, amount);
    }


    // =========================== Internal Functions ==========================


    /**
     * 
     * @dev 内部函数：deal tax amount(distribute tax to taxReceiver and burn tax)
     * @param from resource address
     * @param taxAmount total tax amount
     */
    function _processTax(address from, uint256 taxAmount) internal {
        // calculate tax amount for taxReceiver
        (uint256 burnAmount, uint256 receiverAmount) = _calculateDistribution(taxAmount);

        if (burnAmount > 0) {
            // deal burn amount
            _burn(from, burnAmount);
            emit ToekensBurned(from, taxAmount, burnAmount);
            console.log("Tokens burned:", burnAmount);
        }

        if (receiverAmount > 0) {
            // transfer tax amount to taxReceiver
            _transfer(from, taxReceiver, receiverAmount);
            console.log("Tax distributed to taxReceiver:", receiverAmount);
        }
    }

     /**
     * @dev 内部函数：计算手续费分配
     * @param taxAmount 总手续费金额
     * @return burnAmount 销毁金额
     * @return receiverAmount 接收方金额
     */
    function _calculateDistribution(uint256 taxAmount) 
        internal 
        view 
        returns (uint256 burnAmount, uint256 receiverAmount) 
    {
        // 如果销毁功能未启用，所有手续费给接收方
        if (!burnEnabled) {
            return (0, taxAmount);
        }
        
        // 计算销毁金额
        burnAmount = (taxAmount * burnPercentage) / TAX_BASE;
        
        // 剩余金额给接收方
        receiverAmount = taxAmount - burnAmount;

        console.log("Calculate distribution:", burnAmount, receiverAmount);

        return (burnAmount, receiverAmount);
    }

    /**
     * 
     * @dev innternal function: calculate tax
     * @param amount Amount to calculate tax
     * @return newAmount New amount after tax
     * @return taxAmount Tax amount
     */
    function _calculateTax(uint256 amount) internal view returns (uint256, uint256) {
        if (!taxEnabled) {
            return (amount, 0);
        }
        uint256 taxAmount = amount * taxRate / TAX_BASE;
        // calculate new amount
        uint256 newAmount = amount - taxAmount;
        console.log("Calculate tax amount:", taxAmount);
        return (newAmount, taxAmount);
    }
    /**
     * 
     * @dev Internal function: Check whitelist
     * @param from Sender
     * @param to Receiver
     */
    function _checkWhitelist(address from, address to) internal view {
        // If whitelist switch is off, don't check whitelist
        if (!whistelistEnabled) {
            return;
        }
        // Check if sender is in whitelist
        require(whiteList[from], "AdvancedToken: sender not in whitelist");
        // Check if receiver is in whitelist
        require(whiteList[to], "AdvancedToken: receiver not in whitelist");
    }


    /**
     * @dev Burn tokens
     * @param amount Amount to burn
     * 
     * -- Any user can burn their own tokens
     * -- After burning tokens, total token supply decreases
     * -- Will trigger Transfer event (to zero address)
     */

    function burn(uint256 amount) public virtual override whenNotPaused {
        // Call parent class burn function
        super.burn(amount);
    }
    

    /**
     * @dev Burn tokens - Allow burning others' tokens
     * @param account Account to burn from
     * @param amount Amount to burn
     * 
     * -- Allow burning others' tokens, DEX can burn user tokens (if user authorized)
     * -- Contract can automatically burn tokens according to rules
     */
     function burnFrom(address account, uint256 amount) public override whenNotPaused {
        super.burnFrom(account, amount);
    }



    // View functions
    /**
     * @dev Get contract owner
     */
    function getOwner() public view returns (address) {
        return owner();
    }

    /**
     * @dev Get contract pause status
     */
    function getPaused() public view returns (bool) {
        return paused();
    }


     // ========== 视图函数 ==========


     /**
     * @dev 计算手续费分配详情
     * @param taxAmount 总手续费金额
     * @return burnAmount 销毁金额
     * @return receiverAmount 接收方金额
     */
    function calculateTaxDistribution(uint256 taxAmount) 
        public 
        view 
        returns (uint256 burnAmount, uint256 receiverAmount) 
    {
        return _calculateDistribution(taxAmount);
    }
    
    /**
     * @dev 获取完整的代币经济设置
     */
    function getTokenEconomics() 
        public 
        view 
        returns (
            uint256 currentTaxRate,
            uint256 currentBurnPercentage,
            address currentTaxReceiver,
            bool isTaxEnabled,
            bool isBurnEnabled
        ) 
    {
        return (taxRate, burnPercentage, taxReceiver, taxEnabled, burnEnabled);
    }
    
    /**
     * @dev 获取详细的转账计算结果
     * @param amount 原始转账金额
     */
    function getDetailedTransferCalculation(uint256 amount) 
        public 
        view 
        returns (
            uint256 originalAmount,
            uint256 taxAmount,
            uint256 netAmount,
            uint256 burnAmount,
            uint256 receiverAmount
        ) 
    {
        (uint256 net, uint256 tax) = _calculateTax(amount);
        (uint256 burnAmount, uint256 receiverAmount) = _calculateDistribution(tax);
        
        return (amount, tax, net, burnAmount, receiverAmount);
    }
    
    /**
     * @dev 计算转账的手续费和净金额
     * @param amount 原始金额
     * @return netAmount 净金额
     * @return taxAmount 手续费金额
     */
    function calculateTransferAmount(uint256 amount) 
        public 
        view 
        returns (uint256 netAmount, uint256 taxAmount) 
    {
        return _calculateTax(amount);
    }
    
    /**
     * @dev 获取当前手续费设置
     */
    function getTaxSettings() 
        public 
        view 
        returns (uint256 currentTaxRate, address currentTaxReceiver, bool isTaxEnabled) 
    {
        return (taxRate, taxReceiver, taxEnabled);
    }

}