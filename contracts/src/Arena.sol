// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title Arena
 * @dev Core contract for managing coding matches, stakes, and rewards
 */
contract Arena is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    
    IERC20 public immutable gameToken;
    address public oracle;
    address public mempool; // Main mempool address for entry fees
    
    uint256 public protocolFeeBps = 250; // 2.5%
    uint256 public constant MAX_PROTOCOL_FEE_BPS = 1000; // 10% max
    uint256 public constant MATCH_TIMEOUT = 1 hours;
    uint256 public constant ENTRY_FEE = 0.025 ether; // 0.025 MON in wei
    
    enum MatchStatus {
        Created,
        Joined,
        InProgress,
        PendingResolution,
        Resolved,
        Cancelled,
        Refunded
    }
    
    enum MatchMode {
        SpeedSolve,
        Optimization,
        CTF
    }
    
    struct Match {
        bytes32 id;
        address creator;
        address opponent;
        MatchMode mode;
        uint256 stakeAmount;
        bytes32 challengeHash;
        MatchStatus status;
        address winner;
        uint256 createdAt;
        uint256 resolvedAt;
        uint256 timeLimit;
    }
    
    mapping(bytes32 => Match) public matches;
    mapping(address => uint256) public playerStakes; // Total staked by player
    
    uint256 public totalTreasuryFees;
    uint256 public matchCounter;
    
    event MatchCreated(
        bytes32 indexed matchId,
        address indexed creator,
        MatchMode mode,
        uint256 stakeAmount,
        bytes32 challengeHash
    );
    
    event MatchJoined(bytes32 indexed matchId, address indexed opponent);
    event MatchStarted(bytes32 indexed matchId);
    event MatchResolved(
        bytes32 indexed matchId,
        address indexed winner,
        address indexed loser,
        uint256 payout
    );
    event MatchCancelled(bytes32 indexed matchId, string reason);
    event MatchRefunded(bytes32 indexed matchId, address indexed player, uint256 amount);
    event EntryFeePaid(address indexed player, bytes32 indexed matchId, uint256 amount);
    
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event MempoolUpdated(address indexed oldMempool, address indexed newMempool);
    event ProtocolFeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryWithdrawal(address indexed to, uint256 amount);
    
    modifier onlyOracle() {
        require(msg.sender == oracle, "Arena: caller is not oracle");
        _;
    }
    
    modifier validMatchId(bytes32 matchId) {
        require(matches[matchId].creator != address(0), "Arena: match does not exist");
        _;
    }
    
    constructor(address _gameToken, address _oracle, address _mempool) {
        require(_gameToken != address(0), "Arena: invalid game token");
        require(_oracle != address(0), "Arena: invalid oracle");
        require(_mempool != address(0), "Arena: invalid mempool");
        
        gameToken = IERC20(_gameToken);
        oracle = _oracle;
        mempool = _mempool;
    }
    
    /**
     * @dev Create a new match with stake
     */
    function createMatch(
        MatchMode mode,
        uint256 stakeAmount,
        bytes32 challengeHash,
        uint256 timeLimit
    ) external nonReentrant whenNotPaused returns (bytes32 matchId) {
        require(stakeAmount > 0, "Arena: stake amount must be positive");
        require(timeLimit > 0 && timeLimit <= MATCH_TIMEOUT, "Arena: invalid time limit");
        
        matchId = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            matchCounter++
        ));
        
        // Transfer stake to contract
        gameToken.safeTransferFrom(msg.sender, address(this), stakeAmount);
        playerStakes[msg.sender] += stakeAmount;
        
        matches[matchId] = Match({
            id: matchId,
            creator: msg.sender,
            opponent: address(0),
            mode: mode,
            stakeAmount: stakeAmount,
            challengeHash: challengeHash,
            status: MatchStatus.Created,
            winner: address(0),
            createdAt: block.timestamp,
            resolvedAt: 0,
            timeLimit: timeLimit
        });
        
        emit MatchCreated(matchId, msg.sender, mode, stakeAmount, challengeHash);
    }
    
    /**
     * @dev Join an existing match
     */
    function joinMatch(bytes32 matchId) external payable nonReentrant whenNotPaused validMatchId(matchId) {
        Match storage match_ = matches[matchId];
        
        require(match_.status == MatchStatus.Created, "Arena: match not available");
        require(match_.creator != msg.sender, "Arena: cannot join own match");
        require(
            block.timestamp <= match_.createdAt + MATCH_TIMEOUT,
            "Arena: match expired"
        );
        require(msg.value == ENTRY_FEE, "Arena: incorrect entry fee");
        
        // Transfer entry fee to mempool
        (bool success, ) = mempool.call{value: msg.value}("");
        require(success, "Arena: entry fee transfer failed");
        
        // Transfer stake to contract
        gameToken.safeTransferFrom(msg.sender, address(this), match_.stakeAmount);
        playerStakes[msg.sender] += match_.stakeAmount;
        
        match_.opponent = msg.sender;
        match_.status = MatchStatus.Joined;
        
        emit EntryFeePaid(msg.sender, matchId, msg.value);
        emit MatchJoined(matchId, msg.sender);
        emit MatchStarted(matchId);
    }
    
    /**
     * @dev Resolve match by oracle
     */
    function resolveMatch(
        bytes32 matchId,
        address winner,
        bytes calldata signature
    ) external onlyOracle validMatchId(matchId) {
        Match storage match_ = matches[matchId];
        
        require(
            match_.status == MatchStatus.Joined || match_.status == MatchStatus.InProgress,
            "Arena: match not resolvable"
        );
        require(
            winner == match_.creator || winner == match_.opponent,
            "Arena: invalid winner"
        );
        
        // Verify oracle signature
        bytes32 messageHash = keccak256(abi.encodePacked(matchId, winner));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        require(
            ethSignedMessageHash.recover(signature) == oracle,
            "Arena: invalid signature"
        );
        
        address loser = winner == match_.creator ? match_.opponent : match_.creator;
        uint256 totalPot = match_.stakeAmount * 2;
        uint256 protocolFee = (totalPot * protocolFeeBps) / 10000;
        uint256 payout = totalPot - protocolFee;
        
        // Update state
        match_.winner = winner;
        match_.status = MatchStatus.Resolved;
        match_.resolvedAt = block.timestamp;
        
        // Update player stakes
        playerStakes[match_.creator] -= match_.stakeAmount;
        playerStakes[match_.opponent] -= match_.stakeAmount;
        
        // Update treasury
        totalTreasuryFees += protocolFee;
        
        // Transfer payout to winner
        gameToken.safeTransfer(winner, payout);
        
        emit MatchResolved(matchId, winner, loser, payout);
    }
    
    /**
     * @dev Cancel match (only creator, only if not joined)
     */
    function cancelMatch(bytes32 matchId) external validMatchId(matchId) {
        Match storage match_ = matches[matchId];
        
        require(msg.sender == match_.creator, "Arena: only creator can cancel");
        require(match_.status == MatchStatus.Created, "Arena: match cannot be cancelled");
        
        match_.status = MatchStatus.Cancelled;
        playerStakes[match_.creator] -= match_.stakeAmount;
        
        // Refund creator's stake
        gameToken.safeTransfer(match_.creator, match_.stakeAmount);
        
        emit MatchCancelled(matchId, "Cancelled by creator");
    }
    
    /**
     * @dev Emergency refund for expired matches
     */
    function refundExpiredMatch(bytes32 matchId) external validMatchId(matchId) {
        Match storage match_ = matches[matchId];
        
        require(
            block.timestamp > match_.createdAt + MATCH_TIMEOUT + 1 hours,
            "Arena: match not expired for refund"
        );
        require(
            match_.status == MatchStatus.Created || 
            match_.status == MatchStatus.Joined ||
            match_.status == MatchStatus.InProgress,
            "Arena: match not refundable"
        );
        
        match_.status = MatchStatus.Refunded;
        
        // Refund both players if opponent joined
        if (match_.opponent != address(0)) {
            playerStakes[match_.creator] -= match_.stakeAmount;
            playerStakes[match_.opponent] -= match_.stakeAmount;
            
            gameToken.safeTransfer(match_.creator, match_.stakeAmount);
            gameToken.safeTransfer(match_.opponent, match_.stakeAmount);
            
            emit MatchRefunded(matchId, match_.creator, match_.stakeAmount);
            emit MatchRefunded(matchId, match_.opponent, match_.stakeAmount);
        } else {
            // Only refund creator
            playerStakes[match_.creator] -= match_.stakeAmount;
            gameToken.safeTransfer(match_.creator, match_.stakeAmount);
            
            emit MatchRefunded(matchId, match_.creator, match_.stakeAmount);
        }
    }
    
    /**
     * @dev Update oracle address
     */
    function updateOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Arena: invalid oracle address");
        
        address oldOracle = oracle;
        oracle = newOracle;
        
        emit OracleUpdated(oldOracle, newOracle);
    }
    
    /**
     * @dev Update mempool address
     */
    function updateMempool(address newMempool) external onlyOwner {
        require(newMempool != address(0), "Arena: invalid mempool address");
        
        address oldMempool = mempool;
        mempool = newMempool;
        
        emit MempoolUpdated(oldMempool, newMempool);
    }
    
    /**
     * @dev Update protocol fee
     */
    function updateProtocolFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_PROTOCOL_FEE_BPS, "Arena: fee too high");
        
        uint256 oldFee = protocolFeeBps;
        protocolFeeBps = newFeeBps;
        
        emit ProtocolFeeUpdated(oldFee, newFeeBps);
    }
    
    /**
     * @dev Withdraw treasury fees
     */
    function withdrawTreasuryFees(address to) external onlyOwner {
        require(to != address(0), "Arena: invalid recipient");
        require(totalTreasuryFees > 0, "Arena: no fees to withdraw");
        
        uint256 amount = totalTreasuryFees;
        totalTreasuryFees = 0;
        
        gameToken.safeTransfer(to, amount);
        
        emit TreasuryWithdrawal(to, amount);
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get match details
     */
    function getMatch(bytes32 matchId) external view returns (Match memory) {
        return matches[matchId];
    }
    
    /**
     * @dev Get entry fee amount
     */
    function getEntryFee() external pure returns (uint256) {
        return ENTRY_FEE;
    }
    
    /**
     * @dev Get mempool address
     */
    function getMempool() external view returns (address) {
        return mempool;
    }
}