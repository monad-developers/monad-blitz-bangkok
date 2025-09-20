"use client";

import type { NextPage } from "next";
import { MiningComponent } from "~~/components/MiningComponent";

const Home: NextPage = () => {
  return (
    <>
      <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          <MiningComponent />
        </div>
      </div>
    </>
  );
};

export default Home;
