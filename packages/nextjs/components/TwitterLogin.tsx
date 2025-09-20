"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface TwitterOAuthResponse {
  success: boolean;
  url?: string;
  state?: string;
  message?: string;
  error?: string;
}

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

export const TwitterLogin = () => {
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

  const handleTwitterCallback = async (code: string, state: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/twitter/oauth/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ code, state }),
      });

      const data: TwitterLoginResponse = await response.json();

      if (!data.success || !data.user || !data.accessToken) {
        throw new Error(data.message || "Twitter login failed");
      }

      // Store access token in localStorage
      localStorage.setItem("twitter_access_token", data.accessToken);

      // Fetch fresh profile data
      await fetchUserProfile(data.accessToken);

      console.log("Twitter login successful:", data.user);

      // You can redirect or update UI here
      // router.push("/dashboard");
    } catch (err) {
      console.error("Twitter callback error:", err);
      setError(err instanceof Error ? err.message : "Twitter login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing access token on component mount
  React.useEffect(() => {
    const checkExistingToken = async () => {
      const accessToken = localStorage.getItem("twitter_access_token");

      if (accessToken) {
        await fetchUserProfile(accessToken);
      }

      setIsCheckingToken(false);
    };

    checkExistingToken();
  }, []);

  // Check for OAuth callback parameters
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");

    if (code && state) {
      handleTwitterCallback(code, state);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("twitter_access_token");
    setUser(null);
    setTwitterProfile(null);
    setError(null);
  };

  if (isCheckingToken) {
    return (
      <div className="flex items-center space-x-2">
        <span className="loading loading-spinner loading-sm"></span>
        <span>Loading profile...</span>
      </div>
    );
  }

  if (user && twitterProfile) {
    return (
      <div className="flex flex-col items-center space-y-4 p-6 bg-base-100 rounded-lg shadow-lg">
        <div className="flex items-center space-x-3">
          {twitterProfile.profile_image_url && (
            <img
              src={twitterProfile.profile_image_url}
              alt={twitterProfile.name || twitterProfile.username}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div>
            <h3 className="text-lg font-semibold">
              {twitterProfile.name || twitterProfile.username}
            </h3>
            <p className="text-sm text-base-content/70">@{twitterProfile.username}</p>
          </div>
        </div>
        <div className="text-sm text-base-content/60 space-y-1">
          <p>User ID: {user.uid}</p>
          <p>Twitter ID: {twitterProfile.id}</p>
          {user.walletAddress && <p>Wallet: {user.walletAddress}</p>}
          <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
        <button onClick={handleLogout} className="btn btn-outline btn-sm">
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <button onClick={handleTwitterLogin} disabled={isLoading} className="btn btn-primary flex items-center space-x-2">
        {isLoading ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>Log in with X</span>
          </>
        )}
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
  );
};
