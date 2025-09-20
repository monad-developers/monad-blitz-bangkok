"use client";

import React, { useState } from "react";
import { CategoryTabs } from "~~/components/CategoryTabs";
import { PollSwiper } from "~~/components/PollSwiper";
import { useAuth } from "~~/hooks/useAuth";

export default function PollsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>("Trending");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const { user } = useAuth();

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
  };

  const handleCreateMockPoll = async () => {
    if (!user) {
      alert("Please log in to create a poll with betting market");
      return;
    }

    setIsCreatingPoll(true);

    try {
      // Step 1: Create the mock poll
      const pollResponse = await fetch("/api/polls/mock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const pollResult = await pollResponse.json();

      if (!pollResult.success) {
        throw new Error(pollResult.message || "Failed to create poll");
      }

      const pollId = pollResult.poll._id;
      console.log("Mock poll created:", pollResult.poll);

      // Step 2: Automatically create betting market for the new poll
      const marketResponse = await fetch(`/api/betting/poll/${pollId}/create-market`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.uid }),
      });

      const marketResult = await marketResponse.json();

      if (marketResult.success) {
        alert(
          `🎉 Poll & Market Created Successfully!\n\n` +
          `📊 Poll: "${pollResult.poll.description}"\n` +
          `💰 Market: ${marketResult.data.txHash.substring(0, 10)}...`
        );
        console.log("Market created:", marketResult);
      } else {
        // Poll was created but market failed
        alert(
          `📊 Poll created successfully!\n` +
          `⚠️ Market creation failed: ${marketResult.message}\n\n` +
          `You can try creating the market manually.`
        );
        console.error("Market creation failed:", marketResult.message);
      }

      // Trigger refresh of polls
      setRefreshTrigger(prev => prev + 1);

    } catch (error) {
      console.error("Error creating poll and market:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Failed to create poll and market"}`);
    } finally {
      setIsCreatingPoll(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Category Navigation Tabs */}
      <CategoryTabs onCategoryChange={handleCategoryChange} />

      {/* Poll Swiper Interface */}
      <div className="flex-1 bg-base-200">
        <PollSwiper selectedCategory={selectedCategory} refreshTrigger={refreshTrigger} />
      </div>

      {/* Floating Create Poll + Market Button */}
      <button
        onClick={handleCreateMockPoll}
        disabled={isCreatingPoll}
        className="fixed bottom-6 right-6 btn btn-circle btn-primary btn-lg shadow-lg hover:shadow-xl transition-all duration-200 z-50"
        title={isCreatingPoll ? "Creating poll and market..." : "Create poll with betting market"}
      >
        {isCreatingPoll ? (
          <span className="loading loading-spinner loading-md"></span>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )}
      </button>
    </div>
  );
}