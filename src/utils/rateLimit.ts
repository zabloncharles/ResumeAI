/**
 * Client-side rate limiting utilities
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastRequest: number;
}

export class RateLimiter {
  private static instance: RateLimiter;
  private limits: Map<string, RateLimitEntry> = new Map();
  
  private constructor() {}

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Check if an action is allowed under rate limits
   * @param key - Unique identifier for the action (e.g., 'ai-suggestion', 'resume-save')
   * @param maxRequests - Maximum requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns true if allowed, false if rate limited
   */
  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry) {
      // First request for this key
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs,
        lastRequest: now
      });
      return true;
    }

    // Check if we need to reset the window
    if (now >= entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs,
        lastRequest: now
      });
      return true;
    }

    // Check if we're within limits
    if (entry.count < maxRequests) {
      entry.count++;
      entry.lastRequest = now;
      return true;
    }

    // Rate limited
    return false;
  }

  /**
   * Get remaining requests for a key
   */
  getRemainingRequests(key: string, maxRequests: number): number {
    const entry = this.limits.get(key);
    if (!entry) return maxRequests;
    
    const now = Date.now();
    if (now >= entry.resetTime) return maxRequests;
    
    return Math.max(0, maxRequests - entry.count);
  }

  /**
   * Get time until reset in milliseconds
   */
  getTimeUntilReset(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) return 0;
    
    const now = Date.now();
    return Math.max(0, entry.resetTime - now);
  }

  /**
   * Clear rate limit for a specific key
   */
  clearLimit(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAllLimits(): void {
    this.limits.clear();
  }
}

// Rate limit configurations
export const RateLimitConfigs = {
  AI_SUGGESTIONS: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 requests per minute
  RESUME_SAVE: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 saves per minute
  STUDY_SET_CREATE: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 creates per minute
  FLASHCARD_CREATE: { maxRequests: 50, windowMs: 60 * 1000 }, // 50 flashcards per minute
  CAREER_PATH_GENERATE: { maxRequests: 3, windowMs: 60 * 1000 }, // 3 paths per minute
  COVER_LETTER_GENERATE: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 letters per minute
  SIGN_IN_ATTEMPTS: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  PASSWORD_RESET: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 resets per hour
} as const;

/**
 * Higher-order function to wrap API calls with rate limiting
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  key: string,
  config: { maxRequests: number; windowMs: number }
): T {
  return (async (...args: Parameters<T>) => {
    const rateLimiter = RateLimiter.getInstance();
    
    if (!rateLimiter.isAllowed(key, config.maxRequests, config.windowMs)) {
      const timeUntilReset = rateLimiter.getTimeUntilReset(key);
      const minutes = Math.ceil(timeUntilReset / (60 * 1000));
      
      throw new Error(
        `Rate limit exceeded. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before trying again.`
      );
    }
    
    return fn(...args);
  }) as T;
}

/**
 * Utility function to create rate-limited versions of common actions
 */
export const createRateLimitedActions = () => {
  const rateLimiter = RateLimiter.getInstance();
  
  return {
    checkAILimit: () => rateLimiter.isAllowed('ai-suggestions', ...Object.values(RateLimitConfigs.AI_SUGGESTIONS)),
    checkSaveLimit: () => rateLimiter.isAllowed('resume-save', ...Object.values(RateLimitConfigs.RESUME_SAVE)),
    checkSignInLimit: () => rateLimiter.isAllowed('sign-in', ...Object.values(RateLimitConfigs.SIGN_IN_ATTEMPTS)),
    checkCareerPathLimit: () => rateLimiter.isAllowed('career-path', ...Object.values(RateLimitConfigs.CAREER_PATH_GENERATE)),
    
    getRemainingAIRequests: () => rateLimiter.getRemainingRequests('ai-suggestions', RateLimitConfigs.AI_SUGGESTIONS.maxRequests),
    getRemainingSignInAttempts: () => rateLimiter.getRemainingRequests('sign-in', RateLimitConfigs.SIGN_IN_ATTEMPTS.maxRequests),
    
    getAIResetTime: () => rateLimiter.getTimeUntilReset('ai-suggestions'),
    getSignInResetTime: () => rateLimiter.getTimeUntilReset('sign-in'),
  };
};
