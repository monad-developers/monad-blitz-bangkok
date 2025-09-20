#!/usr/bin/env tsx

import { getAllUsers, getUser } from "../lib/kv"

async function main() {
  console.log("Verifying user data...\n")

  // Get all users
  const allUsers = await getAllUsers()
  console.log(`Total users found: ${allUsers.length}\n`)

  // Display all users
  for (const user of allUsers) {
    console.log(`User:${user.fid}`)
    console.log(`  Username: @${user.username}`)
    console.log(`  Display Name: ${user.displayName}`)
    console.log(`  Wallet: ${user.wallet}`)
    console.log(`  Verified: ${user.verified}`)
    console.log(`  Whale Score: ${user.whale_score}`)
    console.log(`  Followers: ${user.followers}`)
    console.log(`  Winrate (30d): ${(user.winrate_30d * 100).toFixed(1)}%`)
    console.log(`  PnL (30d): ${user.pnl_30d > 0 ? "+" : ""}${user.pnl_30d}%`)
    console.log()
  }

  // Test individual user retrieval
  console.log("Testing individual user retrieval:")
  const user201 = await getUser(201)
  if (user201) {
    console.log(
      `✅ User 201 found: ${user201.displayName} (@${user201.username})`
    )
  } else {
    console.log("❌ User 201 not found")
  }
}

main().catch(console.error)
