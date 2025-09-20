export interface User {
  _id?: string;
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  walletAddress?: string;
  // Twitter OAuth 2.0 fields
  twitterId?: string;
  twitterUsername?: string;
  twitterAccessToken?: string;
  twitterRefreshToken?: string;
  twitterTokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest {
  user: User;
}

export interface LoginRequest {
  accessToken: string;
  accessSecret: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  message?: string;
}

export interface VerifyTokenRequest {
  accessToken: string;
  accessSecret: string;
}

export interface VerifyTokenResponse {
  valid: boolean;
  user?: User;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}

export interface IPrivyWallet {
  _id?: string;
  userId: string;
  privyWalletId: string;
  address: string;
  chainType: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletEntity {
  id: string;
  userId: string;
  privyWalletId: string;
  address: string;
  chainType: string;
  createdAt: Date;
  updatedAt: Date;
}

// Twitter OAuth 2.0 types
export interface TwitterOAuthLoginRequest {
  code: string;
  state: string;
}

export interface TwitterOAuthLoginResponse {
  success: boolean;
  user: User;
  accessToken: string;
  message?: string;
}

export interface TwitterOAuthRefreshRequest {
  refreshToken: string;
}

export interface TwitterOAuthRefreshResponse {
  success: boolean;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  message?: string;
}

// Poll types
export interface Poll {
  _id?: string;
  description: string;
  category: string;
  verifierRule: string;
  createdBy: string; // User ID
  twitterPostId?: string;
  status: 'active' | 'closed' | 'draft';
  totalVotes: number;
  yesVotes: number;
  noVotes: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface CreatePollRequest {
  description: string;
  category?: string;
  verifierRule: string;
  expiresAt?: string; // ISO date string
}

export interface CreatePollResponse {
  success: boolean;
  poll?: Poll;
  twitterPostId?: string;
  message?: string;
}

export interface FetchPollsRequest {
  category?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface FetchPollsResponse {
  success: boolean;
  polls: Poll[];
  total: number;
  message?: string;
}

export interface CategoryListResponse {
  success: boolean;
  categories: string[];
  message?: string;
}
