"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitService = void 0;
const logger_1 = require("../utils/logger");
class RateLimitService {
    databaseService;
    config;
    constructor(databaseService, config) {
        this.databaseService = databaseService;
        this.config = config;
    }
    async isRateLimited(clientId, endpoint) {
        try {
            const key = `rate_limit_${clientId}_${endpoint}`;
            const now = Date.now();
            const windowStart = now - this.config.windowMs;
            const currentData = await this.databaseService.getItemById(key);
            if (!currentData) {
                await this.createRateLimitRecord(key, now);
                return false;
            }
            const requestData = currentData.data;
            if (now - requestData.lastReset > this.config.windowMs) {
                await this.createRateLimitRecord(key, now);
                return false;
            }
            const validRequests = requestData.requests.filter(timestamp => timestamp > windowStart);
            if (validRequests.length >= this.config.maxRequests) {
                logger_1.logger.warn(`Rate limit exceeded for ${clientId} on ${endpoint}`, {
                    clientId,
                    endpoint,
                    requests: validRequests.length,
                    limit: this.config.maxRequests
                });
                return true;
            }
            validRequests.push(now);
            await this.updateRateLimitRecord(key, validRequests, requestData.lastReset);
            return false;
        }
        catch (error) {
            logger_1.logger.error('Error checking rate limit:', error);
            return false;
        }
    }
    async createRateLimitRecord(key, timestamp) {
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
    async updateRateLimitRecord(key, requests, lastReset) {
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
    async getRateLimitInfo(clientId, endpoint) {
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
            const requestData = currentData.data;
            const validRequests = requestData.requests.filter(timestamp => timestamp > windowStart);
            const remaining = Math.max(0, this.config.maxRequests - validRequests.length);
            const resetTime = requestData.lastReset + this.config.windowMs;
            return {
                remaining,
                resetTime,
                limit: this.config.maxRequests
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting rate limit info:', error);
            return {
                remaining: this.config.maxRequests,
                resetTime: Date.now() + this.config.windowMs,
                limit: this.config.maxRequests
            };
        }
    }
    async clearRateLimit(clientId, endpoint) {
        try {
            const key = `rate_limit_${clientId}_${endpoint}`;
            await this.databaseService.deleteItem(key);
            logger_1.logger.info(`Rate limit cleared for ${clientId} on ${endpoint}`);
        }
        catch (error) {
            logger_1.logger.error('Error clearing rate limit:', error);
            throw new Error('Failed to clear rate limit');
        }
    }
}
exports.RateLimitService = RateLimitService;
//# sourceMappingURL=rateLimitService.js.map