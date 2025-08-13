import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { StarWarsService } from '../services/starWarsService';
import { WeatherService } from '../services/weatherService';
import { FusionService } from '../services/fusionService';
import { getDatabaseService, PersistenceProvider } from '../services/persistenceService';
import { ValidationService } from '../services/validationService';
import { RateLimitService } from '../services/rateLimitService';
import { requireAuth, requireUser } from '../middleware/authMiddleware';
import { ApiResponse, CustomData, QueryParams, RateLimitConfig } from '../types';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from '../services/userService';
import '../config/environment';

// Initialize services
const starWarsService = new StarWarsService();
const weatherService = new WeatherService();
const fusionService = new FusionService(starWarsService, weatherService);
const databaseService: PersistenceProvider = getDatabaseService();
const validationService = new ValidationService();

// Bootstrap users table creation (on cold start of this lambda) only if MySQL is enabled
const __shouldBootstrapUsers = (process.env['DB_ENGINE'] || 'dynamo').toLowerCase() === 'mysql';
if (__shouldBootstrapUsers) {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const _userBootstrap = new UserService();
}

// Initialize rate limiting
const rateLimitConfig: RateLimitConfig = {
	windowMs: 15 * 60 * 1000, // 15 minutes
	maxRequests: 100, // 100 requests per 15 minutes
	message: 'Rate limit exceeded. Please try again later.'
};
const rateLimitService = new RateLimitService(databaseService as any, rateLimitConfig);

export const handler = async (
	event: APIGatewayProxyEvent,
	context: Context
): Promise<APIGatewayProxyResult> => {
	const startTime = Date.now();
	
	try {
		logger.info('API request received', {
			path: event.path,
			method: event.httpMethod,
			requestId: context.awsRequestId
		});

		// Add X-Ray tracing
		const segment = process.env['AWS_XRAY_DAEMON_ADDRESS'] ? 
			{ traceId: context.awsRequestId } : null;

		let response: APIGatewayProxyResult;

		switch (event.path) {
			case '/fusionados':
				response = await handleFusionados(event, segment);
				break;
			case '/almacenar':
				// Apply authentication middleware for POST /almacenar (admin or user)
				response = await requireAuth(handleAlmacenar)(event);
				break;
			case '/historial':
				// Apply authentication middleware for GET /historial (admin or user)
				response = await requireAuth(handleHistorial)(event);
				break;
			default:
				response = createErrorResponse(404, 'Endpoint not found');
		}

		const duration = Date.now() - startTime;
		logger.info('API request completed', {
			path: event.path,
			method: event.httpMethod,
			statusCode: response.statusCode,
			duration,
			requestId: context.awsRequestId
		});

		return response;
	} catch (error) {
		logger.error('Unexpected error in API handler:', error);
		return createErrorResponse(500, 'Internal server error');
	}
};

/**
 * Handle GET /fusionados endpoint
 */
async function handleFusionados(
	event: APIGatewayProxyEvent,
	_segment?: { traceId: string } | null
): Promise<APIGatewayProxyResult> {
	try {
		// Check rate limiting for external API consuming endpoint
		const clientId = event.requestContext.identity.sourceIp || 'unknown';
		const isRateLimited = await rateLimitService.isRateLimited(clientId, '/fusionados');
		
		if (isRateLimited) {
			return createErrorResponse(429, rateLimitConfig.message);
		}

		// Check cache first (best-effort only during offline dev)
		try {
			const cacheKey = 'fusionados_latest';
			const cached = await databaseService.getItemById(cacheKey);
			if (cached && isCacheValid(cached.timestamp)) {
				logger.info('Returning cached fusionados data');
				return createSuccessResponse(cached.data);
			}
		} catch (cacheError) {
			if (process.env['IS_OFFLINE']) {
				logger.warn('Skipping cache read while offline', { error: String(cacheError) });
			} else {
				logger.warn('Cache read failed, continuing without cache', { error: String(cacheError) });
			}
		}

		// Fetch and fuse new data
		const fusedData = await fusionService.fuseCharacterWithWeather();
		const processedData = fusionService.processFusedData(fusedData);
		
		// Store in database (best-effort during offline)
		let storedId: string | null = null;
		try {
			storedId = await databaseService.storeFusedData(processedData);
		} catch (storeError) {
			if (process.env['IS_OFFLINE']) {
				logger.warn('Skipping DB store while offline', { error: String(storeError) });
			} else {
				logger.warn('DB store failed, continuing without persistence', { error: String(storeError) });
			}
		}
		
		// Store in cache (best-effort during offline)
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
		} catch (cacheWriteError) {
			if (process.env['IS_OFFLINE']) {
				logger.warn('Skipping cache write while offline', { error: String(cacheWriteError) });
			} else {
				logger.warn('Cache write failed, continuing without cache', { error: String(cacheWriteError) });
			}
		}

		return createSuccessResponse(processedData);
	} catch (error) {
		logger.error('Error in fusionados endpoint:', error);
		return createErrorResponse(500, 'Failed to fetch and fuse data');
	}
}

/**
 * Handle POST /almacenar endpoint (Protected with authentication)
 */
async function handleAlmacenar(
	event: APIGatewayProxyEvent,
	_segment?: { traceId: string } | null
): Promise<APIGatewayProxyResult> {
	try {
		if (!event.body) {
			return createErrorResponse(400, 'Request body is required');
		}

		const body = JSON.parse(event.body);
		
		// Validate input
		const validation = validationService.validateCustomData(body);
		if (validation.error) {
			return createErrorResponse(400, `Validation error: ${validation.error.message}`);
		}

		const customData: CustomData = {
			id: uuidv4(),
			title: validation.value.title,
			description: validation.value.description,
			category: validation.value.category,
			tags: validationService.validateAndSanitizeTags(validation.value.tags || []),
			metadata: validationService.validateMetadata(validation.value.metadata),
			created_at: Date.now(),
			updated_at: Date.now()
		};

		// Store in database (best-effort during offline)
		try {
			await databaseService.storeCustomData(customData);
		} catch (err) {
			if (process.env['IS_OFFLINE']) {
				logger.warn('Skipping DB store while offline', { error: String(err) });
			} else {
				logger.warn('DB store failed for custom data', { error: String(err) });
			}
		}

		return createSuccessResponse(customData, 'Data stored successfully');
	} catch (error) {
		logger.error('Error in almacenar endpoint:', error);
		return createErrorResponse(500, 'Failed to store data');
	}
}

/**
 * Handle GET /historial endpoint (Protected with authentication)
 */
async function handleHistorial(
	event: APIGatewayProxyEvent,
	_segment?: { traceId: string } | null
): Promise<APIGatewayProxyResult> {
	try {
		// Parse query parameters
		const queryParams: QueryParams = {};
		
		if (event.queryStringParameters) {
			if (event.queryStringParameters['page']) {
				queryParams.page = parseInt(event.queryStringParameters['page'], 10);
			}
			if (event.queryStringParameters['limit']) {
				queryParams.limit = parseInt(event.queryStringParameters['limit'], 10);
			}
			if (event.queryStringParameters['type']) {
				queryParams.type = event.queryStringParameters['type'] as 'fused' | 'custom';
			}
			if (event.queryStringParameters['category']) {
				queryParams.category = event.queryStringParameters['category'];
			}
		}

		// Validate query parameters
		const validation = validationService.validateQueryParams(queryParams);
		if (validation.error) {
			return createErrorResponse(400, `Validation error: ${validation.error.message}`);
		}

		let response;
		
		try {
			if (validation.value.type === 'custom') {
				response = await databaseService.getCustomData(validation.value);
			} else {
				response = await databaseService.getFusedDataHistory(validation.value);
			}
		} catch (err) {
			if (process.env['IS_OFFLINE']) {
				logger.warn('Skipping DB read while offline', { error: String(err) });
				response = { items: [], total: 0, page: validation.value.page ?? 1, limit: validation.value.limit ?? 10, hasNext: false, hasPrev: false };
			} else {
				throw err;
			}
		}

		return createSuccessResponse(response);
	} catch (error) {
		logger.error('Error in historial endpoint:', error);
		return createErrorResponse(500, 'Failed to retrieve history');
	}
}

/**
 * Check if cache is still valid (30 minutes)
 */
function isCacheValid(timestamp: number): boolean {
	const cacheTTL = 30 * 60 * 1000; // 30 minutes
	return Date.now() - timestamp < cacheTTL;
}

/**
 * Create success response
 */
function createSuccessResponse<T>(
	data: T, 
	message?: string
): APIGatewayProxyResult {
	const response: ApiResponse<T> = {
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

/**
 * Create error response
 */
function createErrorResponse(
	statusCode: number, 
	message: string
): APIGatewayProxyResult {
	const response: ApiResponse<never> = {
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