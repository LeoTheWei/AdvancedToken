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


    // ============== Events ==============
    event WhitelistUpdated(address indexed account, bool status);
    event WhitelistEnableUpdated(bool enabled);
    event WhitelistBatchUpdated(address[] accounts, bool status);

    /**
    * @dev Constructor, sets token name, symbol and initial supply
    * @param initialSupply Initial supply
    * - msg.sender Deployer
    * - initialSupply Initial supply
    * - 10 ** decimals() Convert to smallest unit (1 ADV = 10^18 smallest units)
    * - Ownable(msg.sender) Transfer ownership to deployer
    */
    constructor(uint256 initialSupply) ERC20("AdvancedToken", "ADV") Ownable(msg.sender) {
        // Mint initial tokens to deployer
        _mint(msg.sender, initialSupply * 10 ** decimals());

        // Add deployer to whitelist by default
        whiteList[msg.sender] = true;
        // Enable whitelist by default
        whistelistEnabled = true;
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
        console.log("Whitelist updated:", account, status ? "added" : "removed");
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
        console.log("Batch whitelist update:", accounts.length, "addresses", status ? "added" : "removed");
    }

    /**
     * 
     * @dev Admin enables/disables whitelist restriction
     * @param enabled Status true means enable whitelist, false means disable whitelist
     */
    function setWhitelistEnabled(bool enabled) public onlyOwner {
        whistelistEnabled = enabled;
        emit WhitelistEnableUpdated(enabled);
        console.log("Whitelist switch:", enabled ? "enabled" : "disabled");
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
        console.log("Recipient address", to);
        console.log("Mint timestamp", block.timestamp);
        console.log("Mint block", block.number);
        console.log("Mint transaction", _msgSender());
        
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
     * @dev Override transfer and approval functions, add pause check
     */
    function transfer(address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        console.log("Transferring tokens");
        _checkWhitelist(msg.sender, to);
        return super.transfer(to, amount);
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

}