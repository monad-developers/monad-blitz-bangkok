//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

enum EventStatus { TRADING, RESOLVED }

enum BetStatus { PENDING, WIN , LOSE ,CLAIMED }

contract NadxPrediction is Ownable {
    constructor() Ownable(msg.sender) {}

    uint256 public totalPool;
    uint256 public totalClaimed;

    struct Event {
        uint256 id;
        uint256 start;
        uint256 end;
        EventStatus status;
        uint256 totalPool;
        uint256 totalParticipants;
        mapping(address => Bet) bets;
        uint256 resolvedId;
    }

    struct Bet {
        address user;
        uint256 amount;
        uint256 marketId;
        BetStatus status;
        uint256 reward;
    }

    mapping(uint256 => Event) public events;

    modifier onlyTrading(uint256 _eventId) {
        require(events[_eventId].status == EventStatus.TRADING, "Event is not trading");
        _;
    }

    modifier onlyResolved(uint256 _eventId) {
        require(events[_eventId].status == EventStatus.RESOLVED, "Event is not resolved");
        _;
    }

    modifier notClaimed(uint256 _eventId) {
        require(events[_eventId].bets[msg.sender].status != BetStatus.CLAIMED, "Bet already claimed");
        _;
    }

    modifier canClaim(uint256 _eventId) {
        require(events[_eventId].bets[msg.sender].status == BetStatus.WIN, "Bet already claimed");
        _;
    }

    function bet(uint256 _eventId, uint256 _marketId) public payable onlyTrading(_eventId) {
        uint256 amount = msg.value;
        Bet storage userBet = events[_eventId].bets[msg.sender];

        if (userBet.status == BetStatus.PENDING) {
            userBet.amount += amount;
        } else {
            events[_eventId].bets[msg.sender] = Bet(msg.sender, amount, _marketId, BetStatus.PENDING, 0);
            events[_eventId].totalParticipants++;
        }
        events[_eventId].totalPool += amount;
    }

    function resolve(uint256 _eventId, uint256 _resolvedId) public onlyOwner onlyTrading(_eventId) {
        Event storage eventToResolve = events[_eventId];
        eventToResolve.status = EventStatus.RESOLVED;
        eventToResolve.resolvedId = _resolvedId;

        for (uint256 i = 0; i < eventToResolve.totalParticipants; i++) {
            Bet storage userBet = events[_eventId].bets[msg.sender];
            if (userBet.marketId == _resolvedId) {
                userBet.reward = eventToResolve.totalPool * userBet.amount / eventToResolve.totalPool;

               userBet.status = BetStatus.WIN;
            } else {
               userBet.status = BetStatus.LOSE;
            }
        }

    }

    function claim(uint256 _eventId) public onlyResolved(_eventId) canClaim(_eventId) notClaimed(_eventId) {
        Bet storage userBet = events[_eventId].bets[msg.sender];
        uint256 amount = userBet.reward;

        payable(msg.sender).transfer(amount);
        userBet.status = BetStatus.CLAIMED;
    }


    function getBetDetails(uint256 _eventId, address _account) public view returns (uint256 marketId, BetStatus status, uint256 reward) {
        Bet storage userBet = events[_eventId].bets[_account];
        return (userBet.marketId, userBet.status, userBet.reward);
    }

    function getEventStatus(uint256 _eventId) public view returns (EventStatus) {
        return events[_eventId].status;
    }
}
