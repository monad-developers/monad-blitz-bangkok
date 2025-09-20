"use client";

import React, { ReactNode } from "react";
import { useAuth } from "~~/hooks/useAuth";

interface AuthGuardProps {
  children: ReactNode;
  requireWallet?: boolean;
  fallback?: ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireWallet = false,
  fallback
}) => {
  const {
    isAuthenticated,
    isLoading,
    error,
    login,
    walletBalance,
    isWalletLoading,
    walletError,
    createWallet,
    requestGasSupport
  } = useAuth();

  // Show loading state
  if (isLoading || (requireWallet && isWalletLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <span className="loading loading-spinner loading-lg"></span>
          <span className="text-lg">
            {isLoading ? "Checking authentication..." : "Loading wallet..."}
          </span>
        </div>
      </div>
    );
  }

  // Show custom fallback if provided and not authenticated
  if (!isAuthenticated && fallback) {
    return <>{fallback}</>;
  }

  // Show authentication required screen
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-3xl font-bold">Authentication Required</h1>
            <p className="text-lg text-base-content/70">
              You need to log in with Twitter to access prediction markets and place bets.
            </p>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title justify-center">Connect Your Account</h2>
                <div className="space-y-4">
                  <div className="bg-info/10 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">What you'll get:</h3>
                    <ul className="text-sm space-y-2 text-left">
                      <li className="flex items-center gap-2">
                        <span className="text-success">✓</span>
                        Access to prediction markets
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-success">✓</span>
                        Secure wallet for MON tokens
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-success">✓</span>
                        Place bets and earn rewards
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-success">✓</span>
                        Free gas for transactions
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={login}
                    className="btn btn-primary btn-lg w-full flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span>Continue with X (Twitter)</span>
                  </button>

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
                </div>
              </div>
            </div>

            <div className="text-sm text-base-content/60">
              <p>
                We'll create a secure wallet for you automatically. Your Twitter account is only used for
                authentication and will not be used to post anything.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show wallet setup screen if wallet is required but doesn't exist
  if (requireWallet && !walletBalance && !isWalletLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">💳</div>
            <h1 className="text-3xl font-bold">Wallet Setup Required</h1>
            <p className="text-lg text-base-content/70">
              We need to set up your wallet to enable betting on prediction markets.
            </p>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title justify-center">Create Your Wallet</h2>
                <div className="space-y-4">
                  <div className="bg-info/10 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Wallet Features:</h3>
                    <ul className="text-sm space-y-2 text-left">
                      <li className="flex items-center gap-2">
                        <span className="text-success">✓</span>
                        Secure blockchain wallet
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-success">✓</span>
                        Auto-funded with gas tokens
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-success">✓</span>
                        Ready for MON token betting
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-success">✓</span>
                        Managed by Privy (secure)
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={createWallet}
                    className="btn btn-primary btn-lg w-full flex items-center justify-center gap-2"
                    disabled={isWalletLoading}
                  >
                    {isWalletLoading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        <span>Creating wallet...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                        </svg>
                        <span>Create Wallet</span>
                      </>
                    )}
                  </button>

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
      </div>
    );
  }

  // Show low balance warning if wallet exists but needs gas
  if (requireWallet && walletBalance?.needsGasSupport) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">⛽</div>
            <h1 className="text-3xl font-bold">Gas Support Needed</h1>
            <p className="text-lg text-base-content/70">
              Your wallet needs gas tokens to make transactions on the blockchain.
            </p>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title justify-center">Request Free Gas</h2>
                <div className="space-y-4">
                  <div className="stats shadow">
                    <div className="stat">
                      <div className="stat-title">Current Balance</div>
                      <div className="stat-value text-lg">{walletBalance.balance} MON</div>
                      <div className="stat-desc">Insufficient for transactions</div>
                    </div>
                  </div>

                  <button
                    onClick={requestGasSupport}
                    className="btn btn-warning btn-lg w-full flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12l9-9 9 9" />
                      <path d="M12 3v18" />
                    </svg>
                    <span>Request Free Gas</span>
                  </button>

                  <button
                    onClick={() => window.location.reload()}
                    className="btn btn-ghost btn-sm"
                  >
                    Skip (check later)
                  </button>

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
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
};