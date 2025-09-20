import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { Submission, JudgeResult, TestResult, Challenge } from '@monad-arena/shared';

export class JudgeService {
  private readonly sandboxDir: string;
  private readonly timeoutMs: number;

  constructor() {
    this.sandboxDir = path.join(__dirname, '../sandbox');
    this.timeoutMs = 10000; // 10 seconds per test
    this.ensureSandboxDir();
  }

  private async ensureSandboxDir(): Promise<void> {
    try {
      await fs.mkdir(this.sandboxDir, { recursive: true });
      await fs.mkdir(path.join(this.sandboxDir, 'temp'), { recursive: true });
    } catch (error) {
      logger.error('Failed to create sandbox directory:', error);
    }
  }

  async judgeSubmission(
    submission: Submission,
    challenge: Challenge
  ): Promise<JudgeResult> {
    const startTime = Date.now();
    const sessionId = uuidv4();
    
    logger.info('Starting judgment:', {
      sessionId,
      player: submission.playerId,
      match: submission.matchId,
      language: submission.language
    });

    try {
      // Create temporary directory for this session
      const tempDir = path.join(this.sandboxDir, 'temp', sessionId);
      await fs.mkdir(tempDir, { recursive: true });

      // Write code to file
      const codeFile = await this.writeCodeFile(tempDir, submission.code, submission.language);
      
      // Run test cases
      const testResults: TestResult[] = [];
      let totalRuntime = 0;
      let allPassed = true;

      for (let i = 0; i < challenge.testCases.length; i++) {
        const testCase = challenge.testCases[i];
        const testResult = await this.runTestCase(
          codeFile,
          testCase.input,
          testCase.expectedOutput,
          submission.language
        );
        
        testResults.push(testResult);
        totalRuntime += testResult.runtime;
        
        if (!testResult.passed) {
          allPassed = false;
        }
      }

      // Clean up
      await this.cleanup(tempDir);

      const result: JudgeResult = {
        success: allPassed,
        runtime: totalRuntime,
        testResults
      };

      logger.info('Judgment completed:', {
        sessionId,
        success: allPassed,
        runtime: totalRuntime,
        testsPassed: testResults.filter(t => t.passed).length,
        totalTests: testResults.length,
        duration: Date.now() - startTime
      });

      return result;

    } catch (error) {
      logger.error('Judgment failed:', { sessionId, error });
      
      return {
        success: false,
        testResults: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async writeCodeFile(
    tempDir: string,
    code: string,
    language: string
  ): Promise<string> {
    const extension = this.getFileExtension(language);
    const filename = `solution.${extension}`;
    const filePath = path.join(tempDir, filename);
    
    await fs.writeFile(filePath, code, 'utf8');
    return filePath;
  }

  private getFileExtension(language: string): string {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return 'js';
      case 'python':
      case 'py':
        return 'py';
      case 'java':
        return 'java';
      case 'cpp':
      case 'c++':
        return 'cpp';
      case 'c':
        return 'c';
      case 'go':
        return 'go';
      case 'rust':
        return 'rs';
      default:
        return 'txt';
    }
  }

  private async runTestCase(
    codeFile: string,
    input: string,
    expectedOutput: string,
    language: string
  ): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await this.executeCode(codeFile, input, language);
      const runtime = Date.now() - startTime;
      
      const output = stdout.trim();
      const expected = expectedOutput.trim();
      const passed = output === expected;

      return {
        passed,
        runtime,
        output: stdout,
        error: stderr || undefined
      };

    } catch (error) {
      return {
        passed: false,
        runtime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Execution failed'
      };
    }
  }

  private executeCode(
    codeFile: string,
    input: string,
    language: string
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const { command, args } = this.getExecutionCommand(codeFile, language);
      
      logger.debug('Executing code:', { command, args, codeFile });

      const process = spawn(command, args, {
        timeout: this.timeoutMs,
        cwd: path.dirname(codeFile)
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Send input to process
      if (input) {
        process.stdin.write(input);
        process.stdin.end();
      } else {
        process.stdin.end();
      }

      process.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Process exited with code ${code}: ${stderr}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });

      // Handle timeout
      setTimeout(() => {
        if (!process.killed) {
          process.kill('SIGKILL');
          reject(new Error('Execution timeout'));
        }
      }, this.timeoutMs);
    });
  }

  private getExecutionCommand(codeFile: string, language: string): { command: string; args: string[] } {
    const filename = path.basename(codeFile);
    const dir = path.dirname(codeFile);

    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return { command: 'node', args: [filename] };
      
      case 'python':
      case 'py':
        return { command: 'python3', args: [filename] };
      
      case 'java':
        // Compile first, then run
        const className = filename.replace('.java', '');
        return { command: 'java', args: [className] };
      
      case 'cpp':
      case 'c++':
        // Would need compilation step
        return { command: './solution', args: [] };
      
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  private async cleanup(tempDir: string): Promise<void> {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      logger.warn('Failed to cleanup temp directory:', { tempDir, error });
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Test basic execution capabilities
      const testCode = 'console.log("Hello, World!");';
      const tempDir = path.join(this.sandboxDir, 'temp', 'health-check');
      
      await fs.mkdir(tempDir, { recursive: true });
      const codeFile = path.join(tempDir, 'test.js');
      await fs.writeFile(codeFile, testCode);
      
      const result = await this.executeCode(codeFile, '', 'javascript');
      await this.cleanup(tempDir);
      
      return result.stdout.trim() === 'Hello, World!';
      
    } catch (error) {
      logger.error('Judge service health check failed:', error);
      return false;
    }
  }
}