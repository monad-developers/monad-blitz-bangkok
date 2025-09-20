"use client";

import React, { useEffect, useRef, useState } from "react";
import { AuthGuard } from "./AuthGuard";
import { BettingInterface } from "./BettingInterface";
import { PanInfo, motion, useAnimation } from "framer-motion";
import { useAuth } from "~~/hooks/useAuth";
import { BettingResult, Poll } from "~~/types/poll";

interface PollCardProps {
  poll: Poll;
  onSwipe: (direction: "left" | "right" | "skip") => void;
  onBetPlaced: (result: BettingResult) => void;
  isTop: boolean;
}

const PollCard: React.FC<PollCardProps> = ({ poll, onSwipe, onBetPlaced, isTop }) => {
  const controls = useAnimation();
  const constraintsRef = useRef(null);
  const [showBetting, setShowBetting] = useState(false);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 150;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (Math.abs(velocity) >= 500 || Math.abs(offset) >= threshold) {
      if (offset > 0) {
        // Swipe right - Yes
        controls.start({ x: 1000, rotate: 30, opacity: 0 });
        setTimeout(() => onSwipe("right"), 150);
      } else {
        // Swipe left - No
        controls.start({ x: -1000, rotate: -30, opacity: 0 });
        setTimeout(() => onSwipe("left"), 150);
      }
    } else {
      // Snap back to center
      controls.start({ x: 0, rotate: 0, opacity: 1 });
    }
  };

  const getYesPercentage = () => {
    if (poll.totalVotes === 0) return 0;
    return Math.round((poll.yesVotes / poll.totalVotes) * 100);
  };

  const getTimeRemaining = () => {
    if (!poll.expiresAt) return "No expiry";

    const now = new Date();
    const expiry = new Date(poll.expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h left`;
    }

    return `${hours}h ${minutes}m left`;
  };

  return (
    <motion.div
      ref={constraintsRef}
      className={`absolute inset-0 ${isTop ? "z-10" : "z-0"}`}
      initial={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.8 }}
      animate={controls}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={isTop ? handleDragEnd : undefined}
      whileDrag={{ rotate: 0 }}
      style={{ touchAction: "none" }}
    >
      <div
        className={`w-full h-full bg-base-100 rounded-xl shadow-lg border border-base-300 p-6 flex flex-col ${isTop ? "cursor-grab active:cursor-grabbing" : ""}`}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-primary text-primary-content text-xs rounded-full font-medium">
              {poll.category}
            </span>
            <span className="text-xs text-base-content/60">{getTimeRemaining()}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-base-content/60">
            <div className="flex items-center gap-1">
              <span>👍</span>
              <span>{poll.likes || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>👎</span>
              <span>{poll.dislikes || 0}</span>
            </div>
            <div>{poll.totalVotes} votes</div>
          </div>
        </div>

        {/* Poll Question */}
        <div className="flex-1 flex items-center justify-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-center leading-relaxed text-base-content">
            {poll.description}
          </h2>
        </div>

        {/* Verification Rule */}
        <div className="bg-info/10 dark:bg-info/20 rounded-lg p-3 mb-4 border border-info/20">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-info" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-info font-medium">Verification:</span>
          </div>
          <p className="text-sm text-base-content mt-1">{poll.verifierRule}</p>
        </div>

        {/* Market Results */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2 text-base-content">
            <span>Market Results</span>
            <span className="font-medium">
              {poll.odds ? `${poll.odds.yesPercentage}% Yes` : `${getYesPercentage()}% Yes`}
            </span>
          </div>
          <div className="w-full bg-base-300 rounded-full h-2">
            <div
              className="bg-success h-2 rounded-full transition-all duration-300"
              style={{
                width: `${poll.odds ? poll.odds.yesPercentage : getYesPercentage()}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-base-content/70 mt-1">
            <span>
              {poll.marketStats?.totalYesBets || poll.yesVotes} Yes
              {poll.marketStats && ` (${poll.marketStats.totalYesBets} MON)`}
            </span>
            <span>
              {poll.marketStats?.totalNoBets || poll.noVotes} No
              {poll.marketStats && ` (${poll.marketStats.totalNoBets} MON)`}
            </span>
          </div>
          {poll.odds && (
            <div className="flex justify-between text-xs text-info mt-1">
              <span>No: {poll.odds.noOdds.toFixed(2)}x odds</span>
              <span>Yes: {poll.odds.yesOdds.toFixed(2)}x odds</span>
            </div>
          )}
        </div>

        {/* Betting Interface */}
        {showBetting ? (
          <BettingInterface
            poll={poll}
            onBetPlaced={result => {
              onBetPlaced(result);
              setShowBetting(false);
            }}
            onBetCancel={() => setShowBetting(false)}
          />
        ) : (
          <div className="space-y-3">
            {/* Bet/Prediction Toggle */}
            <div className="flex gap-2">
              <button onClick={() => setShowBetting(true)} className="flex-1 btn btn-primary btn-sm" disabled={!isTop}>
                💰 Place Bet
              </button>
              <button onClick={() => onSwipe("skip")} className="btn btn-sm btn-ghost" disabled={!isTop}>
                Skip
              </button>
            </div>

            {/* Traditional Vote Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => onSwipe("left")}
                className="flex-1 btn btn-error btn-outline gap-2"
                disabled={!isTop}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Predict No
              </button>

              <button
                onClick={() => onSwipe("right")}
                className="flex-1 btn btn-success btn-outline gap-2"
                disabled={!isTop}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Predict Yes
              </button>
            </div>
          </div>
        )}

        {/* Swipe Indicators */}
        {isTop && (
          <>
            <motion.div
              className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-error text-error-content px-4 py-2 rounded-lg font-bold text-lg opacity-0 shadow-lg"
              animate={{ opacity: 0 }}
              id="no-indicator"
            >
              NO
            </motion.div>
            <motion.div
              className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-success text-success-content px-4 py-2 rounded-lg font-bold text-lg opacity-0 shadow-lg"
              animate={{ opacity: 0 }}
              id="yes-indicator"
            >
              YES
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
};

interface PollSwiperProps {
  selectedCategory?: string | null;
  refreshTrigger?: number;
}

export const PollSwiper: React.FC<PollSwiperProps> = ({ selectedCategory, refreshTrigger }) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch polls from API with market data
  const fetchPolls = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch polls with market data and user-specific betting info
      const queryParams = new URLSearchParams({
        limit: "50",
        includeMarketData: "true",
        ...(user ? { userId: user.uid } : {}),
      });

      const response = await fetch(`/api/polls?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setPolls(data.polls);
      } else {
        setError(data.message || "Failed to fetch polls");
      }
    } catch (error) {
      console.error("Error fetching polls:", error);
      setError("Failed to load polls");
    } finally {
      setIsLoading(false);
    }
  };

  // Load polls on component mount and when user/refreshTrigger changes
  useEffect(() => {
    fetchPolls();
  }, [user, refreshTrigger]);

  // Filter polls based on selected category
  const filteredPolls = React.useMemo(() => {
    if (!selectedCategory || selectedCategory === "All") {
      return polls;
    }
    if (selectedCategory === "Trending") {
      // For trending, show polls with highest vote counts
      return [...polls].sort((a, b) => b.totalVotes - a.totalVotes);
    }
    if (selectedCategory === "New") {
      // For new, show polls sorted by creation date (newest first)
      return [...polls].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    // Filter by specific category
    return polls.filter(poll => poll.category === selectedCategory);
  }, [polls, selectedCategory]);

  // Reset current index when category changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedCategory]);

  const handleSwipe = async (direction: "left" | "right" | "skip") => {
    const currentPoll = filteredPolls[currentIndex];

    console.log(`${direction.toUpperCase()} on poll:`, currentPoll.description);

    // Handle swipe-to-bet for left (No) and right (Yes)
    if ((direction === "left" || direction === "right") && user && currentPoll.marketAddress) {
      const betOnYes = direction === "right";

      try {
        // Check if user already bet on this poll
        if (currentPoll.userBets?.hasVoted) {
          alert(`You've already bet ${currentPoll.userBets.betOnYes ? "YES" : "NO"} on this poll!`);
          setCurrentIndex(prev => prev + 1);
          return;
        }

        // Place bet via API
        const response = await fetch(`/api/betting/poll/${currentPoll._id}/bet`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            betOnYes,
            userId: user.uid,
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Show success message
          const betDirection = betOnYes ? "YES" : "NO";
          alert(
            `🎉 Bet placed successfully!\n\n💰 ${betDirection} bet on "${currentPoll.description}"\n🔗 TX: ${result.txHash?.substring(0, 10)}...`,
          );

          // Refresh polls to update betting data
          fetchPolls();
        } else {
          alert(`❌ Bet failed: ${result.message}`);
        }
      } catch (error) {
        console.error("Swipe bet error:", error);
        alert(`❌ Error placing bet: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    // Handle like/dislike swipe actions for polls with Twitter posts
    if ((direction === "left" || direction === "right") && user && currentPoll.twitterPostId) {
      const action = direction === "right" ? "like" : "dislike";

      try {
        // Call swipe action API
        const response = await fetch("/api/polls/swipe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pollId: currentPoll._id,
            action,
            userId: user.uid,
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Show success message
          const actionText = action === "like" ? "liked" : "disliked";
          const twitterMessage = result.twitterReplyId
            ? `\n🐦 Replied to Twitter: ${result.twitterReplyId}`
            : "\n🐦 Twitter reply failed";

          alert(`👍 Successfully ${actionText} poll!${twitterMessage}`);

          // Refresh polls to update like/dislike counts
          fetchPolls();
        } else {
          alert(`❌ Failed to ${action} poll: ${result.message}`);
        }
      } catch (error) {
        console.error("Swipe action error:", error);
        alert(`❌ Error ${action}ing poll: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    // Move to next poll
    setCurrentIndex(prev => prev + 1);
  };

  const handleBetPlaced = (result: BettingResult) => {
    console.log("Bet placed:", result);

    // Refresh polls to update with new betting data
    fetchPolls();

    // Move to next poll after successful bet
    setCurrentIndex(prev => prev + 1);
  };

  const resetPolls = () => {
    setCurrentIndex(0);
  };

  // Show remaining polls (max 2 visible)
  const visiblePolls = filteredPolls.slice(currentIndex, currentIndex + 2);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
          <p className="text-base-content">Loading polls...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2 text-base-content">Error Loading Polls</h2>
          <p className="text-base-content/70 mb-4">{error}</p>
          <button onClick={fetchPolls} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No polls state
  if (polls.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold mb-2 text-base-content">No Polls Available</h2>
          <p className="text-base-content/70 mb-4">Create some polls to get started!</p>
          <button onClick={fetchPolls} className="btn btn-primary">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  if (currentIndex >= filteredPolls.length) {
    const categoryText = selectedCategory && selectedCategory !== "All" ? `in ${selectedCategory}` : "";

    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2 text-base-content">All caught up!</h2>
          <p className="text-base-content/70 mb-4">You've reviewed all available polls {categoryText}.</p>
          <button onClick={resetPolls} className="btn btn-primary">
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard requireWallet={true}>
      <div className="relative w-full h-full max-w-md mx-auto p-4">
        <div className="relative w-full h-[600px]">
          {visiblePolls.map((poll, index) => (
            <PollCard
              key={poll._id}
              poll={poll}
              onSwipe={handleSwipe}
              onBetPlaced={handleBetPlaced}
              isTop={index === 0}
            />
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center">
          <p className="text-sm text-base-content/70">
            💰 <span className="text-primary font-medium">Place bets</span>, make{" "}
            <span className="text-success font-medium">Yes</span>/<span className="text-error font-medium">No</span>{" "}
            predictions, or <span className="text-info font-medium">like</span>/
            <span className="text-warning font-medium">dislike</span> polls
          </p>
        </div>
      </div>
    </AuthGuard>
  );
};
