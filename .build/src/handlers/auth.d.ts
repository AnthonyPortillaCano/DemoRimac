import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import '../config/environment';
export declare const login: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const register: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const generateDemoToken: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
//# sourceMappingURL=auth.d.ts.map