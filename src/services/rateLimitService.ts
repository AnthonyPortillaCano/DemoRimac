import { DatabaseService } from './databaseService';
import { logger } from '../utils/logger';
import { RateLimitConfig } from '../types';

export class RateLimitService {
  private readonly databaseService: DatabaseService;
  private readonly config: RateLimitConfig;

  constructor(databaseService: DatabaseService, config: RateLimitConfig) {
    this.databaseService = databaseService;
    this.config = config;
  }

  /**
   * Check if request is within rate limit
   */
  async isRateLimited(clientId: string, endpoint: string): Promise<boolean> {
    try {
      const key = `rate_limit_${clientId}_${endpoint}`;
      const now = Date.now();
      const windowStart = now - this.config.windowMs;

      // Get current request count from database
      const currentData = await this.databaseService.getItemById(key);
      
      if (!currentData) {
        // First request, create new rate limit record
        await this.createRateLimitRecord(key, now);
        return false;
      }

      const requestData = currentData.data as unknown as { requests: number[]; lastReset: number };
      
      // Check if window has reset
      if (now - requestData.lastReset > this.config.windowMs) {
        // Reset window
        await this.createRateLimitRecord(key, now);
        return false;
      }

      // Filter requests within current window
      const validRequests = requestData.requests.filter(timestamp => timestamp > windowStart);
      
      if (validRequests.length >= this.config.maxRequests) {
        logger.warn(`Rate limit exceeded for ${clientId} on ${endpoint}`, {
          clientId,
          endpoint,
          requests: validRequests.length,
          limit: this.config.maxRequests
        });
        return true;
      }

      // Add current request
      validRequests.push(now);
      await this.updateRateLimitRecord(key, validRequests, requestData.lastReset);
      
      return false;
    } catch (error) {
      logger.error('Error checking rate limit:', error);
      // In case of error, allow the request to proceed
      return false;
    }
  }

  /**
   * Create new rate limit record
   */
  private async createRateLimitRecord(key: string, timestamp: number): Promise<void> {
    const rateLimitData = {
      requests: [timestamp],
      lastReset: timestamp
    };

    await this.databaseService.storeCustomData({
      id: key,
      title: 'Rate Limit Data',
      description: 'Rate limiting information',
      category: 'system',
      tags: ['rate-limit', 'system'],
      metadata: rateLimitData,
      created_at: timestamp,
      updated_at: timestamp
    });
  }

  /**
   * Update existing rate limit record
   */
  private async updateRateLimitRecord(key: string, requests: number[], lastReset: number): Promise<void> {
    const rateLimitData = {
      requests,
      lastReset
    };

    await this.databaseService.storeCustomData({
      id: key,
      title: 'Rate Limit Data',
      description: 'Rate limiting information',
      category: 'system',
      tags: ['rate-limit', 'system'],
      metadata: rateLimitData,
      created_at: Date.now(),
      updated_at: Date.now()
    });
  }

  /**
   * Get rate limit info for a client
   */
  async getRateLimitInfo(clientId: string, endpoint: string): Promise<{
    remaining: number;
    resetTime: number;
    limit: number;
  }> {
    try {
      const key = `rate_limit_${clientId}_${endpoint}`;
      const now = Date.now();
      const windowStart = now - this.config.windowMs;

      const currentData = await this.databaseService.getItemById(key);
      
      if (!currentData) {
        return {
          remaining: this.config.maxRequests,
          resetTime: now + this.config.windowMs,
          limit: this.config.maxRequests
        };
      }

      const requestData = currentData.data as unknown as { requests: number[]; lastReset: number };
      const validRequests = requestData.requests.filter(timestamp => timestamp > windowStart);
      const remaining = Math.max(0, this.config.maxRequests - validRequests.length);
      const resetTime = requestData.lastReset + this.config.windowMs;

      return {
        remaining,
        resetTime,
        limit: this.config.maxRequests
      };
    } catch (error) {
      logger.error('Error getting rate limit info:', error);
      return {
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs,
        limit: this.config.maxRequests
      };
    }
  }

  /**
   * Clear rate limit for a client (admin function)
   */
  async clearRateLimit(clientId: string, endpoint: string): Promise<void> {
    try {
      const key = `rate_limit_${clientId}_${endpoint}`;
      await this.databaseService.deleteItem(key);
      logger.info(`Rate limit cleared for ${clientId} on ${endpoint}`);
    } catch (error) {
      logger.error('Error clearing rate limit:', error);
      throw new Error('Failed to clear rate limit');
    }
  }
} 