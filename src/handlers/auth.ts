import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthService } from '../services/authService';
import { logger } from '../utils/logger';
import { getDatabaseService } from '../services/persistenceService';
import { UserService } from '../services/userService';
import '../config/environment';

const authService = new AuthService();
const database = getDatabaseService();

function isMySqlEnabled(): boolean {
	return (process.env['DB_ENGINE'] || 'dynamo').toLowerCase() === 'mysql';
}

export const login = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
	try {
		if (!event.body) {
			return createErrorResponse(400, 'Request body is required');
		}

		const body = JSON.parse(event.body);
		const { email, password } = body;

		if (!email || !password) {
			return createErrorResponse(400, 'Email and password are required');
		}

		// 1) Try credential-based login from DB (if user exists and MySQL is enabled)
		if (isMySqlEnabled()) {
			try {
				const userService = new UserService();
				const user = await userService.verifyCredentials(email, password);
				if (user) {
					const token = authService.generateToken({
						userId: user.id,
						email: user.email,
						role: user.role
					});

					try {
						await database.storeCustomData({
							id: `login_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
							title: 'User Login',
							description: 'Successful login',
							category: 'auth',
							tags: ['login'],
							metadata: { email: user.email, role: user.role },
							created_at: Date.now(),
							updated_at: Date.now()
						});
					} catch {}

					return createSuccessResponse({ token, user: { email: user.email, role: user.role } }, 'Login successful');
				}
			} catch (e) {
				logger.warn('DB credential login failed or user not found, falling back to demo users', { error: String(e) });
			}
		}

		// 2) Demo users fallback
		if (email === 'admin@example.com' && password === 'admin123') {
			const token = authService.generateAdminToken();
			logger.info('Admin login successful', { email });
			return createSuccessResponse({ token, user: { email, role: 'admin' } }, 'Login successful');
		} else if (email === 'user@example.com' && password === 'user123') {
			const token = authService.generateDemoToken();
			logger.info('User login successful', { email });
			return createSuccessResponse({ token, user: { email, role: 'user' } }, 'Login successful');
		}

		logger.warn('Login failed - invalid credentials', { email });
		return createErrorResponse(401, 'Invalid credentials');
	} catch (error) {
		logger.error('Error in login endpoint:', error);
		return createErrorResponse(500, 'Internal server error');
	}
};

export const register = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
	try {
		if (!event.body) return createErrorResponse(400, 'Request body is required');
		const body = JSON.parse(event.body);
		const { email, password, role = 'user' } = body;
		if (!email || !password) return createErrorResponse(400, 'Email and password are required');

		if (!isMySqlEnabled()) {
			return createErrorResponse(503, 'User registration requires MySQL. Set DB_ENGINE=mysql and configure MYSQL_* env vars.');
		}

		const userService = new UserService();
		const created = await userService.createUser(email, password, role);
		return createSuccessResponse({ id: created.id, email: created.email, role: created.role }, 'User registered');
	} catch (error) {
		logger.error('Error in register endpoint:', error);
		return createErrorResponse(400, (error as Error).message || 'Failed to register');
	}
};

export const generateDemoToken = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
	try {
		const { role = 'user' } = event.queryStringParameters || {};
		
		let token: string;
		
		if (role === 'admin') {
			token = authService.generateAdminToken();
			logger.info('Demo admin token generated');
		} else {
			token = authService.generateDemoToken();
			logger.info('Demo user token generated');
		}

		return createSuccessResponse({
			token,
			role,
			expires_in: '24 hours',
			note: 'This is a demo token for testing purposes only'
		}, 'Demo token generated successfully');
	} catch (error) {
		logger.error('Error generating demo token:', error);
		return createErrorResponse(500, 'Internal server error');
	}
};

/**
 * Create success response
 */
function createSuccessResponse<T>(
	data: T, 
	message?: string
): APIGatewayProxyResult {
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

/**
 * Create error response
 */
function createErrorResponse(
	statusCode: number, 
	message: string
): APIGatewayProxyResult {
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