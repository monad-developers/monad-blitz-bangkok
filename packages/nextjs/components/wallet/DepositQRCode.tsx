"use client";

import React, { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";

interface WalletInfo {
  userId: string;
  address: string;
  privyWalletId: string;
  chainType: string;
  createdAt: string;
  updatedAt: string;
}

interface DepositQRCodeProps {
  userId: string;
}

export const DepositQRCode: React.FC<DepositQRCodeProps> = ({ userId }) => {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const fetchWalletInfo = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/wallet/info/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch wallet info");
      }

      setWalletInfo(data.data);
    } catch (err) {
      console.error("Fetch wallet info error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch wallet info");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchWalletInfo();
    }
  }, [userId]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center space-x-2">
            <span className="loading loading-spinner loading-sm"></span>
            <span>Loading wallet info...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
            <button className="btn btn-primary" onClick={fetchWalletInfo}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!walletInfo) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
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
            <span>Wallet not found</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">
          <span>📱 Deposit</span>
        </h2>

        <div className="space-y-6">
          {/* QR Code Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-white rounded-lg">
              <QRCodeCanvas
                value={walletInfo.address}
                size={200}
                level="M"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-base-content/70 mb-2">
                Scan QR code to get wallet address
              </p>
              <p className="text-xs text-base-content/50">
                Send MON tokens to this address on Monad Testnet
              </p>
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-2">
            <label className="label">
              <span className="label-text font-semibold">Wallet Address</span>
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={walletInfo.address}
                readOnly
                className="input input-bordered flex-1 font-mono text-sm"
              />
              <button
                className={`btn btn-square ${
                  isCopied ? "btn-success" : "btn-outline"
                }`}
                onClick={() => copyToClipboard(walletInfo.address)}
              >
                {isCopied ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  <ClipboardDocumentIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            <label className="label">
              <span className="label-text-alt">
                {isCopied ? "Address copied to clipboard!" : "Click to copy address"}
              </span>
            </label>
          </div>

          {/* Short Address Display */}
          <div className="text-center p-3 bg-base-200 rounded-lg">
            <p className="text-sm text-base-content/70 mb-1">Short Address</p>
            <p className="font-mono text-lg font-semibold">
              {formatAddress(walletInfo.address)}
            </p>
          </div>

          {/* Network Info */}
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
              <h3 className="font-bold">Important!</h3>
              <div className="text-sm">
                Only send MON tokens on <strong>Monad Testnet</strong>.
                Sending tokens on other networks will result in loss of funds.
              </div>
            </div>
          </div>

          {/* Wallet Details */}
          <details className="collapse collapse-arrow bg-base-200">
            <summary className="collapse-title text-sm font-medium">
              Wallet Details
            </summary>
            <div className="collapse-content text-xs space-y-2">
              <div>
                <span className="text-base-content/70">Chain Type: </span>
                <span className="font-mono">{walletInfo.chainType}</span>
              </div>
              <div>
                <span className="text-base-content/70">Privy Wallet ID: </span>
                <span className="font-mono break-all">{walletInfo.privyWalletId}</span>
              </div>
              <div>
                <span className="text-base-content/70">Created: </span>
                <span>{new Date(walletInfo.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-base-content/70">Updated: </span>
                <span>{new Date(walletInfo.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};