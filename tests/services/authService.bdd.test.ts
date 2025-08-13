import { AuthService } from '../../src/services/authService';
import { User } from '../../src/types';

describe('AuthService - BDD Tests', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('Feature: User Authentication', () => {
    describe('Scenario: Successfully authenticate valid user', () => {
      it('Given a valid username and password', async () => {
        // Given
        const username = 'testuser';
        const password = 'testpass123';

        // When
        const result = await authService.authenticateUser(username, password);

        // Then
        expect(result.success).toBe(true);
        expect(result.token).toBeDefined();
        expect(result.user).toBeDefined();
        expect(result.user.username).toBe(username);
      });

      it('And the user exists in the system', async () => {
        // Given
        const username = 'admin';
        const password = 'admin123';

        // When
        const result = await authService.authenticateUser(username, password);

        // Then
        expect(result.success).toBe(true);
        expect(result.user.role).toBe('admin');
      });
    });

    describe('Scenario: Fail authentication with invalid credentials', () => {
      it('Given an invalid username', async () => {
        // Given
        const username = 'nonexistentuser';
        const password = 'anypassword';

        // When
        const result = await authService.authenticateUser(username, password);

        // Then
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid credentials');
        expect(result.token).toBeUndefined();
      });

      it('Given an invalid password', async () => {
        // Given
        const username = 'testuser';
        const password = 'wrongpassword';

        // When
        const result = await authService.authenticateUser(username, password);

        // Then
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid credentials');
        expect(result.token).toBeUndefined();
      });

      it('Given empty credentials', async () => {
        // Given
        const username = '';
        const password = '';

        // When
        const result = await authService.authenticateUser(username, password);

        // Then
        expect(result.success).toBe(false);
        expect(result.error).toBe('Username and password are required');
        expect(result.token).toBeUndefined();
      });
    });
  });

  describe('Feature: Token Validation', () => {
    describe('Scenario: Successfully validate valid token', () => {
      it('Given a valid JWT token', async () => {
        // Given
        const username = 'testuser';
        const password = 'testpass123';
        const authResult = await authService.authenticateUser(username, password);
        const token = authResult.token!;

        // When
        const validationResult = await authService.validateToken(token);

        // Then
        expect(validationResult.valid).toBe(true);
        expect(validationResult.user).toBeDefined();
        expect(validationResult.user.username).toBe(username);
      });
    });

    describe('Scenario: Fail validation with invalid token', () => {
      it('Given an expired token', async () => {
        // Given
        const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE2MzA5NjAwMDAsImV4cCI6MTYzMDk2MzYwMH0.invalid_signature';

        // When
        const result = await authService.validateToken(expiredToken);

        // Then
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('Given a malformed token', async () => {
        // Given
        const malformedToken = 'not.a.valid.token';

        // When
        const result = await authService.validateToken(malformedToken);

        // Then
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('Given an empty token', async () => {
        // Given
        const emptyToken = '';

        // When
        const result = await authService.validateToken(emptyToken);

        // Then
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Token is required');
      });
    });
  });

  describe('Feature: User Registration', () => {
    describe('Scenario: Successfully register new user', () => {
      it('Given valid user registration data', async () => {
        // Given
        const newUser: Omit<User, 'id'> = {
          username: 'newuser',
          email: 'newuser@example.com',
          role: 'user'
        };
        const password = 'newpass123';

        // When
        const result = await authService.registerUser(newUser, password);

        // Then
        expect(result.success).toBe(true);
        expect(result.user).toBeDefined();
        expect(result.user.username).toBe(newUser.username);
        expect(result.user.email).toBe(newUser.email);
      });
    });

    describe('Scenario: Fail registration with invalid data', () => {
      it('Given duplicate username', async () => {
        // Given
        const existingUser: Omit<User, 'id'> = {
          username: 'testuser', // This username already exists
          email: 'existing@example.com',
          role: 'user'
        };
        const password = 'password123';

        // When
        const result = await authService.registerUser(existingUser, password);

        // Then
        expect(result.success).toBe(false);
        expect(result.error).toBe('Username already exists');
      });

      it('Given invalid email format', async () => {
        // Given
        const invalidUser: Omit<User, 'id'> = {
          username: 'validuser',
          email: 'invalid-email',
          role: 'user'
        };
        const password = 'password123';

        // When
        const result = await authService.registerUser(invalidUser, password);

        // Then
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid email format');
      });

      it('Given weak password', async () => {
        // Given
        const validUser: Omit<User, 'id'> = {
          username: 'validuser',
          email: 'valid@example.com',
          role: 'user'
        };
        const weakPassword = '123'; // Too short

        // When
        const result = await authService.registerUser(validUser, weakPassword);

        // Then
        expect(result.success).toBe(false);
        expect(result.error).toBe('Password must be at least 8 characters long');
      });
    });
  });

  describe('Feature: Password Security', () => {
    describe('Scenario: Password hashing and verification', () => {
      it('Given a user password', async () => {
        // Given
        const password = 'securepassword123';

        // When
        const hashedPassword = await authService.hashPassword(password);
        const isMatch = await authService.verifyPassword(password, hashedPassword);

        // Then
        expect(hashedPassword).not.toBe(password);
        expect(hashedPassword.length).toBeGreaterThan(password.length);
        expect(isMatch).toBe(true);
      });

      it('Given different passwords', async () => {
        // Given
        const password1 = 'password1';
        const password2 = 'password2';
        const hashedPassword = await authService.hashPassword(password1);

        // When
        const isMatch = await authService.verifyPassword(password2, hashedPassword);

        // Then
        expect(isMatch).toBe(false);
      });
    });
  });

  describe('Feature: Role-Based Access Control', () => {
    describe('Scenario: Check user permissions', () => {
      it('Given an admin user', async () => {
        // Given
        const username = 'admin';
        const password = 'admin123';
        const authResult = await authService.authenticateUser(username, password);
        const token = authResult.token!;

        // When
        const validationResult = await authService.validateToken(token);

        // Then
        expect(validationResult.user.role).toBe('admin');
        expect(validationResult.user.role).toBe('admin');
      });

      it('Given a regular user', async () => {
        // Given
        const username = 'testuser';
        const password = 'testpass123';
        const authResult = await authService.authenticateUser(username, password);
        const token = authResult.token!;

        // When
        const validationResult = await authService.validateToken(token);

        // Then
        expect(validationResult.user.role).toBe('user');
      });
    });
  });
}); 