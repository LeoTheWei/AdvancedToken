// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// File: @openzeppelin/contracts/token/ERC20/IERC20.sol
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/IERC20.sol)

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

// File: @openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol

// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/extensions/IERC20Metadata.sol)


/**
 * @dev Interface for the optional metadata functions from the ERC-20 standard.
 */
interface IERC20Metadata is IERC20 {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view returns (uint8);
}

// File: @openzeppelin/contracts/utils/Context.sol

// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

// File: @openzeppelin/contracts/interfaces/draft-IERC6093.sol

// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/draft-IERC6093.sol)

/**
 * @dev Standard ERC-20 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-20 tokens.
 */
interface IERC20Errors {
    /**
     * @dev Indicates an error related to the current `balance` of a `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param balance Current balance for the interacting account.
     * @param needed Minimum amount required to perform a transfer.
     */
    error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC20InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC20InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `spender`'s `allowance`. Used in transfers.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     * @param allowance Amount of tokens a `spender` is allowed to operate with.
     * @param needed Minimum amount required to perform a transfer.
     */
    error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC20InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `spender` to be approved. Used in approvals.
     * @param spender Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC20InvalidSpender(address spender);
}

/**
 * @dev Standard ERC-721 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-721 tokens.
 */
interface IERC721Errors {
    /**
     * @dev Indicates that an address can't be an owner. For example, `address(0)` is a forbidden owner in ERC-20.
     * Used in balance queries.
     * @param owner Address of the current owner of a token.
     */
    error ERC721InvalidOwner(address owner);

    /**
     * @dev Indicates a `tokenId` whose `owner` is the zero address.
     * @param tokenId Identifier number of a token.
     */
    error ERC721NonexistentToken(uint256 tokenId);

    /**
     * @dev Indicates an error related to the ownership over a particular token. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param tokenId Identifier number of a token.
     * @param owner Address of the current owner of a token.
     */
    error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC721InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC721InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `operator`'s approval. Used in transfers.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     * @param tokenId Identifier number of a token.
     */
    error ERC721InsufficientApproval(address operator, uint256 tokenId);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC721InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `operator` to be approved. Used in approvals.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC721InvalidOperator(address operator);
}

/**
 * @dev Standard ERC-1155 Errors
 * Interface of the https://eips.ethereum.org/EIPS/eip-6093[ERC-6093] custom errors for ERC-1155 tokens.
 */
interface IERC1155Errors {
    /**
     * @dev Indicates an error related to the current `balance` of a `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     * @param balance Current balance for the interacting account.
     * @param needed Minimum amount required to perform a transfer.
     * @param tokenId Identifier number of a token.
     */
    error ERC1155InsufficientBalance(address sender, uint256 balance, uint256 needed, uint256 tokenId);

    /**
     * @dev Indicates a failure with the token `sender`. Used in transfers.
     * @param sender Address whose tokens are being transferred.
     */
    error ERC1155InvalidSender(address sender);

    /**
     * @dev Indicates a failure with the token `receiver`. Used in transfers.
     * @param receiver Address to which tokens are being transferred.
     */
    error ERC1155InvalidReceiver(address receiver);

    /**
     * @dev Indicates a failure with the `operator`'s approval. Used in transfers.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     * @param owner Address of the current owner of a token.
     */
    error ERC1155MissingApprovalForAll(address operator, address owner);

    /**
     * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
     * @param approver Address initiating an approval operation.
     */
    error ERC1155InvalidApprover(address approver);

    /**
     * @dev Indicates a failure with the `operator` to be approved. Used in approvals.
     * @param operator Address that may be allowed to operate on tokens without being their owner.
     */
    error ERC1155InvalidOperator(address operator);

    /**
     * @dev Indicates an array length mismatch between ids and values in a safeBatchTransferFrom operation.
     * Used in batch transfers.
     * @param idsLength Length of the array of token identifiers
     * @param valuesLength Length of the array of token amounts
     */
    error ERC1155InvalidArrayLength(uint256 idsLength, uint256 valuesLength);
}

// File: @openzeppelin/contracts/token/ERC20/ERC20.sol

// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC20/ERC20.sol)

/**
 * @dev Implementation of the {IERC20} interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using {_mint}.
 *
 * TIP: For a detailed writeup see our guide
 * https://forum.openzeppelin.com/t/how-to-implement-erc20-supply-mechanisms/226[How
 * to implement supply mechanisms].
 *
 * The default value of {decimals} is 18. To change this, you should override
 * this function so it returns a different value.
 *
 * We have followed general OpenZeppelin Contracts guidelines: functions revert
 * instead returning `false` on failure. This behavior is nonetheless
 * conventional and does not conflict with the expectations of ERC-20
 * applications.
 */
abstract contract ERC20 is Context, IERC20, IERC20Metadata, IERC20Errors {
    mapping(address account => uint256) private _balances;

    mapping(address account => mapping(address spender => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;

    /**
     * @dev Sets the values for {name} and {symbol}.
     *
     * Both values are immutable: they can only be set once during construction.
     */
    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view virtual returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the default value returned by this function, unless
     * it's overridden.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view virtual returns (uint8) {
        return 18;
    }

    /// @inheritdoc IERC20
    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply;
    }

    /// @inheritdoc IERC20
    function balanceOf(address account) public view virtual returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `value`.
     */
    function transfer(address to, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, value);
        return true;
    }

    /// @inheritdoc IERC20
    function allowance(address owner, address spender) public view virtual returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * NOTE: If `value` is the maximum `uint256`, the allowance is not updated on
     * `transferFrom`. This is semantically equivalent to an infinite approval.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, value);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Skips emitting an {Approval} event indicating an allowance update. This is not
     * required by the ERC. See {xref-ERC20-_approve-address-address-uint256-bool-}[_approve].
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `value`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `value`.
     */
    function transferFrom(address from, address to, uint256 value) public virtual returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        return true;
    }

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _transfer(address from, address to, uint256 value) internal {
        if (from == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(from, to, value);
    }

    /**
     * @dev Transfers a `value` amount of tokens from `from` to `to`, or alternatively mints (or burns) if `from`
     * (or `to`) is the zero address. All customizations to transfers, mints, and burns should be done by overriding
     * this function.
     *
     * Emits a {Transfer} event.
     */
    function _update(address from, address to, uint256 value) internal virtual {
        if (from == address(0)) {
            // Overflow check required: The rest of the code assumes that totalSupply never overflows
            _totalSupply += value;
        } else {
            uint256 fromBalance = _balances[from];
            if (fromBalance < value) {
                revert ERC20InsufficientBalance(from, fromBalance, value);
            }
            unchecked {
                // Overflow not possible: value <= fromBalance <= totalSupply.
                _balances[from] = fromBalance - value;
            }
        }

        if (to == address(0)) {
            unchecked {
                // Overflow not possible: value <= totalSupply or value <= fromBalance <= totalSupply.
                _totalSupply -= value;
            }
        } else {
            unchecked {
                // Overflow not possible: balance + value is at most totalSupply, which we know fits into a uint256.
                _balances[to] += value;
            }
        }

        emit Transfer(from, to, value);
    }

    /**
     * @dev Creates a `value` amount of tokens and assigns them to `account`, by transferring it from address(0).
     * Relies on the `_update` mechanism
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _mint(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(address(0), account, value);
    }

    /**
     * @dev Destroys a `value` amount of tokens from `account`, lowering the total supply.
     * Relies on the `_update` mechanism.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead
     */
    function _burn(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        _update(account, address(0), value);
    }

    /**
     * @dev Sets `value` as the allowance of `spender` over the `owner`'s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     *
     * Overrides to this logic should be done to the variant with an additional `bool emitEvent` argument.
     */
    function _approve(address owner, address spender, uint256 value) internal {
        _approve(owner, spender, value, true);
    }

    /**
     * @dev Variant of {_approve} with an optional flag to enable or disable the {Approval} event.
     *
     * By default (when calling {_approve}) the flag is set to true. On the other hand, approval changes made by
     * `_spendAllowance` during the `transferFrom` operation set the flag to false. This saves gas by not emitting any
     * `Approval` event during `transferFrom` operations.
     *
     * Anyone who wishes to continue emitting `Approval` events on the`transferFrom` operation can force the flag to
     * true using the following override:
     *
     * ```solidity
     * function _approve(address owner, address spender, uint256 value, bool) internal virtual override {
     *     super._approve(owner, spender, value, true);
     * }
     * ```
     *
     * Requirements are the same as {_approve}.
     */
    function _approve(address owner, address spender, uint256 value, bool emitEvent) internal virtual {
        if (owner == address(0)) {
            revert ERC20InvalidApprover(address(0));
        }
        if (spender == address(0)) {
            revert ERC20InvalidSpender(address(0));
        }
        _allowances[owner][spender] = value;
        if (emitEvent) {
            emit Approval(owner, spender, value);
        }
    }

    /**
     * @dev Updates `owner`'s allowance for `spender` based on spent `value`.
     *
     * Does not update the allowance value in case of infinite allowance.
     * Revert if not enough allowance is available.
     *
     * Does not emit an {Approval} event.
     */
    function _spendAllowance(address owner, address spender, uint256 value) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance < type(uint256).max) {
            if (currentAllowance < value) {
                revert ERC20InsufficientAllowance(spender, currentAllowance, value);
            }
            unchecked {
                _approve(owner, spender, currentAllowance - value, false);
            }
        }
    }
}

// File: @openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol

// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/extensions/ERC20Burnable.sol)



/**
 * @dev Extension of {ERC20} that allows token holders to destroy both their own
 * tokens and those that they have an allowance for, in a way that can be
 * recognized off-chain (via event analysis).
 */
abstract contract ERC20Burnable is Context, ERC20 {
    /**
     * @dev Destroys a `value` amount of tokens from the caller.
     *
     * See {ERC20-_burn}.
     */
    function burn(uint256 value) public virtual {
        _burn(_msgSender(), value);
    }

    /**
     * @dev Destroys a `value` amount of tokens from `account`, deducting from
     * the caller's allowance.
     *
     * See {ERC20-_burn} and {ERC20-allowance}.
     *
     * Requirements:
     *
     * - the caller must have allowance for ``accounts``'s tokens of at least
     * `value`.
     */
    function burnFrom(address account, uint256 value) public virtual {
        _spendAllowance(account, _msgSender(), value);
        _burn(account, value);
    }
}

// File: @openzeppelin/contracts/access/Ownable.sol

// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)


/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// File: @openzeppelin/contracts/utils/Pausable.sol

// OpenZeppelin Contracts (last updated v5.3.0) (utils/Pausable.sol)


/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract Pausable is Context {
    bool private _paused;

    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    /**
     * @dev The operation failed because the contract is paused.
     */
    error EnforcedPause();

    /**
     * @dev The operation failed because the contract is not paused.
     */
    error ExpectedPause();

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        if (paused()) {
            revert EnforcedPause();
        }
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        if (!paused()) {
            revert ExpectedPause();
        }
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}

// File: contracts/AdvancedToken.sol




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