"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authService_1 = require("../../src/services/authService");
describe('AuthService - BDD Tests', () => {
    let authService;
    beforeEach(() => {
        authService = new authService_1.AuthService();
    });
    describe('Feature: User Authentication', () => {
        describe('Scenario: Successfully authenticate valid user', () => {
            it('Given a valid username and password', async () => {
                const username = 'testuser';
                const password = 'testpass123';
                const result = await authService.authenticateUser(username, password);
                expect(result.success).toBe(true);
                expect(result.token).toBeDefined();
                expect(result.user).toBeDefined();
                expect(result.user.username).toBe(username);
            });
            it('And the user exists in the system', async () => {
                const username = 'admin';
                const password = 'admin123';
                const result = await authService.authenticateUser(username, password);
                expect(result.success).toBe(true);
                expect(result.user.role).toBe('admin');
            });
        });
        describe('Scenario: Fail authentication with invalid credentials', () => {
            it('Given an invalid username', async () => {
                const username = 'nonexistentuser';
                const password = 'anypassword';
                const result = await authService.authenticateUser(username, password);
                expect(result.success).toBe(false);
                expect(result.error).toBe('Invalid credentials');
                expect(result.token).toBeUndefined();
            });
            it('Given an invalid password', async () => {
                const username = 'testuser';
                const password = 'wrongpassword';
                const result = await authService.authenticateUser(username, password);
                expect(result.success).toBe(false);
                expect(result.error).toBe('Invalid credentials');
                expect(result.token).toBeUndefined();
            });
            it('Given empty credentials', async () => {
                const username = '';
                const password = '';
                const result = await authService.authenticateUser(username, password);
                expect(result.success).toBe(false);
                expect(result.error).toBe('Username and password are required');
                expect(result.token).toBeUndefined();
            });
        });
    });
    describe('Feature: Token Validation', () => {
        describe('Scenario: Successfully validate valid token', () => {
            it('Given a valid JWT token', async () => {
                const username = 'testuser';
                const password = 'testpass123';
                const authResult = await authService.authenticateUser(username, password);
                const token = authResult.token;
                const validationResult = await authService.validateToken(token);
                expect(validationResult.valid).toBe(true);
                expect(validationResult.user).toBeDefined();
                expect(validationResult.user.username).toBe(username);
            });
        });
        describe('Scenario: Fail validation with invalid token', () => {
            it('Given an expired token', async () => {
                const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE2MzA5NjAwMDAsImV4cCI6MTYzMDk2MzYwMH0.invalid_signature';
                const result = await authService.validateToken(expiredToken);
                expect(result.valid).toBe(false);
                expect(result.error).toBeDefined();
            });
            it('Given a malformed token', async () => {
                const malformedToken = 'not.a.valid.token';
                const result = await authService.validateToken(malformedToken);
                expect(result.valid).toBe(false);
                expect(result.error).toBeDefined();
            });
            it('Given an empty token', async () => {
                const emptyToken = '';
                const result = await authService.validateToken(emptyToken);
                expect(result.valid).toBe(false);
                expect(result.error).toBe('Token is required');
            });
        });
    });
    describe('Feature: User Registration', () => {
        describe('Scenario: Successfully register new user', () => {
            it('Given valid user registration data', async () => {
                const newUser = {
                    username: 'newuser',
                    email: 'newuser@example.com',
                    role: 'user'
                };
                const password = 'newpass123';
                const result = await authService.registerUser(newUser, password);
                expect(result.success).toBe(true);
                expect(result.user).toBeDefined();
                expect(result.user.username).toBe(newUser.username);
                expect(result.user.email).toBe(newUser.email);
            });
        });
        describe('Scenario: Fail registration with invalid data', () => {
            it('Given duplicate username', async () => {
                const existingUser = {
                    username: 'testuser',
                    email: 'existing@example.com',
                    role: 'user'
                };
                const password = 'password123';
                const result = await authService.registerUser(existingUser, password);
                expect(result.success).toBe(false);
                expect(result.error).toBe('Username already exists');
            });
            it('Given invalid email format', async () => {
                const invalidUser = {
                    username: 'validuser',
                    email: 'invalid-email',
                    role: 'user'
                };
                const password = 'password123';
                const result = await authService.registerUser(invalidUser, password);
                expect(result.success).toBe(false);
                expect(result.error).toBe('Invalid email format');
            });
            it('Given weak password', async () => {
                const validUser = {
                    username: 'validuser',
                    email: 'valid@example.com',
                    role: 'user'
                };
                const weakPassword = '123';
                const result = await authService.registerUser(validUser, weakPassword);
                expect(result.success).toBe(false);
                expect(result.error).toBe('Password must be at least 8 characters long');
            });
        });
    });
    describe('Feature: Password Security', () => {
        describe('Scenario: Password hashing and verification', () => {
            it('Given a user password', async () => {
                const password = 'securepassword123';
                const hashedPassword = await authService.hashPassword(password);
                const isMatch = await authService.verifyPassword(password, hashedPassword);
                expect(hashedPassword).not.toBe(password);
                expect(hashedPassword.length).toBeGreaterThan(password.length);
                expect(isMatch).toBe(true);
            });
            it('Given different passwords', async () => {
                const password1 = 'password1';
                const password2 = 'password2';
                const hashedPassword = await authService.hashPassword(password1);
                const isMatch = await authService.verifyPassword(password2, hashedPassword);
                expect(isMatch).toBe(false);
            });
        });
    });
    describe('Feature: Role-Based Access Control', () => {
        describe('Scenario: Check user permissions', () => {
            it('Given an admin user', async () => {
                const username = 'admin';
                const password = 'admin123';
                const authResult = await authService.authenticateUser(username, password);
                const token = authResult.token;
                const validationResult = await authService.validateToken(token);
                expect(validationResult.user.role).toBe('admin');
                expect(validationResult.user.role).toBe('admin');
            });
            it('Given a regular user', async () => {
                const username = 'testuser';
                const password = 'testpass123';
                const authResult = await authService.authenticateUser(username, password);
                const token = authResult.token;
                const validationResult = await authService.validateToken(token);
                expect(validationResult.user.role).toBe('user');
            });
        });
    });
});
//# sourceMappingURL=authService.bdd.test.js.map