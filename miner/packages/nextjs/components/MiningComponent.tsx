"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const MiningComponent = () => {
  const { address: connectedAddress } = useAccount();
  const [countdown, setCountdown] = useState<number>(0);
  const [isCounting, setIsCounting] = useState<boolean>(false);

  // Read contract data with polling for real-time updates
  const { data: isMiningStarted, refetch: refetchMiningStarted } = useScaffoldReadContract({
    contractName: "Miner",
    functionName: "isMiningStarted",
  });

  const { data: claimTime, refetch: refetchClaimTime } = useScaffoldReadContract({
    contractName: "Miner",
    functionName: "claimTime",
  });

  // Write contract functions
  const { writeContractAsync: writeMinerAsync } = useScaffoldWriteContract({
    contractName: "Miner",
  });

  // Polling effect to refresh contract data when mining is active
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isMiningStarted) {
      interval = setInterval(() => {
        refetchMiningStarted();
        refetchClaimTime();
      }, 1000); // Refresh every second
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isMiningStarted, refetchMiningStarted, refetchClaimTime]);

  // Countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isCounting && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setIsCounting(false);
            // Show reward alert when countdown ends
            showRewardAlert();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isCounting]); // Removed countdown dependency

  // Check if mining is started and set countdown
  useEffect(() => {
    if (isMiningStarted && claimTime) {
      const currentTime = Math.floor(Date.now() / 1000);
      const timeLeft = Number(claimTime) - currentTime;

      console.log("Mining started, claimTime:", claimTime, "currentTime:", currentTime, "timeLeft:", timeLeft);

      if (timeLeft > 0) {
        setCountdown(timeLeft);
        setIsCounting(true);
      } else {
        setCountdown(0);
        setIsCounting(false);
      }
    } else if (!isMiningStarted) {
      // Reset countdown when mining is not started
      setCountdown(0);
      setIsCounting(false);
    }
  }, [isMiningStarted, claimTime]);

  const handleStartMine = async () => {
    try {
      console.log("Starting mine...");
      await writeMinerAsync({
        functionName: "startMine",
      });
      console.log("Mine started successfully");
      // Refetch contract data to get updated state
      refetchMiningStarted();
      refetchClaimTime();
    } catch (error) {
      console.error("Error starting mine:", error);
    }
  };

  const handleCompleteMine = async () => {
    try {
      await writeMinerAsync({
        functionName: "completeMine",
      });
      setCountdown(0);
      setIsCounting(false);
      // Refetch contract data to get updated state
      refetchMiningStarted();
      refetchClaimTime();
    } catch (error) {
      console.error("Error completing mine:", error);
    }
  };

  const showRewardAlert = () => {
    // Generate random mock data
    const reward = Math.floor(Math.random() * 200) + 50; // 50-250
    const buyAmount = Math.floor(Math.random() * 1000) + 100; // 100-1100
    const buyPrice = (Math.random() * 0.5 + 0.1).toFixed(4); // 0.1-0.6
    const sellPrice = (Math.random() * 0.8 + 0.2).toFixed(4); // 0.2-1.0
    const profit = Math.floor(Math.random() * 500) + 100; // 100-600

    const alertMessage = `🎉 Mining Complete! 🎉

💰 Get Reward: +${reward} tokens

📈 Trading Summary:
• Bought ${buyAmount} tokens at $${buyPrice}
• Sold ${buyAmount} tokens at $${sellPrice}
• Profit: +$${profit}

💎 Total Earnings: +$${profit + reward}`;

    alert(alertMessage);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Monster Animation Component
  const MonsterAnimation = ({ state }: { state: "sleeping" | "mining" | "happy" | "locked" }) => {
    const getMonsterEmoji = () => {
      switch (state) {
        case "sleeping":
          return "😴";
        case "mining":
          return "⛏️";
        case "happy":
          return "🎉";
        case "locked":
          return "🔒";
        default:
          return "👾";
      }
    };

    const getAnimationClass = () => {
      switch (state) {
        case "sleeping":
          return "animate-pulse";
        case "mining":
          return "animate-bounce";
        case "happy":
          return "animate-bounce";
        case "locked":
          return "animate-pulse";
        default:
          return "";
      }
    };

    return <div className={`text-6xl sm:text-7xl lg:text-8xl ${getAnimationClass()}`}>{getMonsterEmoji()}</div>;
  };

  if (!connectedAddress) {
    return (
      <div className="flex flex-col bg-base-100 px-6 py-8 sm:px-10 sm:py-12 text-center items-center w-full max-w-sm sm:max-w-md lg:max-w-lg rounded-3xl shadow-lg">
        <div className="w-24 h-24 sm:w-28 sm:h-28 mb-6 sm:mb-8 flex items-center justify-center bg-warning/10 rounded-full">
          <MonsterAnimation state="locked" />
        </div>
        <p className="text-base sm:text-lg font-medium text-base-content/80">
          Please connect your wallet to start mining
        </p>
      </div>
    );
  }

  // Debug info
  console.log(
    "Current state - isMiningStarted:",
    isMiningStarted,
    "claimTime:",
    claimTime,
    "countdown:",
    countdown,
    "isCounting:",
    isCounting,
  );

  return (
    <div className="flex flex-col bg-base-100 px-6 py-8 sm:px-10 sm:py-12 text-center items-center w-full max-w-sm sm:max-w-md lg:max-w-lg rounded-3xl shadow-lg border border-base-300">
      {/* Monster Header */}
      <div className="mb-6 sm:mb-8">
        <div className="w-24 h-24 sm:w-28 sm:h-28 mb-4 sm:mb-6 mx-auto flex items-center justify-center bg-primary/10 rounded-full">
          {!isMiningStarted ? (
            <MonsterAnimation state="sleeping" />
          ) : isCounting ? (
            <MonsterAnimation state="mining" />
          ) : (
            <MonsterAnimation state="happy" />
          )}
        </div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-base-content">Mining Station</h2>
        <p className="text-sm sm:text-base text-base-content/60 mt-2">
          {!isMiningStarted
            ? "Wake up your mining monster!"
            : isCounting
              ? "Your monster is working hard!"
              : "Your monster found treasures!"}
        </p>
      </div>

      {/* Content */}
      <div className="w-full">
        {!isMiningStarted ? (
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-2 sm:space-y-3">
              <p className="text-base sm:text-lg text-base-content/80">Your monster is sleeping peacefully</p>
              <p className="text-xs sm:text-sm text-base-content/60">Wake it up to start mining for treasures!</p>
            </div>
            <button
              className="btn btn-primary btn-lg w-full sm:w-auto sm:px-8 sm:py-3 text-sm sm:text-base font-semibold"
              onClick={handleStartMine}
            >
              <span className="mr-2">👋</span>
              Wake Up Monster
            </button>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {isCounting ? (
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-base sm:text-lg text-base-content/80">Your monster is mining hard!</p>
                  <div className="flex items-center justify-center">
                    <div className="loading loading-spinner loading-md text-primary mr-3"></div>
                    <span className="text-sm text-base-content/60">Digging for treasures...</span>
                  </div>
                </div>

                {/* Countdown Display */}
                <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-6 sm:p-8">
                  <div className="text-4xl sm:text-5xl lg:text-6xl font-mono font-bold text-primary mb-2">
                    {formatTime(countdown)}
                  </div>
                  <p className="text-xs sm:text-sm text-base-content/60">Time remaining</p>
                </div>

                <div className="w-full bg-base-300 rounded-full h-2 sm:h-3">
                  <div
                    className="bg-primary h-2 sm:h-3 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${((10 - countdown) / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8">
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-base sm:text-lg text-success font-semibold">Your monster found treasures!</p>
                  <p className="text-xs sm:text-sm text-base-content/60">Time to collect the rewards</p>
                </div>
                <button
                  className="btn btn-success btn-lg w-full sm:w-auto sm:px-8 sm:py-3 text-sm sm:text-base font-semibold"
                  onClick={handleCompleteMine}
                >
                  <span className="mr-2">💎</span>
                  Collect Treasures
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
