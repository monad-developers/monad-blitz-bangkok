"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Types
export interface TwitterUser {
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

export interface TwitterProfileData {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
}

export interface WalletBalance {
  balance: string;
  balanceWei: string;
  needsGasSupport: boolean;
  address: string;
  chainId: number;
  chainName: string;
  symbol: string;
}

interface AuthContextType {
  // Auth state
  user: TwitterUser | null;
  twitterProfile: TwitterProfileData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Wallet state
  walletBalance: WalletBalance | null;
  isWalletLoading: boolean;
  walletError: string | null;

  // Auth methods
  login: () => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<boolean>;

  // Wallet methods
  refreshBalance: () => Promise<void>;
  requestGasSupport: () => Promise<boolean>;
  createWallet: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Auth state
  const [user, setUser] = useState<TwitterUser | null>(null);
  const [twitterProfile, setTwitterProfile] = useState<TwitterProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wallet state
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Fetch user profile from API
  const fetchUserProfile = async (accessToken: string): Promise<boolean> => {
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

      setError(null);
      return true;
    } catch (err) {
      console.error("Profile fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
      // Clear invalid token
      localStorage.removeItem("twitter_access_token");
      setUser(null);
      setTwitterProfile(null);
      return false;
    }
  };

  // Fetch wallet balance
  const fetchWalletBalance = async (userId: string): Promise<void> => {
    setIsWalletLoading(true);
    setWalletError(null);

    try {
      const response = await fetch(`/api/wallet/balance/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch wallet balance");
      }

      setWalletBalance(data.data);
    } catch (err) {
      console.error("Wallet balance fetch error:", err);
      setWalletError(err instanceof Error ? err.message : "Failed to fetch wallet balance");
    } finally {
      setIsWalletLoading(false);
    }
  };

  // Create wallet for user
  const createWallet = async (): Promise<boolean> => {
    if (!user) return false;

    setIsWalletLoading(true);
    setWalletError(null);

    try {
      const response = await fetch("/api/wallet/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.uid }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to create wallet");
      }

      // Refresh balance after wallet creation
      await fetchWalletBalance(user.uid);
      return true;
    } catch (err) {
      console.error("Wallet creation error:", err);
      setWalletError(err instanceof Error ? err.message : "Failed to create wallet");
      return false;
    } finally {
      setIsWalletLoading(false);
    }
  };

  // Request gas support
  const requestGasSupport = async (): Promise<boolean> => {
    if (!user) return false;

    setWalletError(null);

    try {
      const response = await fetch("/api/wallet/gas-support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.uid }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to request gas support");
      }

      // Refresh balance after gas support
      await fetchWalletBalance(user.uid);
      return true;
    } catch (err) {
      console.error("Gas support error:", err);
      setWalletError(err instanceof Error ? err.message : "Failed to request gas support");
      return false;
    }
  };

  // Login function
  const login = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/twitter/oauth/url", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!data.success || !data.url) {
        throw new Error(data.message || "Failed to get Twitter OAuth URL");
      }

      // Redirect to Twitter OAuth
      window.location.href = data.url;
    } catch (err) {
      console.error("Twitter login error:", err);
      setError(err instanceof Error ? err.message : "Failed to initiate Twitter login");
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = (): void => {
    localStorage.removeItem("twitter_access_token");
    setUser(null);
    setTwitterProfile(null);
    setWalletBalance(null);
    setError(null);
    setWalletError(null);
  };

  // Refresh profile
  const refreshProfile = async (): Promise<boolean> => {
    const accessToken = localStorage.getItem("twitter_access_token");
    if (!accessToken) return false;

    return await fetchUserProfile(accessToken);
  };

  // Refresh balance
  const refreshBalance = async (): Promise<void> => {
    if (!user) return;
    await fetchWalletBalance(user.uid);
  };

  // Check for existing auth token on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      setIsLoading(true);
      const accessToken = localStorage.getItem("twitter_access_token");

      if (accessToken) {
        await fetchUserProfile(accessToken);
      }

      setIsLoading(false);
    };

    checkExistingAuth();
  }, []);

  // Fetch wallet balance when user changes
  useEffect(() => {
    if (user && !walletBalance && !isWalletLoading) {
      fetchWalletBalance(user.uid);
    }
  }, [user]);

  const value: AuthContextType = {
    // Auth state
    user,
    twitterProfile,
    isAuthenticated: !!user && !!twitterProfile,
    isLoading,
    error,

    // Wallet state
    walletBalance,
    isWalletLoading,
    walletError,

    // Auth methods
    login,
    logout,
    refreshProfile,

    // Wallet methods
    refreshBalance,
    requestGasSupport,
    createWallet,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Helper hook for checking if user has sufficient balance for betting
export const useCanBet = (betAmount: string = "0.01"): boolean => {
  const { walletBalance } = useAuth();

  if (!walletBalance) return false;

  const balance = parseFloat(walletBalance.balance);
  const amount = parseFloat(betAmount);

  return balance >= amount;
};

// Helper hook for getting user's betting info
export const useBettingInfo = () => {
  const { user, walletBalance, isAuthenticated } = useAuth();

  return {
    canBet: isAuthenticated && walletBalance && parseFloat(walletBalance.balance) >= 0.01,
    needsGas: walletBalance?.needsGasSupport || false,
    userId: user?.uid,
    address: walletBalance?.address,
    balance: walletBalance?.balance || "0",
  };
};