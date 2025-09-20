export interface SafeAreaInsets {
  top?: number
  bottom?: number
  left?: number
  right?: number
}

export interface User {
  fid: number
  username: string
  displayName: string
  wallet: string
  verified: boolean
  whale_score: number
  followers: number
  winrate_30d: number
  pnl_30d: number
}
