"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDemoToken = exports.register = exports.login = void 0;
const authService_1 = require("../services/authService");
const logger_1 = require("../utils/logger");
const persistenceService_1 = require("../services/persistenceService");
const userService_1 = require("../services/userService");
require("../config/environment");
const authService = new authService_1.AuthService();
const database = (0, persistenceService_1.getDatabaseService)();
function isMySqlEnabled() {
    return (process.env['DB_ENGINE'] || 'dynamo').toLowerCase() === 'mysql';
}
const login = async (event) => {
    try {
        if (!event.body) {
            return createErrorResponse(400, 'Request body is required');
        }
        const body = JSON.parse(event.body);
        const { email, password } = body;
        if (!email || !password) {
            return createErrorResponse(400, 'Email and password are required');
        }
        if (isMySqlEnabled()) {
            try {
                const userService = new userService_1.UserService();
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
                    }
                    catch { }
                    return createSuccessResponse({ token, user: { email: user.email, role: user.role } }, 'Login successful');
                }
            }
            catch (e) {
                logger_1.logger.warn('DB credential login failed or user not found, falling back to demo users', { error: String(e) });
            }
        }
        if (email === 'admin@example.com' && password === 'admin123') {
            const token = authService.generateAdminToken();
            logger_1.logger.info('Admin login successful', { email });
            return createSuccessResponse({ token, user: { email, role: 'admin' } }, 'Login successful');
        }
        else if (email === 'user@example.com' && password === 'user123') {
            const token = authService.generateDemoToken();
            logger_1.logger.info('User login successful', { email });
            return createSuccessResponse({ token, user: { email, role: 'user' } }, 'Login successful');
        }
        logger_1.logger.warn('Login failed - invalid credentials', { email });
        return createErrorResponse(401, 'Invalid credentials');
    }
    catch (error) {
        logger_1.logger.error('Error in login endpoint:', error);
        return createErrorResponse(500, 'Internal server error');
    }
};
exports.login = login;
const register = async (event) => {
    try {
        if (!event.body)
            return createErrorResponse(400, 'Request body is required');
        const body = JSON.parse(event.body);
        const { email, password, role = 'user' } = body;
        if (!email || !password)
            return createErrorResponse(400, 'Email and password are required');
        if (!isMySqlEnabled()) {
            return createErrorResponse(503, 'User registration requires MySQL. Set DB_ENGINE=mysql and configure MYSQL_* env vars.');
        }
        const userService = new userService_1.UserService();
        const created = await userService.createUser(email, password, role);
        return createSuccessResponse({ id: created.id, email: created.email, role: created.role }, 'User registered');
    }
    catch (error) {
        logger_1.logger.error('Error in register endpoint:', error);
        return createErrorResponse(400, error.message || 'Failed to register');
    }
};
exports.register = register;
const generateDemoToken = async (event) => {
    try {
        const { role = 'user' } = event.queryStringParameters || {};
        let token;
        if (role === 'admin') {
            token = authService.generateAdminToken();
            logger_1.logger.info('Demo admin token generated');
        }
        else {
            token = authService.generateDemoToken();
            logger_1.logger.info('Demo user token generated');
        }
        return createSuccessResponse({
            token,
            role,
            expires_in: '24 hours',
            note: 'This is a demo token for testing purposes only'
        }, 'Demo token generated successfully');
    }
    catch (error) {
        logger_1.logger.error('Error generating demo token:', error);
        return createErrorResponse(500, 'Internal server error');
    }
};
exports.generateDemoToken = generateDemoToken;
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
//# sourceMappingURL=auth.js.map