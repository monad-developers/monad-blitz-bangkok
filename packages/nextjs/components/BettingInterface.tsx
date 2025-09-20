"use client";

import React, { useState, useEffect } from "react";
import { Poll, BetDirection, BettingResult, ProfitCalculationResponse } from "~~/types/poll";
import { useAuth, useBettingInfo } from "~~/hooks/useAuth";

interface BettingInterfaceProps {
  poll: Poll;
  onBetPlaced?: (result: BettingResult) => void;
  onBetCancel?: () => void;
  disabled?: boolean;
}

export const BettingInterface: React.FC<BettingInterfaceProps> = ({
  poll,
  onBetPlaced,
  onBetCancel,
  disabled = false
}) => {
  const { user, walletBalance, requestGasSupport } = useAuth();
  const { canBet, needsGas, balance } = useBettingInfo();

  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [selectedDirection, setSelectedDirection] = useState<BetDirection | null>(null);
  const [profitData, setProfitData] = useState<ProfitCalculationResponse['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const betAmount = "0.01"; // Fixed bet amount

  // Calculate potential profit when direction is selected
  useEffect(() => {
    if (selectedDirection && poll.marketAddress) {
      fetchProfitCalculation(selectedDirection);
    }
  }, [selectedDirection, poll.marketAddress]);

  const fetchProfitCalculation = async (direction: BetDirection) => {
    if (!poll.marketAddress) return;

    try {
      const response = await fetch(
        `/api/betting/market/${poll.marketAddress}/profit/${direction === 'yes'}/${betAmount}`
      );
      const data: ProfitCalculationResponse = await response.json();

      if (data.success && data.data) {
        setProfitData(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch profit calculation:", err);
    }
  };

  const placeBet = async (direction: BetDirection) => {
    if (!user || !poll.marketAddress) return;

    setIsPlacingBet(true);
    setError(null);

    try {
      const response = await fetch("/api/betting/market/bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marketAddress: poll.marketAddress,
          betOnYes: direction === 'yes',
          userId: user.uid,
        }),
      });

      const result: BettingResult = await response.json();

      if (result.success) {
        onBetPlaced?.(result);
        setShowConfirmation(false);
        setSelectedDirection(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error("Betting error:", err);
      setError(err instanceof Error ? err.message : "Failed to place bet");
    } finally {
      setIsPlacingBet(false);
    }
  };

  const handleDirectionSelect = (direction: BetDirection) => {
    if (disabled || isPlacingBet) return;

    setSelectedDirection(direction);
    setError(null);
    setShowConfirmation(true);
  };

  const handleConfirmBet = () => {
    if (selectedDirection) {
      placeBet(selectedDirection);
    }
  };

  const handleCancel = () => {
    setSelectedDirection(null);
    setShowConfirmation(false);
    setProfitData(null);
    setError(null);
    onBetCancel?.();
  };

  // Check if user has already bet on this poll
  const hasUserBet = poll.userBets?.hasVoted;
  const userBetDirection = poll.userBets?.betOnYes ? 'yes' : 'no';

  // If user already bet, show their bet
  if (hasUserBet) {
    return (
      <div className="space-y-3">
        <div className="alert alert-info">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-bold">You've already bet on this poll!</h3>
            <div className="text-sm">
              Your bet: <strong>{poll.userBets?.totalAmount} MON</strong> on{" "}
              <strong className={userBetDirection === 'yes' ? 'text-success' : 'text-error'}>
                {userBetDirection?.toUpperCase()}
              </strong>
            </div>
            {poll.userBets?.canClaim && poll.userBets?.claimAmount && (
              <div className="text-sm text-success">
                🎉 You can claim <strong>{poll.userBets.claimAmount} MON</strong>!
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <div className={`flex-1 btn ${userBetDirection === 'no' ? 'btn-error' : 'btn-outline'}`}>
            <span className="text-xs">Your bet</span>
            <br />
            No: {poll.userBets?.noAmount} MON
          </div>
          <div className={`flex-1 btn ${userBetDirection === 'yes' ? 'btn-success' : 'btn-outline'}`}>
            <span className="text-xs">Your bet</span>
            <br />
            Yes: {poll.userBets?.yesAmount} MON
          </div>
        </div>
      </div>
    );
  }

  // If no market exists, show create market option
  if (!poll.marketExists || !poll.marketAddress) {
    return (
      <div className="space-y-3">
        <div className="alert alert-warning">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <div>
            <h3 className="font-bold">Betting Market Not Available</h3>
            <div className="text-sm">This poll doesn't have a betting market yet.</div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user needs gas
  if (needsGas) {
    return (
      <div className="space-y-3">
        <div className="alert alert-warning">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <div>
            <h3 className="font-bold">Gas Needed</h3>
            <div className="text-sm">You need gas tokens to place bets.</div>
          </div>
        </div>
        <button onClick={requestGasSupport} className="btn btn-warning btn-sm w-full">
          Request Free Gas
        </button>
      </div>
    );
  }

  // Check if user has sufficient balance
  if (!canBet) {
    return (
      <div className="space-y-3">
        <div className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-bold">Insufficient Balance</h3>
            <div className="text-sm">
              You need at least {betAmount} MON to bet. Current balance: {balance} MON
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show confirmation dialog
  if (showConfirmation && selectedDirection && profitData) {
    return (
      <div className="space-y-4">
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body p-4">
            <h3 className="font-bold text-center">Confirm Your Bet</h3>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Betting on:</span>
                <span className={`font-bold ${selectedDirection === 'yes' ? 'text-success' : 'text-error'}`}>
                  {selectedDirection.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Bet amount:</span>
                <span className="font-bold">{betAmount} MON</span>
              </div>
              <div className="flex justify-between">
                <span>Potential profit:</span>
                <span className="font-bold text-primary">+{profitData.profitIfWin} MON</span>
              </div>
              <div className="flex justify-between">
                <span>Total if win:</span>
                <span className="font-bold text-success">{profitData.potentialWinnings} MON</span>
              </div>
              <div className="flex justify-between text-sm text-base-content/70">
                <span>Current odds:</span>
                <span>
                  {selectedDirection === 'yes'
                    ? `${profitData.currentOdds.yesOdds.toFixed(2)}x`
                    : `${profitData.currentOdds.noOdds.toFixed(2)}x`
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="flex-1 btn btn-ghost"
            disabled={isPlacingBet}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmBet}
            className={`flex-1 btn ${selectedDirection === 'yes' ? 'btn-success' : 'btn-error'}`}
            disabled={isPlacingBet}
          >
            {isPlacingBet ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Placing bet...
              </>
            ) : (
              `Bet ${betAmount} MON`
            )}
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    );
  }

  // Show betting buttons
  return (
    <div className="space-y-3">
      <div className="text-center text-sm text-base-content/70">
        Bet {betAmount} MON • Balance: {balance} MON
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleDirectionSelect('no')}
          className="flex-1 btn btn-error btn-outline gap-2"
          disabled={disabled || isPlacingBet}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <div className="text-left">
            <div className="font-bold">No</div>
            {poll.odds && (
              <div className="text-xs">{poll.odds.noOdds.toFixed(2)}x odds</div>
            )}
          </div>
        </button>

        <button
          onClick={() => handleDirectionSelect('yes')}
          className="flex-1 btn btn-success btn-outline gap-2"
          disabled={disabled || isPlacingBet}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div className="text-right">
            <div className="font-bold">Yes</div>
            {poll.odds && (
              <div className="text-xs">{poll.odds.yesOdds.toFixed(2)}x odds</div>
            )}
          </div>
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
};