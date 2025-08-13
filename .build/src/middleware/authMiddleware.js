"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUser = exports.requireAdmin = exports.requireAuth = void 0;
exports.createAuthMiddleware = createAuthMiddleware;
const authService_1 = require("../services/authService");
const logger_1 = require("../utils/logger");
function createAuthMiddleware(requiredRole) {
    const authService = new authService_1.AuthService();
    return (handler) => async (event) => {
        try {
            const authHeader = event.headers['Authorization'] || event.headers['authorization'];
            const token = authService.extractTokenFromHeader(authHeader);
            if (!token) {
                logger_1.logger.warn('Authentication required but no token provided', {
                    path: event.path,
                    method: event.httpMethod
                });
                return {
                    statusCode: 401,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                    },
                    body: JSON.stringify({
                        success: false,
                        error: 'Authentication required',
                        timestamp: Date.now()
                    })
                };
            }
            const authResult = authService.verifyToken(token);
            if (!authResult.isValid || !authResult.payload) {
                logger_1.logger.warn('Invalid authentication token', {
                    path: event.path,
                    method: event.httpMethod,
                    error: authResult.error
                });
                return {
                    statusCode: 401,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                    },
                    body: JSON.stringify({
                        success: false,
                        error: authResult.error || 'Invalid authentication token',
                        timestamp: Date.now()
                    })
                };
            }
            if (requiredRole && authResult.payload.role !== requiredRole) {
                logger_1.logger.warn('Insufficient permissions', {
                    path: event.path,
                    method: event.httpMethod,
                    userRole: authResult.payload.role,
                    requiredRole
                });
                return {
                    statusCode: 403,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                    },
                    body: JSON.stringify({
                        success: false,
                        error: 'Insufficient permissions',
                        timestamp: Date.now()
                    })
                };
            }
            const authenticatedEvent = {
                ...event,
                user: {
                    userId: authResult.payload.userId,
                    email: authResult.payload.email,
                    role: authResult.payload.role
                }
            };
            logger_1.logger.info('Authentication successful', {
                path: event.path,
                method: event.httpMethod,
                userId: authResult.payload.userId,
                role: authResult.payload.role
            });
            return await handler(authenticatedEvent);
        }
        catch (error) {
            logger_1.logger.error('Authentication middleware error:', error);
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Internal authentication error',
                    timestamp: Date.now()
                })
            };
        }
    };
}
exports.requireAuth = createAuthMiddleware();
exports.requireAdmin = createAuthMiddleware('admin');
exports.requireUser = createAuthMiddleware('user');
//# sourceMappingURL=authMiddleware.js.map