"use client";

import { useCallback, useEffect, useState } from "react";
import { ReportCard } from "./ReportCard";
import { useAccount, usePublicClient } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface Report {
  id: bigint;
  title: string;
  good: bigint;
  bad: bigint;
  voters: readonly `0x${string}`[];
  voterCount: bigint;
  reporter: string;
  reporterClaimed: boolean;
  voterClaimed?: boolean;
}

export const ReportsList = () => {
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();
  const [reports, setReports] = useState<Report[]>([]);

  const { data: reportCount } = useScaffoldReadContract({
    contractName: "WhoIsThis",
    functionName: "getReportCount",
  });

  const { writeContractAsync: vote } = useScaffoldWriteContract({
    contractName: "WhoIsThis",
  });

  const { writeContractAsync: claimReporterReward } = useScaffoldWriteContract({
    contractName: "WhoIsThis",
  });

  const { writeContractAsync: claimVoterReward } = useScaffoldWriteContract({
    contractName: "WhoIsThis",
  });

  const loadReports = useCallback(async () => {
    if (!reportCount || !publicClient || !connectedAddress) return;

    const count = Number(reportCount);
    const loadedReports: Report[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const contractABI = [
          {
            inputs: [{ internalType: "uint256", name: "_reportId", type: "uint256" }],
            name: "getReport",
            outputs: [
              { internalType: "uint256", name: "id", type: "uint256" },
              { internalType: "string", name: "title", type: "string" },
              { internalType: "uint256", name: "good", type: "uint256" },
              { internalType: "uint256", name: "bad", type: "uint256" },
              { internalType: "address[]", name: "voters", type: "address[]" },
              { internalType: "uint256", name: "voterCount", type: "uint256" },
              { internalType: "address", name: "reporter", type: "address" },
              { internalType: "bool", name: "reporterClaimed", type: "bool" },
            ],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [
              { internalType: "uint256", name: "_reportId", type: "uint256" },
              { internalType: "address", name: "_voter", type: "address" },
            ],
            name: "hasVoterClaimed",
            outputs: [{ internalType: "bool", name: "", type: "bool" }],
            stateMutability: "view",
            type: "function",
          },
        ];

        const reportData = (await publicClient.readContract({
          address: "0xA0EB6dfEc8b60c5CC68D599c6DFDD8BbD797cF35",
          abi: contractABI,
          functionName: "getReport",
          args: [BigInt(i)],
        })) as readonly [bigint, string, bigint, bigint, readonly `0x${string}`[], bigint, string, boolean];

        const hasVoterClaimed = (await publicClient.readContract({
          address: "0xA0EB6dfEc8b60c5CC68D599c6DFDD8BbD797cF35",
          abi: contractABI,
          functionName: "hasVoterClaimed",
          args: [BigInt(i), connectedAddress],
        })) as boolean;

        if (reportData) {
          loadedReports.push({
            id: reportData[0],
            title: reportData[1],
            good: reportData[2],
            bad: reportData[3],
            voters: reportData[4],
            voterCount: reportData[5],
            reporter: reportData[6],
            reporterClaimed: reportData[7],
            voterClaimed: hasVoterClaimed,
          });
        }
      } catch (error) {
        console.error(`Error loading report ${i}:`, error);
      }
    }

    setReports(loadedReports);
  }, [reportCount, publicClient, connectedAddress]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleVote = async (reportId: number, isGood: boolean) => {
    try {
      await vote({ functionName: "vote", args: [BigInt(reportId), isGood] });
      // Refetch reports after successful vote
      await loadReports();
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const handleClaimReporterReward = async (reportId: number) => {
    try {
      await claimReporterReward({ functionName: "claimReporterReward", args: [BigInt(reportId)] });
      // Refetch reports after successful claim
      await loadReports();
    } catch (error) {
      console.error("Error claiming reporter reward:", error);
    }
  };

  const handleClaimVoterReward = async (reportId: number) => {
    try {
      await claimVoterReward({ functionName: "claimVoterReward", args: [BigInt(reportId)] });
      // Refetch reports after successful claim
      await loadReports();
    } catch (error) {
      console.error("Error claiming voter reward:", error);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">All Reports</h2>
      {reports.length === 0 ? (
        <p className="text-center text-gray-600">No reports yet. Be the first to create one!</p>
      ) : (
        reports.map(report => {
          const reportId = Number(report.id);
          const hasVoted = connectedAddress ? report.voters.includes(connectedAddress as `0x${string}`) : false;
          const isReporter = connectedAddress === report.reporter;
          const canClaimReporter = isReporter && Number(report.voterCount) >= 2 && !report.reporterClaimed;
          const canClaimVoter = hasVoted && Number(report.voterCount) >= 2 && !report.voterClaimed;

          return (
            <ReportCard
              key={reportId}
              reportId={reportId}
              title={report.title}
              good={report.good}
              bad={report.bad}
              reporter={report.reporter}
              voterCount={report.voterCount}
              voters={report.voters}
              hasVoted={hasVoted}
              canClaimReporter={canClaimReporter}
              canClaimVoter={canClaimVoter}
              voterClaimed={report.voterClaimed}
              connectedAddress={connectedAddress}
              onVote={handleVote}
              onClaimReporter={handleClaimReporterReward}
              onClaimVoter={handleClaimVoterReward}
            />
          );
        })
      )}
    </div>
  );
};
