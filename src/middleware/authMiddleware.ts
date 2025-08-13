import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AuthService, AuthResult } from '../services/authService';
import { logger } from '../utils/logger';

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export type AuthMiddleware = (
  handler: (event: AuthenticatedEvent) => Promise<APIGatewayProxyResult>
) => (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

export function createAuthMiddleware(requiredRole?: string): AuthMiddleware {
  const authService = new AuthService();

  return (handler) => async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      // Extract token from Authorization header
      const authHeader = event.headers['Authorization'] || event.headers['authorization'];
      const token = authService.extractTokenFromHeader(authHeader);

      if (!token) {
        logger.warn('Authentication required but no token provided', {
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

      // Verify token
      const authResult: AuthResult = authService.verifyToken(token);

      if (!authResult.isValid || !authResult.payload) {
        logger.warn('Invalid authentication token', {
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

      // Check role if required
      if (requiredRole && authResult.payload.role !== requiredRole) {
        logger.warn('Insufficient permissions', {
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

      // Add user information to event
      const authenticatedEvent: AuthenticatedEvent = {
        ...event,
        user: {
          userId: authResult.payload.userId,
          email: authResult.payload.email,
          role: authResult.payload.role
        }
      };

      logger.info('Authentication successful', {
        path: event.path,
        method: event.httpMethod,
        userId: authResult.payload.userId,
        role: authResult.payload.role
      });

      // Call the original handler
      return await handler(authenticatedEvent);
    } catch (error) {
      logger.error('Authentication middleware error:', error);
      
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

// Convenience functions for common roles
export const requireAuth = createAuthMiddleware();
export const requireAdmin = createAuthMiddleware('admin');
export const requireUser = createAuthMiddleware('user'); 