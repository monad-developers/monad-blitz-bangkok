"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  const [user, setUser] = useState<TwitterUser | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setMessage(`OAuth error: ${error}`);
        return;
      }

      if (!code || !state) {
        setStatus("error");
        setMessage("Missing authorization code or state parameter");
        return;
      }

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

        setUser(data.user);
        setStatus("success");
        setMessage("Successfully logged in with Twitter!");

        // Redirect to home page after 2 seconds
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } catch (err) {
        console.error("Twitter callback error:", err);
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Twitter login failed");
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body text-center">
          {status === "loading" && (
            <>
              <span className="loading loading-spinner loading-lg"></span>
              <h2 className="card-title justify-center">Processing Twitter Login...</h2>
              <p>Please wait while we complete your authentication.</p>
            </>
          )}

          {status === "success" && user && (
            <>
              <div className="text-green-500 text-6xl mb-4">✓</div>
              <h2 className="card-title justify-center text-green-600">Login Successful!</h2>
              <div className="flex items-center space-x-3 justify-center mb-4">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || user.twitterUsername}
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div>
                  <p className="font-semibold">{user.displayName || user.twitterUsername}</p>
                  <p className="text-sm text-base-content/70">@{user.twitterUsername}</p>
                </div>
              </div>
              <p className="text-sm text-base-content/60 mb-4">{message}</p>
              <p className="text-xs text-base-content/50">Redirecting to home page...</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="text-red-500 text-6xl mb-4">✗</div>
              <h2 className="card-title justify-center text-red-600">Login Failed</h2>
              <p className="text-sm text-base-content/70 mb-4">{message}</p>
              <div className="card-actions justify-center">
                <button onClick={() => router.push("/")} className="btn btn-primary">
                  Return to Home
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
