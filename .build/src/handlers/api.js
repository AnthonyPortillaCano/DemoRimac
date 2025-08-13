"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const starWarsService_1 = require("../services/starWarsService");
const weatherService_1 = require("../services/weatherService");
const fusionService_1 = require("../services/fusionService");
const persistenceService_1 = require("../services/persistenceService");
const validationService_1 = require("../services/validationService");
const rateLimitService_1 = require("../services/rateLimitService");
const authMiddleware_1 = require("../middleware/authMiddleware");
const logger_1 = require("../utils/logger");
const uuid_1 = require("uuid");
const userService_1 = require("../services/userService");
require("../config/environment");
const starWarsService = new starWarsService_1.StarWarsService();
const weatherService = new weatherService_1.WeatherService();
const fusionService = new fusionService_1.FusionService(starWarsService, weatherService);
const databaseService = (0, persistenceService_1.getDatabaseService)();
const validationService = new validationService_1.ValidationService();
const __shouldBootstrapUsers = (process.env['DB_ENGINE'] || 'dynamo').toLowerCase() === 'mysql';
if (__shouldBootstrapUsers) {
    const _userBootstrap = new userService_1.UserService();
}
const rateLimitConfig = {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
    message: 'Rate limit exceeded. Please try again later.'
};
const rateLimitService = new rateLimitService_1.RateLimitService(databaseService, rateLimitConfig);
const handler = async (event, context) => {
    const startTime = Date.now();
    try {
        logger_1.logger.info('API request received', {
            path: event.path,
            method: event.httpMethod,
            requestId: context.awsRequestId
        });
        const segment = process.env['AWS_XRAY_DAEMON_ADDRESS'] ?
            { traceId: context.awsRequestId } : null;
        let response;
        switch (event.path) {
            case '/fusionados':
                response = await handleFusionados(event, segment);
                break;
            case '/almacenar':
                response = await (0, authMiddleware_1.requireAuth)(handleAlmacenar)(event);
                break;
            case '/historial':
                response = await (0, authMiddleware_1.requireAuth)(handleHistorial)(event);
                break;
            default:
                response = createErrorResponse(404, 'Endpoint not found');
        }
        const duration = Date.now() - startTime;
        logger_1.logger.info('API request completed', {
            path: event.path,
            method: event.httpMethod,
            statusCode: response.statusCode,
            duration,
            requestId: context.awsRequestId
        });
        return response;
    }
    catch (error) {
        logger_1.logger.error('Unexpected error in API handler:', error);
        return createErrorResponse(500, 'Internal server error');
    }
};
exports.handler = handler;
async function handleFusionados(event, _segment) {
    try {
        const clientId = event.requestContext.identity.sourceIp || 'unknown';
        const isRateLimited = await rateLimitService.isRateLimited(clientId, '/fusionados');
        if (isRateLimited) {
            return createErrorResponse(429, rateLimitConfig.message);
        }
        try {
            const cacheKey = 'fusionados_latest';
            const cached = await databaseService.getItemById(cacheKey);
            if (cached && isCacheValid(cached.timestamp)) {
                logger_1.logger.info('Returning cached fusionados data');
                return createSuccessResponse(cached.data);
            }
        }
        catch (cacheError) {
            if (process.env['IS_OFFLINE']) {
                logger_1.logger.warn('Skipping cache read while offline', { error: String(cacheError) });
            }
            else {
                logger_1.logger.warn('Cache read failed, continuing without cache', { error: String(cacheError) });
            }
        }
        const fusedData = await fusionService.fuseCharacterWithWeather();
        const processedData = fusionService.processFusedData(fusedData);
        let storedId = null;
        try {
            storedId = await databaseService.storeFusedData(processedData);
        }
        catch (storeError) {
            if (process.env['IS_OFFLINE']) {
                logger_1.logger.warn('Skipping DB store while offline', { error: String(storeError) });
            }
            else {
                logger_1.logger.warn('DB store failed, continuing without persistence', { error: String(storeError) });
            }
        }
        try {
            const cacheKey = 'fusionados_latest';
            await databaseService.storeCustomData({
                id: cacheKey,
                title: 'Latest Fused Data',
                description: 'Cached fusionados data',
                category: 'cache',
                tags: ['cache', 'fusionados'],
                metadata: { originalId: storedId },
                created_at: Date.now(),
                updated_at: Date.now()
            });
        }
        catch (cacheWriteError) {
            if (process.env['IS_OFFLINE']) {
                logger_1.logger.warn('Skipping cache write while offline', { error: String(cacheWriteError) });
            }
            else {
                logger_1.logger.warn('Cache write failed, continuing without cache', { error: String(cacheWriteError) });
            }
        }
        return createSuccessResponse(processedData);
    }
    catch (error) {
        logger_1.logger.error('Error in fusionados endpoint:', error);
        return createErrorResponse(500, 'Failed to fetch and fuse data');
    }
}
async function handleAlmacenar(event, _segment) {
    try {
        if (!event.body) {
            return createErrorResponse(400, 'Request body is required');
        }
        const body = JSON.parse(event.body);
        const validation = validationService.validateCustomData(body);
        if (validation.error) {
            return createErrorResponse(400, `Validation error: ${validation.error.message}`);
        }
        const customData = {
            id: (0, uuid_1.v4)(),
            title: validation.value.title,
            description: validation.value.description,
            category: validation.value.category,
            tags: validationService.validateAndSanitizeTags(validation.value.tags || []),
            metadata: validationService.validateMetadata(validation.value.metadata),
            created_at: Date.now(),
            updated_at: Date.now()
        };
        try {
            await databaseService.storeCustomData(customData);
        }
        catch (err) {
            if (process.env['IS_OFFLINE']) {
                logger_1.logger.warn('Skipping DB store while offline', { error: String(err) });
            }
            else {
                logger_1.logger.warn('DB store failed for custom data', { error: String(err) });
            }
        }
        return createSuccessResponse(customData, 'Data stored successfully');
    }
    catch (error) {
        logger_1.logger.error('Error in almacenar endpoint:', error);
        return createErrorResponse(500, 'Failed to store data');
    }
}
async function handleHistorial(event, _segment) {
    try {
        const queryParams = {};
        if (event.queryStringParameters) {
            if (event.queryStringParameters['page']) {
                queryParams.page = parseInt(event.queryStringParameters['page'], 10);
            }
            if (event.queryStringParameters['limit']) {
                queryParams.limit = parseInt(event.queryStringParameters['limit'], 10);
            }
            if (event.queryStringParameters['type']) {
                queryParams.type = event.queryStringParameters['type'];
            }
            if (event.queryStringParameters['category']) {
                queryParams.category = event.queryStringParameters['category'];
            }
        }
        const validation = validationService.validateQueryParams(queryParams);
        if (validation.error) {
            return createErrorResponse(400, `Validation error: ${validation.error.message}`);
        }
        let response;
        try {
            if (validation.value.type === 'custom') {
                response = await databaseService.getCustomData(validation.value);
            }
            else {
                response = await databaseService.getFusedDataHistory(validation.value);
            }
        }
        catch (err) {
            if (process.env['IS_OFFLINE']) {
                logger_1.logger.warn('Skipping DB read while offline', { error: String(err) });
                response = { items: [], total: 0, page: validation.value.page ?? 1, limit: validation.value.limit ?? 10, hasNext: false, hasPrev: false };
            }
            else {
                throw err;
            }
        }
        return createSuccessResponse(response);
    }
    catch (error) {
        logger_1.logger.error('Error in historial endpoint:', error);
        return createErrorResponse(500, 'Failed to retrieve history');
    }
}
function isCacheValid(timestamp) {
    const cacheTTL = 30 * 60 * 1000;
    return Date.now() - timestamp < cacheTTL;
}
function createSuccessResponse(data, message) {
    const response = {
        success: true,
        data,
        message,
        timestamp: Date.now()
    };
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        body: JSON.stringify(response)
    };
}
function createErrorResponse(statusCode, message) {
    const response = {
        success: false,
        error: message,
        timestamp: Date.now()
    };
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        body: JSON.stringify(response)
    };
}
//# sourceMappingURL=api.js.map