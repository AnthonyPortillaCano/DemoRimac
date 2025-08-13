"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: '.env.test' });
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('@aws-sdk/client-xray');
jest.mock('axios');
process.env['NODE_ENV'] = 'test';
process.env['AWS_REGION'] = 'us-east-1';
process.env['DYNAMODB_TABLE'] = 'test-table';
process.env['WEATHER_API_KEY'] = 'test-key';
beforeAll(() => {
});
afterAll(() => {
});
//# sourceMappingURL=setup.js.map