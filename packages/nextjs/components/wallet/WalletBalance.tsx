"use client";

import React, { useState, useEffect } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface WalletBalanceData {
  userId: string;
  address: string;
  balance: string;
  balanceWei: string;
  needsGasSupport: boolean;
  chainId: number;
  chainName: string;
  symbol: string;
}

interface WalletBalanceProps {
  userId: string;
}

export const WalletBalance: React.FC<WalletBalanceProps> = ({ userId }) => {
  const [balance, setBalance] = useState<WalletBalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRequestingGas, setIsRequestingGas] = useState(false);

  const fetchBalance = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    if (!showRefreshing) setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/wallet/balance/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch balance");
      }

      setBalance(data.data);
    } catch (err) {
      console.error("Fetch balance error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const requestGasSupport = async () => {
    setIsRequestingGas(true);
    setError(null);

    try {
      const response = await fetch("/api/wallet/gas-support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to request gas support");
      }

      // Show success message and refresh balance
      alert(`Gas support successful! Transaction: ${data.txHash}`);
      await fetchBalance(true);
    } catch (err) {
      console.error("Gas support error:", err);
      setError(err instanceof Error ? err.message : "Failed to request gas support");
    } finally {
      setIsRequestingGas(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchBalance();
    }
  }, [userId]);

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return "0.00";
    if (num < 0.001) return num.toFixed(6);
    if (num < 1) return num.toFixed(4);
    return num.toFixed(3);
  };

  if (isLoading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center space-x-2">
            <span className="loading loading-spinner loading-sm"></span>
            <span>Loading wallet balance...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !balance) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
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
            <span>{error}</span>
          </div>
          <div className="card-actions justify-center">
            <button className="btn btn-primary" onClick={() => fetchBalance()}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-start">
          <h2 className="card-title">
            <span>💳 Wallet Balance</span>
          </h2>
          <button
            className={`btn btn-ghost btn-sm ${isRefreshing ? "loading" : ""}`}
            onClick={() => fetchBalance(true)}
            disabled={isRefreshing}
          >
            {!isRefreshing && <ArrowPathIcon className="h-4 w-4" />}
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {balance && (
          <div className="space-y-4">
            {/* Main Balance Display */}
            <div className="text-center p-4 bg-base-200 rounded-lg">
              <div className="text-4xl font-bold text-primary">
                {formatBalance(balance.balance)}
              </div>
              <div className="text-lg text-base-content/70">
                {balance.symbol}
              </div>
              <div className="text-sm text-base-content/50">
                {balance.chainName}
              </div>
            </div>

            {/* Wallet Info */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-base-content/70">Address:</span>
                <span className="font-mono text-xs">
                  {`${balance.address.slice(0, 6)}...${balance.address.slice(-4)}`}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-base-content/70">Chain ID:</span>
                <span>{balance.chainId}</span>
              </div>
            </div>

            {/* Gas Support Section */}
            {balance.needsGasSupport && (
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
                <div className="flex-1">
                  <h3 className="font-bold">Low Balance</h3>
                  <div className="text-xs">You need gas to make transactions</div>
                </div>
                <button
                  className={`btn btn-sm btn-warning ${
                    isRequestingGas ? "loading" : ""
                  }`}
                  onClick={requestGasSupport}
                  disabled={isRequestingGas}
                >
                  {isRequestingGas ? "Requesting..." : "Request Gas"}
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
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
                <span>{error}</span>
              </div>
            )}

            {/* Balance in Wei (for debugging) */}
            <details className="collapse collapse-arrow bg-base-200">
              <summary className="collapse-title text-sm font-medium">
                Technical Details
              </summary>
              <div className="collapse-content text-xs space-y-2">
                <div>
                  <span className="text-base-content/70">Balance (Wei): </span>
                  <span className="font-mono break-all">{balance.balanceWei}</span>
                </div>
                <div>
                  <span className="text-base-content/70">Full Address: </span>
                  <span className="font-mono break-all">{balance.address}</span>
                </div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};