export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
    iat: number;
    exp: number;
}
export interface AuthResult {
    isValid: boolean;
    payload?: JwtPayload;
    error?: string;
}
export declare class AuthService {
    private readonly secretKey;
    private readonly algorithm;
    constructor();
    generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string;
    verifyToken(token: string): AuthResult;
    extractTokenFromHeader(authHeader: string | undefined): string | null;
    private createSignature;
    private base64UrlEncode;
    private base64UrlDecode;
    generateDemoToken(): string;
    generateAdminToken(): string;
}
//# sourceMappingURL=authService.d.ts.map