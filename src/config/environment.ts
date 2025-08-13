import { config } from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables from multiple possible files, in order
const nodeEnv = process.env['NODE_ENV'] || 'development';
const shouldOverride = nodeEnv !== 'production';
const candidates = [`.env.${nodeEnv}`, `env.${nodeEnv}`, '.env', 'env'];
for (const file of candidates) {
	try {
		config({ path: file, override: shouldOverride });
	} catch {}
}

export interface EnvironmentConfig {
	node_env: string;
	aws_region: string;
	dynamodb_table: string;
	weather_api_key: string;
	log_level: string;
	cache_ttl: number;
	aws_xray_daemon_address?: string;
	stage: string;
}

export const environment: EnvironmentConfig = {
	node_env: process.env['NODE_ENV'] || 'development',
	aws_region: process.env['AWS_REGION'] || 'us-east-1',
	dynamodb_table: process.env['DYNAMODB_TABLE'] || 'softtek-rimac-api-dev',
	weather_api_key: process.env['WEATHER_API_KEY'] || 'demo-key',
	log_level: process.env['LOG_LEVEL'] || 'info',
	cache_ttl: parseInt(process.env['CACHE_TTL'] || '1800', 10),
	aws_xray_daemon_address: process.env['AWS_XRAY_DAEMON_ADDRESS'],
	stage: process.env['STAGE'] || 'dev'
};

// Validate required environment variables
export function validateEnvironment(): void {
	const requiredVars = ['WEATHER_API_KEY'];
	const missingVars = requiredVars.filter(varName => !process.env[varName]);

	if (missingVars.length > 0) {
		logger.warn(`Missing environment variables: ${missingVars.join(', ')}`);
		
		if (environment.node_env === 'production') {
			throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
		}
	}

	logger.info('Environment configuration loaded', {
		NODE_ENV: environment.node_env,
		STAGE: environment.stage,
		AWS_REGION: environment.aws_region,
		DYNAMODB_TABLE: environment.dynamodb_table,
		LOG_LEVEL: environment.log_level,
		CACHE_TTL: environment.cache_ttl
	});
}

// Export individual config values for convenience
export const {
	node_env: NODE_ENV,
	aws_region: AWS_REGION,
	dynamodb_table: DYNAMODB_TABLE,
	weather_api_key: WEATHER_API_KEY,
	log_level: LOG_LEVEL,
	cache_ttl: CACHE_TTL,
	aws_xray_daemon_address: AWS_XRAY_DAEMON_ADDRESS,
	stage: STAGE
} = environment; 