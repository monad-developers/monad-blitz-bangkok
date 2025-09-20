import { config } from "../config/env";

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = this.getLogLevel(config.logLevel);
  }

  private getLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case "error":
        return LogLevel.ERROR;
      case "warn":
        return LogLevel.WARN;
      case "info":
        return LogLevel.INFO;
      case "debug":
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? " " + args.map(arg => 
      typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(" ") : "";
    
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage("error", message, ...args));
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage("warn", message, ...args));
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage("info", message, ...args));
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage("debug", message, ...args));
    }
  }

  // Specialized logging methods for Twitter bot
  mentionReceived(tweetId: string, authorId: string, text: string): void {
    this.info(`📨 Mention received: ${tweetId} from ${authorId}: ${text}`);
  }

  tweetPosted(tweetId: string, text: string): void {
    this.info(`🐦 Tweet posted: ${tweetId} - ${text.substring(0, 50)}...`);
  }

  replyPosted(tweetId: string, replyToId: string, text: string): void {
    this.info(`💬 Reply posted: ${tweetId} to ${replyToId} - ${text.substring(0, 50)}...`);
  }
}

export const logger = new Logger();
