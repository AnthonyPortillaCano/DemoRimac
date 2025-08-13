"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const logger_1 = require("../utils/logger");
class AuthService {
    secretKey;
    algorithm = 'HS256';
    constructor() {
        this.secretKey = process.env['JWT_SECRET'] || 'your-secret-key-change-in-production';
    }
    generateToken(payload) {
        try {
            const header = {
                alg: this.algorithm,
                typ: 'JWT'
            };
            const now = Math.floor(Date.now() / 1000);
            const exp = now + (24 * 60 * 60);
            const jwtPayload = {
                ...payload,
                iat: now,
                exp
            };
            const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
            const encodedPayload = this.base64UrlEncode(JSON.stringify(jwtPayload));
            const signature = this.createSignature(`${encodedHeader}.${encodedPayload}`);
            const encodedSignature = this.base64UrlEncode(signature);
            return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
        }
        catch (error) {
            logger_1.logger.error('Error generating JWT token:', error);
            throw new Error('Failed to generate token');
        }
    }
    verifyToken(token) {
        try {
            if (!token) {
                return { isValid: false, error: 'No token provided' };
            }
            const parts = token.split('.');
            if (parts.length !== 3) {
                return { isValid: false, error: 'Invalid token format' };
            }
            const [encodedHeader, encodedPayload, encodedSignature] = parts;
            const expectedSignature = this.createSignature(`${encodedHeader}.${encodedPayload}`);
            const expectedEncodedSignature = this.base64UrlEncode(expectedSignature);
            if (encodedSignature !== expectedEncodedSignature) {
                return { isValid: false, error: 'Invalid signature' };
            }
            const payload = JSON.parse(this.base64UrlDecode(encodedPayload));
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp < now) {
                return { isValid: false, error: 'Token expired' };
            }
            return { isValid: true, payload };
        }
        catch (error) {
            logger_1.logger.error('Error verifying JWT token:', error);
            return { isValid: false, error: 'Token verification failed' };
        }
    }
    extractTokenFromHeader(authHeader) {
        if (!authHeader)
            return null;
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }
        return parts[1] || null;
    }
    createSignature(data) {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(this.secretKey);
        const messageData = encoder.encode(data);
        let hash = 0;
        for (let i = 0; i < messageData.length; i++) {
            const char = messageData[i];
            hash = ((hash << 5) - hash + char) & 0xffffffff;
        }
        return hash.toString(16);
    }
    base64UrlEncode(str) {
        return Buffer.from(str).toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }
    base64UrlDecode(str) {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) {
            str += '=';
        }
        return Buffer.from(str, 'base64').toString();
    }
    generateDemoToken() {
        return this.generateToken({
            userId: 'demo-user-123',
            email: 'demo@example.com',
            role: 'user'
        });
    }
    generateAdminToken() {
        return this.generateToken({
            userId: 'demo-admin-456',
            email: 'admin@example.com',
            role: 'admin'
        });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map