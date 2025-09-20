export interface Player {
    address: string;
    username?: string;
    elo: number;
    totalMatches: number;
    wins: number;
    losses: number;
    winStreak: number;
    badges: string[];
}
export interface Match {
    id: string;
    creator: string;
    opponent?: string;
    mode: MatchMode;
    stakeAmount: string;
    challengeHash: string;
    status: MatchStatus;
    winner?: string;
    createdAt: number;
    resolvedAt?: number;
    timeLimit: number;
}
export declare enum MatchMode {
    SPEED_SOLVE = "SPEED_SOLVE",
    OPTIMIZATION = "OPTIMIZATION",
    CTF = "CTF"
}
export declare enum MatchStatus {
    CREATED = "CREATED",
    JOINED = "JOINED",
    IN_PROGRESS = "IN_PROGRESS",
    PENDING_RESOLUTION = "PENDING_RESOLUTION",
    RESOLVED = "RESOLVED",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED"
}
export interface Challenge {
    id: string;
    title: string;
    description: string;
    difficulty: ChallengeDifficulty;
    mode: MatchMode;
    testCases: TestCase[];
    timeLimit: number;
    ipfsHash?: string;
}
export declare enum ChallengeDifficulty {
    EASY = "EASY",
    MEDIUM = "MEDIUM",
    HARD = "HARD"
}
export interface TestCase {
    input: string;
    expectedOutput: string;
    hidden?: boolean;
}
export interface Submission {
    playerId: string;
    matchId: string;
    code: string;
    language: string;
    submittedAt: number;
}
export interface JudgeResult {
    success: boolean;
    runtime?: number;
    gasUsed?: number;
    testResults: TestResult[];
    error?: string;
}
export interface TestResult {
    passed: boolean;
    runtime: number;
    output?: string;
    error?: string;
}
export interface Badge {
    id: string;
    name: string;
    description: string;
    imageUri: string;
    rarity: BadgeRarity;
    condition: string;
}
export declare enum BadgeRarity {
    COMMON = "COMMON",
    RARE = "RARE",
    EPIC = "EPIC",
    LEGENDARY = "LEGENDARY"
}
export interface LeaderboardEntry {
    rank: number;
    player: Player;
    eloChange?: number;
}
export interface MatchResolution {
    matchId: string;
    winner: string;
    loser: string;
    winnerResult: JudgeResult;
    loserResult: JudgeResult;
    timestamp: number;
    signature: string;
}
//# sourceMappingURL=index.d.ts.map