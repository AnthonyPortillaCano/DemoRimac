"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STAGE = exports.AWS_XRAY_DAEMON_ADDRESS = exports.CACHE_TTL = exports.LOG_LEVEL = exports.WEATHER_API_KEY = exports.DYNAMODB_TABLE = exports.AWS_REGION = exports.NODE_ENV = exports.environment = void 0;
exports.validateEnvironment = validateEnvironment;
const dotenv_1 = require("dotenv");
const logger_1 = require("../utils/logger");
const nodeEnv = process.env['NODE_ENV'] || 'development';
const shouldOverride = nodeEnv !== 'production';
const candidates = [`.env.${nodeEnv}`, `env.${nodeEnv}`, '.env', 'env'];
for (const file of candidates) {
    try {
        (0, dotenv_1.config)({ path: file, override: shouldOverride });
    }
    catch { }
}
exports.environment = {
    node_env: process.env['NODE_ENV'] || 'development',
    aws_region: process.env['AWS_REGION'] || 'us-east-1',
    dynamodb_table: process.env['DYNAMODB_TABLE'] || 'softtek-rimac-api-dev',
    weather_api_key: process.env['WEATHER_API_KEY'] || 'demo-key',
    log_level: process.env['LOG_LEVEL'] || 'info',
    cache_ttl: parseInt(process.env['CACHE_TTL'] || '1800', 10),
    aws_xray_daemon_address: process.env['AWS_XRAY_DAEMON_ADDRESS'],
    stage: process.env['STAGE'] || 'dev'
};
function validateEnvironment() {
    const requiredVars = ['WEATHER_API_KEY'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        logger_1.logger.warn(`Missing environment variables: ${missingVars.join(', ')}`);
        if (exports.environment.node_env === 'production') {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }
    }
    logger_1.logger.info('Environment configuration loaded', {
        NODE_ENV: exports.environment.node_env,
        STAGE: exports.environment.stage,
        AWS_REGION: exports.environment.aws_region,
        DYNAMODB_TABLE: exports.environment.dynamodb_table,
        LOG_LEVEL: exports.environment.log_level,
        CACHE_TTL: exports.environment.cache_ttl
    });
}
exports.NODE_ENV = exports.environment.node_env, exports.AWS_REGION = exports.environment.aws_region, exports.DYNAMODB_TABLE = exports.environment.dynamodb_table, exports.WEATHER_API_KEY = exports.environment.weather_api_key, exports.LOG_LEVEL = exports.environment.log_level, exports.CACHE_TTL = exports.environment.cache_ttl, exports.AWS_XRAY_DAEMON_ADDRESS = exports.environment.aws_xray_daemon_address, exports.STAGE = exports.environment.stage;
//# sourceMappingURL=environment.js.map