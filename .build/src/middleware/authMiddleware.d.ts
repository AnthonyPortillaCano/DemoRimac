import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
export interface AuthenticatedEvent extends APIGatewayProxyEvent {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}
export type AuthMiddleware = (handler: (event: AuthenticatedEvent) => Promise<APIGatewayProxyResult>) => (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare function createAuthMiddleware(requiredRole?: string): AuthMiddleware;
export declare const requireAuth: AuthMiddleware;
export declare const requireAdmin: AuthMiddleware;
export declare const requireUser: AuthMiddleware;
//# sourceMappingURL=authMiddleware.d.ts.map