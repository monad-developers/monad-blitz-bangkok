"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export const CreateReport = () => {
  const { address: connectedAddress } = useAccount();
  const [newReportTitle, setNewReportTitle] = useState("");

  const { writeContractAsync: createReport, isMining: isCreatingReport } = useScaffoldWriteContract({
    contractName: "WhoIsThis",
  });

  const handleCreateReport = async () => {
    if (!newReportTitle.trim()) {
      alert("Please enter a report title");
      return;
    }

    try {
      await createReport({ functionName: "report", args: [newReportTitle] });
      setNewReportTitle("");
      window.location.reload();
    } catch (error) {
      console.error("Error creating report:", error);
    }
  };

  return (
    <div className="bg-base-200 rounded-xl p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4">Create New Report</h2>
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Enter report title..."
          className="input input-bordered flex-1"
          value={newReportTitle}
          onChange={e => setNewReportTitle(e.target.value)}
          disabled={!connectedAddress}
        />
        <button
          className="btn btn-primary"
          onClick={handleCreateReport}
          disabled={!connectedAddress || isCreatingReport}
        >
          {isCreatingReport ? "Creating..." : "Create Report"}
        </button>
      </div>
      {!connectedAddress && <p className="text-sm text-gray-600 mt-2">Connect wallet to create reports</p>}
    </div>
  );
};
