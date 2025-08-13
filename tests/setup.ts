// Jest setup file
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('@aws-sdk/client-xray');

// Mock axios for external API calls
jest.mock('axios');

// Set test environment variables
process.env['NODE_ENV'] = 'test';
process.env['AWS_REGION'] = 'us-east-1';
process.env['DYNAMODB_TABLE'] = 'test-table';
process.env['WEATHER_API_KEY'] = 'test-key';

// Global test setup
beforeAll(() => {
  // Additional test setup if needed
});

afterAll(() => {
  // Cleanup if needed
}); 