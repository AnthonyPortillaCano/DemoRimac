import { DatabaseService } from './databaseService';
import { RateLimitConfig } from '../types';
export declare class RateLimitService {
    private readonly databaseService;
    private readonly config;
    constructor(databaseService: DatabaseService, config: RateLimitConfig);
    isRateLimited(clientId: string, endpoint: string): Promise<boolean>;
    private createRateLimitRecord;
    private updateRateLimitRecord;
    getRateLimitInfo(clientId: string, endpoint: string): Promise<{
        remaining: number;
        resetTime: number;
        limit: number;
    }>;
    clearRateLimit(clientId: string, endpoint: string): Promise<void>;
}
//# sourceMappingURL=rateLimitService.d.ts.map