// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MemeRouletteLuckyBox
 * @dev A decentralized gambling game where users can spin 1 USDT to win random meme tokens
 * @notice This contract implements a lucky box game with auto-refill mechanism
 */
contract MemeRouletteLuckyBox is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Constants
    uint256 public constant SPIN_PRICE = 1_000_000; // 1 USDT (6 decimals)
    uint256 public constant TEAM_FEE_BPS = 500; // 5% (500 basis points)
    uint256 public constant REFILL_BUDGET_BPS = 9500; // 95% (9500 basis points)
    uint256 public constant POOL_SIZE = 10; // 10 different tokens
    uint256 public constant PIECES_PER_TOKEN = 10; // 10 pieces per token

    // State variables
    IERC20 public immutable USDT;
    address public teamWallet;
    address public refiller;
    
    address[] public tokens;
    mapping(address => uint256) public slotAmount; // Amount per piece for each token
    mapping(address => uint256) public tokenBalances; // Current balance of each token in pool
    
    bool public poolConfigured = false;
    bool public initialDepositDone = false;

    // Events
    event PoolConfigured(address[] tokens, uint256[] slotAmounts);
    event InitialDepositCompleted();
    event Spin(address indexed player, address indexed token, uint256 amount, uint256 teamFee, uint256 refillBudget);
    event RefillerSet(address indexed refiller);
    event TeamWalletSet(address indexed teamWallet);
    event TokensRescued(address indexed token, uint256 amount, address indexed to);

    // Errors
    error InvalidConfig();
    error PoolNotConfigured();
    error InitialDepositNotDone();
    error InsufficientBalance();
    error InvalidAddress();
    error TransferFailed();

    constructor(address _owner, address _usdt, address _teamWallet) Ownable(_owner) {
        require(_usdt != address(0), "Invalid USDT address");
        require(_teamWallet != address(0), "Invalid team wallet address");
        
        USDT = IERC20(_usdt);
        teamWallet = _teamWallet;
    }

    /**
     * @dev Configure the pool with tokens and amounts
     * @param _tokens Array of token addresses
     * @param _slotAmounts Array of amounts per piece for each token
     */
    function configurePool(address[] calldata _tokens, uint256[] calldata _slotAmounts) external onlyOwner {
        if (_tokens.length != POOL_SIZE) revert InvalidConfig();
        if (_tokens.length != _slotAmounts.length) revert InvalidConfig();
        
        // Clear existing configuration
        delete tokens;
        
        for (uint256 i = 0; i < _tokens.length; i++) {
            if (_tokens[i] == address(0)) revert InvalidConfig();
            if (_slotAmounts[i] == 0) revert InvalidConfig();
            
            tokens.push(_tokens[i]);
            slotAmount[_tokens[i]] = _slotAmounts[i];
            tokenBalances[_tokens[i]] = 0;
        }
        
        poolConfigured = true;
        emit PoolConfigured(_tokens, _slotAmounts);
    }

    /**
     * @dev Deposit initial inventory to the pool
     */
    function depositInitial() external onlyOwner {
        require(poolConfigured, "Pool not configured");
        require(!initialDepositDone, "Initial deposit already done");
        
        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            uint256 totalAmount = slotAmount[token] * PIECES_PER_TOKEN;
            
            IERC20 tokenContract = IERC20(token);
            uint256 allowance = tokenContract.allowance(msg.sender, address(this));
            require(allowance >= totalAmount, "Insufficient allowance");
            
            tokenContract.safeTransferFrom(msg.sender, address(this), totalAmount);
            tokenBalances[token] = totalAmount;
        }
        
        initialDepositDone = true;
        emit InitialDepositCompleted();
    }

    /**
     * @dev Spin the wheel and win a random token
     */
    function spin() external nonReentrant {
        require(poolConfigured, "Pool not configured");
        require(initialDepositDone, "Initial deposit not done");
        
        // Check USDT allowance and balance
        uint256 allowance = USDT.allowance(msg.sender, address(this));
        require(allowance >= SPIN_PRICE, "Insufficient USDT allowance");
        
        uint256 balance = USDT.balanceOf(msg.sender);
        require(balance >= SPIN_PRICE, "Insufficient USDT balance");
        
        // Transfer USDT from player
        USDT.safeTransferFrom(msg.sender, address(this), SPIN_PRICE);
        
        // Calculate fees
        uint256 teamFee = (SPIN_PRICE * TEAM_FEE_BPS) / 10000;
        uint256 refillBudget = (SPIN_PRICE * REFILL_BUDGET_BPS) / 10000;
        
        // Send team fee
        USDT.safeTransfer(teamWallet, teamFee);
        
        // Send refill budget to refiller
        USDT.safeTransfer(refiller, refillBudget);
        
        // Select random token
        address selectedToken = selectRandomToken();
        uint256 tokenAmount = slotAmount[selectedToken];
        
        // Check if we have the token in pool
        require(tokenBalances[selectedToken] >= tokenAmount, "Token not available in pool");
        
        // Transfer token to player
        IERC20(selectedToken).safeTransfer(msg.sender, tokenAmount);
        tokenBalances[selectedToken] -= tokenAmount;
        
        emit Spin(msg.sender, selectedToken, tokenAmount, teamFee, refillBudget);
    }

    /**
     * @dev Select a random token from the pool
     * @return Address of the selected token
     */
    function selectRandomToken() internal view returns (address) {
        // Use block.prevrandao for randomness (suitable for demo, not production)
        uint256 random = uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, msg.sender)));
        uint256 index = random % tokens.length;
        return tokens[index];
    }

    /**
     * @dev Set the refiller address
     * @param _refiller Address of the refiller contract
     */
    function setRefiller(address _refiller) external onlyOwner {
        require(_refiller != address(0), "Invalid refiller address");
        refiller = _refiller;
        emit RefillerSet(_refiller);
    }

    /**
     * @dev Set the team wallet address
     * @param _teamWallet Address of the team wallet
     */
    function setTeamWallet(address _teamWallet) external onlyOwner {
        require(_teamWallet != address(0), "Invalid team wallet address");
        teamWallet = _teamWallet;
        emit TeamWalletSet(_teamWallet);
    }

    /**
     * @dev Emergency function to rescue tokens
     * @param token Address of the token to rescue
     * @param amount Amount of tokens to rescue
     * @param to Address to send tokens to
     */
    function rescue(address token, uint256 amount, address to) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(to != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        require(balance >= amount, "Insufficient balance");
        
        tokenContract.safeTransfer(to, amount);
        emit TokensRescued(token, amount, to);
    }

    /**
     * @dev Get all tokens in the pool
     * @return Array of token addresses
     */
    function getTokens() external view returns (address[] memory) {
        return tokens;
    }

    /**
     * @dev Get pool snapshot
     * @return tokenList Array of token addresses
     * @return perPieceAmounts Array of amounts per piece
     * @return poolTargetSize Total target size of the pool
     */
    function getPoolSnapshot() external view returns (
        address[] memory tokenList,
        uint256[] memory perPieceAmounts,
        uint256 poolTargetSize
    ) {
        tokenList = tokens;
        perPieceAmounts = new uint256[](tokens.length);
        
        for (uint256 i = 0; i < tokens.length; i++) {
            perPieceAmounts[i] = slotAmount[tokens[i]];
        }
        
        poolTargetSize = POOL_SIZE * PIECES_PER_TOKEN;
    }

    /**
     * @dev Get token balance in pool
     * @param token Address of the token
     * @return Balance of the token in the pool
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return tokenBalances[token];
    }

    /**
     * @dev Check if pool is ready for spinning
     * @return True if pool is configured and initial deposit is done
     */
    function isPoolReady() external view returns (bool) {
        return poolConfigured && initialDepositDone;
    }
}
