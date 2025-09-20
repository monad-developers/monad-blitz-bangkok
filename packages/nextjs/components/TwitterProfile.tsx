"use client";

import React, { useState, useEffect } from "react";

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

interface TwitterProfileResponse {
  success: boolean;
  user?: TwitterUser;
  twitterProfile?: TwitterProfileData;
  message?: string;
  error?: string;
}

export const TwitterProfile = () => {
  const [user, setUser] = useState<TwitterUser | null>(null);
  const [twitterProfile, setTwitterProfile] = useState<TwitterProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const accessToken = localStorage.getItem("twitter_access_token");

      if (!accessToken) {
        setIsLoading(false);
        return;
      }

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
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch profile");
        // Clear invalid token
        localStorage.removeItem("twitter_access_token");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("twitter_access_token");
    setUser(null);
    setTwitterProfile(null);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <span className="loading loading-spinner loading-sm"></span>
        <span>Loading profile...</span>
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  if (!user || !twitterProfile) {
    return null;
  }

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

      <button
        onClick={handleLogout}
        className="btn btn-outline btn-sm"
      >
        Logout
      </button>
    </div>
  );
};