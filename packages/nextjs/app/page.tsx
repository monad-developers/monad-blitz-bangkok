"use client";

import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { CreateReport } from "~~/components/WhoIsThis/CreateReport";
import { ReportsList } from "~~/components/WhoIsThis/ReportsList";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  const { data: withBalance } = useScaffoldReadContract({
    contractName: "WITH",
    functionName: "balanceOf",
    args: [connectedAddress || "0x0000000000000000000000000000000000000000"],
  });

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5 w-full max-w-7xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 text-white">Who Is This</h1>
            <p className="text-lg text-gray-300">Report and vote on suspicious activities</p>
            <p className="text-sm text-gray-300 mt-2">Earn WITH tokens for reporting and voting</p>
          </div>

          {connectedAddress && (
            <div className="flex justify-center items-center space-x-8 mb-8">
              <div className="text-center">
                <p className="text-sm text-gray-300">Your Address</p>
                <Address address={connectedAddress} />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-300">WITH Balance</p>
                <p className="text-2xl font-bold text-white">{withBalance ? formatEther(withBalance) : "0"} WITH</p>
              </div>
            </div>
          )}

          <CreateReport />
          <ReportsList />
        </div>
      </div>
    </>
  );
};

export default Home;
