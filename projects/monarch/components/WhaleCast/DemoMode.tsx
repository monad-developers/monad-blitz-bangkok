"use client"

import { useState } from "react"
import { User } from "../../types"

// Demo mode that works without Redis
export function useDemoMode() {
  const [isDemoMode, setIsDemoMode] = useState(true)

  const demoUsers: User[] = [
    {
      fid: 201,
      username: "beam_eth",
      displayName: "Beam Nawapat",
      wallet: "0x1111aaaa2222bbbb3333cccc4444dddd5555eeee",
      verified: true,
      whale_score: 78,
      followers: 520,
      winrate_30d: 0.69,
      pnl_30d: 35.4
    },
    {
      fid: 202,
      username: "neuw_memes",
      displayName: "Neuw",
      wallet: "0x2222bbbb3333cccc4444dddd5555eeee6666ffff",
      verified: false,
      whale_score: 52,
      followers: 150,
      winrate_30d: 0.51,
      pnl_30d: 12.7
    },
    {
      fid: 203,
      username: "dome_trader",
      displayName: "Dome",
      wallet: "0x3333cccc4444dddd5555eeee6666ffff7777aaaa",
      verified: true,
      whale_score: 61,
      followers: 240,
      winrate_30d: 0.58,
      pnl_30d: 8.9
    },
    {
      fid: 204,
      username: "chai_degen",
      displayName: "Chai",
      wallet: "0x4444dddd5555eeee6666ffff7777aaaabbbbcccc",
      verified: false,
      whale_score: 34,
      followers: 90,
      winrate_30d: 0.37,
      pnl_30d: -25.1
    },
    {
      fid: 205,
      username: "fin_alpha",
      displayName: "Fin",
      wallet: "0x5555eeee6666ffff7777aaaabbbbcccc11112222",
      verified: true,
      whale_score: 70,
      followers: 310,
      winrate_30d: 0.63,
      pnl_30d: 28.6
    },
    {
      fid: 206,
      username: "thames_builder",
      displayName: "Thames",
      wallet: "0x6666ffff7777aaaabbbbcccc1111222233334444",
      verified: true,
      whale_score: 65,
      followers: 400,
      winrate_30d: 0.6,
      pnl_30d: 19.8
    },
    {
      fid: 207,
      username: "crypto_whale",
      displayName: "Crypto Whale",
      wallet: "0x7777aaaa8888bbbb9999cccc0000ddddeeee1111",
      verified: true,
      whale_score: 85,
      followers: 1200,
      winrate_30d: 0.72,
      pnl_30d: 45.2
    },
    {
      fid: 208,
      username: "meme_king",
      displayName: "Meme King",
      wallet: "0x8888bbbb9999cccc0000ddddeeee111122223333",
      verified: false,
      whale_score: 45,
      followers: 320,
      winrate_30d: 0.48,
      pnl_30d: -8.3
    }
  ]

  const demoUser = (fid: number) => {
    return demoUsers.find((user) => user.fid === fid) || demoUsers[0]
  }

  return {
    isDemoMode,
    setIsDemoMode,
    demoUsers,
    demoUser
  }
}
