"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

interface TwitterOAuthResponse {
  success: boolean;
  url?: string;
  state?: string;
  message?: string;
  error?: string;
}

interface TwitterLoginResponse {
  success: boolean;
  user?: TwitterUser;
  accessToken?: string;
  message?: string;
  error?: string;
}

interface TwitterProfileData {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
}

interface TwitterProfileResponse {
  success: boolean;
  user?: TwitterUser;
  twitterProfile?: TwitterProfileData;
  message?: string;
  error?: string;
}

export const TwitterNavAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<TwitterUser | null>(null);
  const [twitterProfile, setTwitterProfile] = useState<TwitterProfileData | null>(null);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const router = useRouter();

  const fetchUserProfile = async (accessToken: string) => {
    try {
      const response = await fetch("/api/twitter/profile", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const data: TwitterProfileResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch profile");
      }

      if (data.user) {
        setUser(data.user);
      }
      if (data.twitterProfile) {
        setTwitterProfile(data.twitterProfile);
      }

      return true;
    } catch (err) {
      console.error("Profile fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
      // Clear invalid token
      localStorage.removeItem("twitter_access_token");
      return false;
    }
  };

  const handleTwitterLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get OAuth URL from backend
      const response = await fetch("/api/twitter/oauth/url", {
        method: "GET",
        credentials: "include",
      });

      const data: TwitterOAuthResponse = await response.json();

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

  const handleLogout = () => {
    localStorage.removeItem("twitter_access_token");
    setUser(null);
    setTwitterProfile(null);
    setError(null);
  };

  // Check for existing access token on component mount
  useEffect(() => {
    const checkExistingToken = async () => {
      const accessToken = localStorage.getItem("twitter_access_token");

      if (accessToken) {
        await fetchUserProfile(accessToken);
      }

      setIsCheckingToken(false);
    };

    checkExistingToken();
  }, []);

  if (isCheckingToken) {
    return (
      <div className="flex items-center">
        <span className="loading loading-spinner loading-sm"></span>
      </div>
    );
  }

  if (user && twitterProfile) {
    return (
      <div className="dropdown dropdown-end">
        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
          <div className="w-8 rounded-full">
            {twitterProfile.profile_image_url ? (
              <img
                src={twitterProfile.profile_image_url}
                alt={twitterProfile.name || twitterProfile.username}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-xs font-bold text-primary-content">
                  {(twitterProfile.name || twitterProfile.username).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
        <ul
          tabIndex={0}
          className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-64 p-2 shadow"
        >
          <li className="menu-title">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Twitter Profile
            </span>
          </li>
          <li>
            <div className="flex flex-col gap-1 py-2">
              <div className="font-semibold text-sm">
                {twitterProfile.name || twitterProfile.username}
              </div>
              <div className="text-xs text-base-content/70">
                @{twitterProfile.username}
              </div>
              <div className="text-xs text-base-content/60">
                User ID: {user.uid}
              </div>
              {user.walletAddress && (
                <div className="text-xs text-base-content/60">
                  Wallet: {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                </div>
              )}
            </div>
          </li>
          <li><hr /></li>
          <li>
            <button onClick={handleLogout} className="text-error">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </li>
        </ul>
        {error && (
          <div className="toast toast-top toast-end">
            <div className="alert alert-error">
              <span className="text-xs">{error}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleTwitterLogin}
      disabled={isLoading}
      className="btn btn-primary btn-sm flex items-center gap-2"
    >
      {isLoading ? (
        <span className="loading loading-spinner loading-xs"></span>
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )}
      <span className="hidden sm:inline">Login with X</span>
      <span className="sm:hidden">Login</span>
    </button>
  );
};