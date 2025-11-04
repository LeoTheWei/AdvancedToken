// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AdvancedToken
 * @dev Advanced token contract with whitelist, tax, burn, and DAO governance functionality
 */
contract AdvancedToken is ERC20, ERC20Burnable, Ownable, Pausable {

    // ============= Whitelist State Variables =============
    mapping(address => bool) public whiteList;
    bool public whistelistEnabled;

    // ===============TaxRate State Variables ==============
    uint256 public taxRate = 200; // 2%
    uint256 public constant TAX_BASE = 10000;
    address public taxReceiver;
    bool public taxEnabled;

    // ================burn state variables ================
    uint256 public burnPercentage = 5000; // 50%
    bool public burnEnabled;

    //======================DAO state variables ================
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 createTime;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool canceled;
    }

    mapping (uint256 => Proposal) public proposals;
    mapping (uint256 => mapping(address => bool)) public votingRecord;
    uint256 public proposalCount;

    // 治理参数
    uint public votingDelay = 1 days;
    uint public votingPeriod = 3 days;
    uint public timelockDelay = 1 days;
    uint public proposalThreshold = 1000 * 10 ** 18; // 1000 ADV
    uint public quorumVotes = 10000 * 10 ** 18; // 10000 ADV

    // ============== Events ==============
    event WhitelistUpdated(address indexed account, bool status);
    event WhitelistEnableUpdated(bool enabled);
    event WhitelistBatchUpdated(address[] accounts, bool status);
    event TaxRateUpdated(uint256 newTaxRate);
    event TaxReceiverUpdated(address newTaxReceiver);
    event TaxEnabledUpdated(bool taxEnabled);
    event TaxCharged(address indexed from, uint256 amount, uint256 taxAmount);
    event BurnPercentageUpdated(uint256 newBurnPercentage);
    event BurnEnabledUpdated(bool burnEnabled);
    event ToekensBurned(address indexed from, uint256 amount, uint256 burnAmount);
    event TaxDistrubuted(address indexed from, uint256 amount, uint256 taxAmount);

    // 治理事件
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        uint256 startTime,
        uint256 endTime
    );
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 support,
        uint256 votes
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);
    event GovernanceParametersUpdated(
        uint256 newVotingDelay,
        uint256 newVotingPeriod,
        uint256 newProposalThreshold,
        uint256 newQuorumVotes
    );

    constructor(uint256 initialSupply) ERC20("AdvancedToken", "ADV") Ownable(msg.sender) Pausable() {
        _mint(msg.sender, initialSupply * 10 ** decimals());
        whiteList[msg.sender] = true;
        whistelistEnabled = true;
        taxReceiver = msg.sender;
        taxEnabled = true;
        burnEnabled = true;
    }

    // ============== DAO Management Functions ==============
    /**
     * @dev 创建提案
     * @param description 提案描述
     * @return 提案id
     */
    function propose(string memory description) public returns (uint256) {
        require(balanceOf(msg.sender) >= proposalThreshold, "AdvancedToken: proposer votes below proposal threshold");
        proposalCount++;
        uint256 proposalId = proposalCount;

        uint256 startTime = block.timestamp + votingDelay;
        uint256 endTime = startTime + votingPeriod;

        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.description = description;
        newProposal.createTime = block.timestamp;
        newProposal.startTime = startTime;
        newProposal.endTime = endTime;
        newProposal.forVotes = 0;
        newProposal.againstVotes = 0;
        newProposal.abstainVotes = 0;
        newProposal.executed = false;
        newProposal.canceled = false;
        
        emit ProposalCreated(proposalId, msg.sender, description, startTime, endTime);
        return proposalId;
    }

    /**
     * @dev 对提案进行投票
     * @param proposalId 提案ID
     * @param support 支持票数 0=反对，1=赞成 2=弃权
     */
    function castVote(uint256 proposalId, uint8 support) public returns (bool) {
        require(support <= 2,"AdvancedToken: invalid vote support type");
        Proposal storage proposal = proposals[proposalId];

        require(proposal.id != 0, "AdvancedToken: proposal not exists");
        require(!proposal.executed, "AdvancedToken: proposal already executed");
        require(!proposal.canceled, "AdvancedToken: proposal already canceled");
        require(block.timestamp >= proposal.startTime, "AdvancedToken: voting not started");
        require(block.timestamp <= proposal.endTime, "AdvancedToken: voting already ended");
        require(!votingRecord[proposalId][msg.sender], "AdvancedToken: already voted");
        
        uint256 votes = balanceOf(msg.sender);
        require(votes > 0, "AdvancedToken: no votes to cast");

        votingRecord[proposalId][msg.sender] = true;
        
        if (support == 0) {
            proposal.againstVotes += votes;
        } else if (support == 1) {
            proposal.forVotes += votes;
        } else {
            proposal.abstainVotes += votes;
        }
        emit VoteCast(msg.sender, proposalId, support, votes);
        return true;
    }

    /**
     * @dev 执行提案
     * @param proposalId 提案ID
     */
    function executeProposal(uint256 proposalId) public {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "AdvancedToken: proposal not exists");
        require(!proposal.executed, "AdvancedToken: proposal already executed");
        require(!proposal.canceled, "AdvancedToken: proposal already canceled");
        require(block.timestamp > proposal.endTime, "AdvancedToken: voting not ended");
        require(block.timestamp >= proposal.endTime + timelockDelay, "AdvancedToken: timelock not passed");

        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        require(totalVotes >= quorumVotes, "AdvancedToken: quorum not reached");
        require(proposal.forVotes > proposal.againstVotes, "AdvancedToken: proposal not passed");

        proposal.executed = true;
        emit ProposalExecuted(proposalId);
        _executeGovernanceAction(proposalId, proposal.description);
    }

    /**
     * @dev 取消提案
     * @param proposalId 提案ID
     */
    function cancelProposal(uint256 proposalId) public {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "AdvancedToken: proposal not exists");
        require(!proposal.executed, "AdvancedToken: proposal already executed");
        require(!proposal.canceled, "AdvancedToken: proposal already canceled");
        
        require(
            msg.sender == proposal.proposer || msg.sender == owner(),
            "AdvancedToken: only proposer or owner can cancel"
        );
        proposal.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    // ========== 治理管理函数 ==========
    /**
     * @dev 更新治理参数（仅管理员）
     */
    function updateGovernanceParameters(
        uint256 newVotingDelay,
        uint256 newVotingPeriod, 
        uint256 newProposalThreshold,
        uint256 newQuorumVotes
    ) public onlyOwner {
        votingDelay = newVotingDelay;
        votingPeriod = newVotingPeriod;
        proposalThreshold = newProposalThreshold;
        quorumVotes = newQuorumVotes;
        
        emit GovernanceParametersUpdated(newVotingDelay, newVotingPeriod, newProposalThreshold, newQuorumVotes);
    }

    // ============== Burn Management Functions ==============
    function setBurnPercentage(uint256 newBurnPercentage) public onlyOwner {
        require(newBurnPercentage <= TAX_BASE, "AdvancedToken: burn percentage too high");
        require(newBurnPercentage != burnPercentage, "AdvancedToken: burn percentage already set");
        burnPercentage = newBurnPercentage;
        emit BurnPercentageUpdated(newBurnPercentage);
    }

    function setBurnEnabled(bool enable) public onlyOwner {
        burnEnabled = enable;
        emit BurnEnabledUpdated(enable);
    }

    // ============== TaxRate Management Functions ==============
    function setTaxRate(uint256 newTaxRate) public onlyOwner {
        require(newTaxRate <= 500, "AdvancedToken: tax rate too high");
        require(newTaxRate != taxRate, "AdvancedToken: tax rate already set");
        taxRate = newTaxRate;
        emit TaxRateUpdated(newTaxRate);
    }

    function setTaxEnabled(bool enable) public onlyOwner {
        taxEnabled = enable;
        emit TaxEnabledUpdated(enable);
    }

    function setTaxReceiver(address newReceiver) public onlyOwner {
        require(newReceiver != address(0), "AdvancedToken: zero address");
        taxReceiver = newReceiver;
        emit TaxReceiverUpdated(newReceiver);
    }

    // ============== Whitelist Functions =============
    function setWhitelist(address account, bool status) public onlyOwner {
        require(account != address(0), "AdvancedToken: zero address" );
        whiteList[account] = status;
        emit WhitelistUpdated(account, status);
    }

    function batchSetWhitelist(address[] memory accounts, bool status) public onlyOwner {
        require(accounts.length > 0, "AdvancedToken: accounts is empty");
        
        for (uint256 i = 0; i < accounts.length; i++) {
            require(accounts[i] != address(0), "AdvancedToken: zero address");
            whiteList[accounts[i]] = status;
        }
        emit WhitelistBatchUpdated(accounts, status);
    }

    function setWhitelistEnabled(bool enabled) public onlyOwner {
        whistelistEnabled = enabled;
        emit WhitelistEnableUpdated(enabled);
    }

    function isWhitelisted(address account) public view returns (bool) {
        return whiteList[account];
    }

    // Admin minting functionality
    function mint(uint256 amount, address to) public onlyOwner {
        require(to != address(0), "AdvancedToken: cannot mint to zero address");
        _mint(to, amount);
    }

    // Pause/Resume functionality
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    // ============== Override transfer and approval functions =============
    function transfer(address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        _checkWhitelist(msg.sender, to);
        (uint256 newAmount, uint256 taxAmount) = _calculateTax(amount);
        address from = _msgSender();

        if (taxAmount > 0) {
            _processTax(from, taxAmount);
        }

        bool success = super.transfer(to, newAmount);
        if (taxAmount > 0) {
           emit TaxCharged(from, amount, taxAmount);
        }
        return success;
    }

    function transferFrom(address from, address to, uint256 amount) 
        public virtual override whenNotPaused returns (bool) {
        _checkWhitelist(from, to);
        (uint256 netAmount, uint256 taxAmount) = _calculateTax(amount);
        
        // 消耗总授权额度（净金额 + 手续费）
        _spendAllowance(from, _msgSender(), amount);
        
        if (taxAmount > 0) {
            _processTax(from, taxAmount);
            emit TaxCharged(from, amount, taxAmount);
        }
        
        _transfer(from, to, netAmount);
        return true;
    }

    function approve(address spender, uint256 amount) public virtual override whenNotPaused returns (bool) {
        _checkWhitelist(msg.sender, spender);
        return super.approve(spender, amount);
    }

    // =========================== Internal Functions ==========================
    function _executeGovernanceAction(uint256 proposalId, string memory description) internal {
        // 简化实现，实际项目中会解析提案描述并执行具体操作
    }

    function _processTax(address from, uint256 taxAmount) internal {
        (uint256 burnAmount, uint256 receiverAmount) = _calculateDistribution(taxAmount);

        if (burnAmount > 0) {
            _burn(from, burnAmount);
            emit ToekensBurned(from, taxAmount, burnAmount);
        }

        if (receiverAmount > 0) {
            _transfer(from, taxReceiver, receiverAmount);
            emit TaxDistrubuted(from, taxAmount, receiverAmount);
        }
    }

    function _calculateDistribution(uint256 taxAmount) 
        internal view returns (uint256 burnAmount, uint256 receiverAmount) {
        if (!burnEnabled) {
            return (0, taxAmount);
        }
        
        burnAmount = (taxAmount * burnPercentage) / TAX_BASE;
        receiverAmount = taxAmount - burnAmount;
        return (burnAmount, receiverAmount);
    }

    function _calculateTax(uint256 amount) internal view returns (uint256, uint256) {
        if (!taxEnabled) {
            return (amount, 0);
        }
        uint256 taxAmount = amount * taxRate / TAX_BASE;
        uint256 newAmount = amount - taxAmount;
        return (newAmount, taxAmount);
    }

    function _checkWhitelist(address from, address to) internal view {
        if (!whistelistEnabled) {
            return;
        }
        require(whiteList[from], "AdvancedToken: sender not in whitelist");
        require(whiteList[to], "AdvancedToken: receiver not in whitelist");
    }

    // View functions
    function getOwner() public view returns (address) {
        return owner();
    }

    function getPaused() public view returns (bool) {
        return paused();
    }

    // ========== 视图函数 ==========
    function getProposal(uint256 proposalId)
        public view returns (
            uint256 id,
            address proposer,
            string memory description,
            uint256 createTime,
            uint256 startTime,
            uint256 endTime,
            uint256 forVotes,
            uint256 againstVotes,
            uint256 abstainVotes,
            bool executed,
            bool canceled
        )
    {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "AdvancedToken: proposal not exists");
        
        return (
            proposal.id,
            proposal.proposer,
            proposal.description,
            proposal.createTime,
            proposal.startTime,
            proposal.endTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.executed,
            proposal.canceled
        );
    }

    function hasVoted(uint256 proposalId, address voter) public view returns (bool) {
        return votingRecord[proposalId][voter];
    }
    
    function getVotes(address account) public view returns (uint256) {
        return balanceOf(account);
    }
    
    function getProposalState(uint256 proposalId) public view returns (string memory) {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "AdvancedToken: proposal not exists");
        
        if (proposal.canceled) return "Canceled";
        if (proposal.executed) return "Executed";
        if (block.timestamp < proposal.startTime) return "Pending";
        if (block.timestamp <= proposal.endTime) return "Active";
        if (block.timestamp <= proposal.endTime + timelockDelay) return "Queued";
        return "Expired";
    }

    function getGovernanceParameters()
        public view returns (
            uint256 currentVotingDelay,
            uint256 currentVotingPeriod,
            uint256 currentProposalThreshold,
            uint256 currentQuorumVotes,
            uint256 currentTimelockDelay
        )
    {
        return (votingDelay, votingPeriod, proposalThreshold, quorumVotes, timelockDelay);
    }

    function calculateTaxDistribution(uint256 taxAmount) 
        public view returns (uint256 burnAmount, uint256 receiverAmount) {
        return _calculateDistribution(taxAmount);
    }
    
    function getTokenEconomics() 
        public view returns (
            uint256 currentTaxRate,
            uint256 currentBurnPercentage,
            address currentTaxReceiver,
            bool isTaxEnabled,
            bool isBurnEnabled
        ) 
    {
        return (taxRate, burnPercentage, taxReceiver, taxEnabled, burnEnabled);
    }
    
    function getDetailedTransferCalculation(uint256 amount) 
        public view returns (
            uint256 originalAmount,
            uint256 taxAmount,
            uint256 netAmount,
            uint256 burnAmount,
            uint256 receiverAmount
        ) 
    {
        (netAmount, taxAmount) = _calculateTax(amount);
        (burnAmount, receiverAmount) = _calculateDistribution(taxAmount);
        return (amount, taxAmount, netAmount, burnAmount, receiverAmount);
    }
    
    function calculateTransferAmount(uint256 amount) 
        public view returns (uint256 netAmount, uint256 taxAmount) {
        return _calculateTax(amount);
    }
    
    function getTaxSettings() 
        public view returns (uint256 currentTaxRate, address currentTaxReceiver, bool isTaxEnabled) {
        return (taxRate, taxReceiver, taxEnabled);
    }

    // Override burn functions to add pause check
    function burn(uint256 amount) public virtual override whenNotPaused {
        super.burn(amount);
    }

    function burnFrom(address account, uint256 amount) public virtual override whenNotPaused {
        super.burnFrom(account, amount);
    }
}