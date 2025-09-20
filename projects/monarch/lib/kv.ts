import { MiniAppNotificationDetails } from "@farcaster/miniapp-sdk"
import { Redis } from "@upstash/redis"
import { User } from "../types"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
})

function getUserNotificationDetailsKey(fid: number): string {
  return `${fid}`
}

export async function getUserNotificationDetails(
  fid: number
): Promise<MiniAppNotificationDetails | null> {
  return await redis.get<MiniAppNotificationDetails>(
    getUserNotificationDetailsKey(fid)
  )
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: MiniAppNotificationDetails
): Promise<void> {
  await redis.set(getUserNotificationDetailsKey(fid), notificationDetails)
}

export async function deleteUserNotificationDetails(
  fid: number
): Promise<void> {
  await redis.del(getUserNotificationDetailsKey(fid))
}

// User data management functions
function getUserKey(fid: number): string {
  return `user:${fid}`
}

export async function getUser(fid: number): Promise<User | null> {
  return await redis.get<User>(getUserKey(fid))
}

export async function setUser(user: User): Promise<void> {
  await redis.set(getUserKey(user.fid), user)
}

export async function deleteUser(fid: number): Promise<void> {
  await redis.del(getUserKey(fid))
}

export async function getAllUsers(): Promise<User[]> {
  const keys = await redis.keys("user:*")
  if (keys.length === 0) return []

  const users = await redis.mget<User[]>(keys)
  return users.filter((user): user is User => user !== null)
}
