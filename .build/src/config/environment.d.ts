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
export declare const environment: EnvironmentConfig;
export declare function validateEnvironment(): void;
export declare const NODE_ENV: string, AWS_REGION: string, DYNAMODB_TABLE: string, WEATHER_API_KEY: string, LOG_LEVEL: string, CACHE_TTL: number, AWS_XRAY_DAEMON_ADDRESS: string | undefined, STAGE: string;
//# sourceMappingURL=environment.d.ts.map