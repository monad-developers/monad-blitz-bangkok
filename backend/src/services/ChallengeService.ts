import { Challenge, ChallengeDifficulty, MatchMode, TestCase } from '@monad-arena/shared';
import { logger } from '../utils/logger';

export class ChallengeService {
  private challenges: Map<string, Challenge> = new Map();

  async initialize(): Promise<void> {
    // Load predefined challenges
    this.loadDefaultChallenges();
    logger.info(`Loaded ${this.challenges.size} challenges`);
  }

  private loadDefaultChallenges(): void {
    const defaultChallenges: Challenge[] = [
      {
        id: 'two-sum',
        title: 'Two Sum',
        description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

Example:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].`,
        difficulty: ChallengeDifficulty.EASY,
        mode: MatchMode.SPEED_SOLVE,
        timeLimit: 300, // 5 minutes
        testCases: [
          {
            input: JSON.stringify({ nums: [2, 7, 11, 15], target: 9 }),
            expectedOutput: '[0,1]'
          },
          {
            input: JSON.stringify({ nums: [3, 2, 4], target: 6 }),
            expectedOutput: '[1,2]'
          },
          {
            input: JSON.stringify({ nums: [3, 3], target: 6 }),
            expectedOutput: '[0,1]'
          }
        ]
      },
      {
        id: 'reverse-string',
        title: 'Reverse String',
        description: `Write a function that reverses a string. The input string is given as an array of characters s.

You must do this by modifying the input array in-place with O(1) extra memory.

Example:
Input: s = ["h","e","l","l","o"]
Output: ["o","l","l","e","h"]`,
        difficulty: ChallengeDifficulty.EASY,
        mode: MatchMode.SPEED_SOLVE,
        timeLimit: 180, // 3 minutes
        testCases: [
          {
            input: JSON.stringify({ s: ['h', 'e', 'l', 'l', 'o'] }),
            expectedOutput: '["o","l","l","e","h"]'
          },
          {
            input: JSON.stringify({ s: ['H', 'a', 'n', 'n', 'a', 'h'] }),
            expectedOutput: '["h","a","n","n","a","H"]'
          }
        ]
      },
      {
        id: 'fibonacci',
        title: 'Fibonacci Number',
        description: `The Fibonacci numbers, commonly denoted F(n) form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1.

Given n, calculate F(n).

Example:
Input: n = 4
Output: 3
Explanation: F(4) = F(3) + F(2) = 2 + 1 = 3.`,
        difficulty: ChallengeDifficulty.MEDIUM,
        mode: MatchMode.OPTIMIZATION,
        timeLimit: 600, // 10 minutes
        testCases: [
          {
            input: JSON.stringify({ n: 2 }),
            expectedOutput: '1'
          },
          {
            input: JSON.stringify({ n: 3 }),
            expectedOutput: '2'
          },
          {
            input: JSON.stringify({ n: 4 }),
            expectedOutput: '3'
          },
          {
            input: JSON.stringify({ n: 10 }),
            expectedOutput: '55',
            hidden: true
          },
          {
            input: JSON.stringify({ n: 20 }),
            expectedOutput: '6765',
            hidden: true
          }
        ]
      },
      {
        id: 'gas-optimization',
        title: 'Gas Optimization Challenge',
        description: `Optimize the following Solidity contract to minimize gas consumption:

contract SimpleStorage {
    uint256[] public data;
    
    function store(uint256[] memory _data) public {
        for (uint i = 0; i < _data.length; i++) {
            data.push(_data[i]);
        }
    }
    
    function retrieve(uint index) public view returns (uint256) {
        return data[index];
    }
}

Your task is to reduce the gas cost of the store function while maintaining the same functionality.`,
        difficulty: ChallengeDifficulty.HARD,
        mode: MatchMode.OPTIMIZATION,
        timeLimit: 900, // 15 minutes
        testCases: [
          {
            input: JSON.stringify({ action: 'store', data: [1, 2, 3, 4, 5] }),
            expectedOutput: 'success'
          },
          {
            input: JSON.stringify({ action: 'retrieve', index: 2 }),
            expectedOutput: '3'
          }
        ]
      },
      {
        id: 'binary-search',
        title: 'Binary Search',
        description: `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.

Example:
Input: nums = [-1,0,3,5,9,12], target = 9
Output: 4
Explanation: 9 exists in nums and its index is 4`,
        difficulty: ChallengeDifficulty.MEDIUM,
        mode: MatchMode.SPEED_SOLVE,
        timeLimit: 480, // 8 minutes
        testCases: [
          {
            input: JSON.stringify({ nums: [-1, 0, 3, 5, 9, 12], target: 9 }),
            expectedOutput: '4'
          },
          {
            input: JSON.stringify({ nums: [-1, 0, 3, 5, 9, 12], target: 2 }),
            expectedOutput: '-1'
          },
          {
            input: JSON.stringify({ nums: [5], target: 5 }),
            expectedOutput: '0'
          }
        ]
      }
    ];

    // Store challenges
    for (const challenge of defaultChallenges) {
      this.challenges.set(challenge.id, challenge);
    }
  }

  getChallengeById(id: string): Challenge | null {
    return this.challenges.get(id) || null;
  }

  getRandomChallenge(
    difficulty?: ChallengeDifficulty,
    mode?: MatchMode
  ): Challenge | null {
    const filtered = Array.from(this.challenges.values()).filter(challenge => {
      if (difficulty && challenge.difficulty !== difficulty) return false;
      if (mode && challenge.mode !== mode) return false;
      return true;
    });

    if (filtered.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex];
  }

  getChallengesByDifficulty(difficulty: ChallengeDifficulty): Challenge[] {
    return Array.from(this.challenges.values()).filter(
      challenge => challenge.difficulty === difficulty
    );
  }

  getChallengesByMode(mode: MatchMode): Challenge[] {
    return Array.from(this.challenges.values()).filter(
      challenge => challenge.mode === mode
    );
  }

  getAllChallenges(): Challenge[] {
    return Array.from(this.challenges.values());
  }

  addCustomChallenge(challenge: Challenge): void {
    if (this.challenges.has(challenge.id)) {
      throw new Error(`Challenge with ID ${challenge.id} already exists`);
    }
    
    this.challenges.set(challenge.id, challenge);
    logger.info('Custom challenge added:', { id: challenge.id, title: challenge.title });
  }

  removeChallenge(id: string): boolean {
    const deleted = this.challenges.delete(id);
    if (deleted) {
      logger.info('Challenge removed:', { id });
    }
    return deleted;
  }

  getChallengeHash(challenge: Challenge): string {
    // Create a deterministic hash of the challenge for blockchain storage
    const content = JSON.stringify({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      testCases: challenge.testCases.map(tc => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput
      }))
    });
    
    // Simple hash function (in production, use a proper crypto hash)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(16);
  }

  getVisibleTestCases(challenge: Challenge): TestCase[] {
    return challenge.testCases.filter(tc => !tc.hidden);
  }

  getAllTestCases(challenge: Challenge): TestCase[] {
    return challenge.testCases;
  }
}