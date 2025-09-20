"use client";

import React, { useState, useEffect } from "react";
import type { NextPage } from "next";
import { WalletBalance } from "~~/components/wallet/WalletBalance";
import { DepositQRCode } from "~~/components/wallet/DepositQRCode";

interface TwitterUser {
  _id: string;
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  walletAddress?: string;
  twitterId?: string;
  twitterUsername?: string;
  createdAt: string;
  updatedAt: string;
}

interface TwitterProfileData {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
}

const WalletPage: NextPage = () => {
  const [user, setUser] = useState<TwitterUser | null>(null);
  const [twitterProfile, setTwitterProfile] = useState<TwitterProfileData | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const fetchUserProfile = async (accessToken: string) => {
    try {
      const response = await fetch("/api/twitter/profile", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch profile");
      }

      if (data.user) {
        setUser(data.user);
      }
      if (data.twitterProfile) {
        setTwitterProfile(data.twitterProfile);
      }

      return data.user;
    } catch (err) {
      console.error("Profile fetch error:", err);
      return null;
    }
  };

  const createWalletIfNeeded = async (userId: string) => {
    setIsCreatingWallet(true);
    setWalletError(null);

    try {
      const response = await fetch("/api/wallet/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to create wallet");
      }

      console.log("Wallet created/exists:", data.data);
    } catch (err) {
      console.error("Wallet creation error:", err);
      setWalletError(err instanceof Error ? err.message : "Failed to create wallet");
    } finally {
      setIsCreatingWallet(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem("twitter_access_token");

      if (accessToken) {
        const userData = await fetchUserProfile(accessToken);
        if (userData) {
          await createWalletIfNeeded(userData.uid);
        }
      }

      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  const handleTwitterLogin = async () => {
    try {
      const response = await fetch("/api/twitter/oauth/url", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!data.success || !data.url) {
        throw new Error(data.message || "Failed to get Twitter OAuth URL");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Twitter login error:", err);
      setWalletError(err instanceof Error ? err.message : "Failed to initiate Twitter login");
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <span className="loading loading-spinner loading-lg"></span>
          <span className="text-lg">Loading wallet...</span>
        </div>
      </div>
    );
  }

  if (!user || !twitterProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold">💳 Your Wallet</h1>
            <p className="text-lg text-base-content/70">
              Connect your Twitter account to access your wallet
            </p>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title justify-center">Connect to Get Started</h2>
                <p className="text-center text-base-content/70">
                  You need to log in with Twitter to access your wallet and view your balance.
                </p>
                <div className="card-actions justify-center">
                  <button
                    onClick={handleTwitterLogin}
                    className="btn btn-primary flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span>Log in with X</span>
                  </button>
                </div>

                {walletError && (
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
                    <span>{walletError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isCreatingWallet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <span className="loading loading-spinner loading-lg"></span>
          <span className="text-lg">Setting up your wallet...</span>
          <span className="text-sm text-base-content/70">
            This may take a few seconds
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">💳 Your Wallet</h1>
          <p className="text-lg text-base-content/70">
            Manage your MON balance on Monad Testnet
          </p>
        </div>

        {/* User Info */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-3 bg-base-100 rounded-lg p-4 shadow-md">
            {twitterProfile.profile_image_url && (
              <img
                src={twitterProfile.profile_image_url}
                alt={twitterProfile.name || twitterProfile.username}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div>
              <h3 className="font-semibold">
                {twitterProfile.name || twitterProfile.username}
              </h3>
              <p className="text-sm text-base-content/70">@{twitterProfile.username}</p>
            </div>
          </div>
        </div>

        {/* Wallet Error */}
        {walletError && (
          <div className="max-w-2xl mx-auto mb-8">
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
              <span>{walletError}</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Balance Section */}
          <div className="space-y-6">
            <WalletBalance userId={user.uid} />
          </div>

          {/* Deposit Section */}
          <div className="space-y-6">
            <DepositQRCode userId={user.uid} />
          </div>
        </div>

        {/* Help Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">
                <span>❓ How to Use Your Wallet</span>
              </h2>
              <div className="space-y-4">
                <div className="steps steps-vertical lg:steps-horizontal">
                  <div className="step step-primary">
                    <div className="text-left">
                      <h4 className="font-semibold">Get MON Tokens</h4>
                      <p className="text-sm">Use the QR code or address to receive MON tokens on Monad Testnet</p>
                    </div>
                  </div>
                  <div className="step step-primary">
                    <div className="text-left">
                      <h4 className="font-semibold">Check Balance</h4>
                      <p className="text-sm">View your current balance and refresh to see new transactions</p>
                    </div>
                  </div>
                  <div className="step step-primary">
                    <div className="text-left">
                      <h4 className="font-semibold">Use for Betting</h4>
                      <p className="text-sm">Use your MON tokens to place bets in prediction markets</p>
                    </div>
                  </div>
                  <div className="step step-primary">
                    <div className="text-left">
                      <h4 className="font-semibold">Request Gas</h4>
                      <p className="text-sm">If your balance is low, request gas support for transactions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;