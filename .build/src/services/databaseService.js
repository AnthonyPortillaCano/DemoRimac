"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const logger_1 = require("../utils/logger");
class DatabaseService {
    client;
    tableName;
    constructor() {
        const dynamoClient = new client_dynamodb_1.DynamoDBClient({
            region: process.env.AWS_REGION || 'us-east-1'
        });
        this.client = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
        this.tableName = process.env.DYNAMODB_TABLE || 'softtek-rimac-api-dev';
    }
    async storeFusedData(data) {
        try {
            const id = `fused_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const item = {
                id,
                type: 'fused',
                timestamp: Date.now(),
                data,
                ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
            };
            await this.client.send(new lib_dynamodb_1.PutCommand({
                TableName: this.tableName,
                Item: item
            }));
            logger_1.logger.info(`Stored fused data with ID: ${id}`);
            return id;
        }
        catch (error) {
            logger_1.logger.error('Error storing fused data:', error);
            throw new Error('Failed to store fused data');
        }
    }
    async storeCustomData(data) {
        try {
            const item = {
                id: data.id,
                type: 'custom',
                timestamp: Date.now(),
                data
            };
            await this.client.send(new lib_dynamodb_1.PutCommand({
                TableName: this.tableName,
                Item: item
            }));
            logger_1.logger.info(`Stored custom data with ID: ${data.id}`);
            return data.id;
        }
        catch (error) {
            logger_1.logger.error('Error storing custom data:', error);
            throw new Error('Failed to store custom data');
        }
    }
    async getItemById(id) {
        try {
            const response = await this.client.send(new lib_dynamodb_1.GetCommand({
                TableName: this.tableName,
                Key: { id }
            }));
            return response.Item || null;
        }
        catch (error) {
            logger_1.logger.error('Error getting item by ID:', error);
            throw new Error('Failed to get item');
        }
    }
    async getFusedDataHistory(params = {}) {
        try {
            const page = params.page ?? 1;
            const limit = params.limit ?? 10;
            let lastEvaluatedKey = undefined;
            for (let i = 1; i < page; i++) {
                const warmup = await this.client.send(new lib_dynamodb_1.QueryCommand({
                    TableName: this.tableName,
                    IndexName: 'timestamp-index',
                    KeyConditionExpression: '#type = :type',
                    ExpressionAttributeNames: { '#type': 'type' },
                    ExpressionAttributeValues: { ':type': 'fused' },
                    ScanIndexForward: false,
                    Limit: limit,
                    ExclusiveStartKey: lastEvaluatedKey
                }));
                if (!warmup.LastEvaluatedKey) {
                    lastEvaluatedKey = undefined;
                    break;
                }
                lastEvaluatedKey = warmup.LastEvaluatedKey;
            }
            const response = await this.client.send(new lib_dynamodb_1.QueryCommand({
                TableName: this.tableName,
                IndexName: 'timestamp-index',
                KeyConditionExpression: '#type = :type',
                ExpressionAttributeNames: { '#type': 'type' },
                ExpressionAttributeValues: { ':type': 'fused' },
                ScanIndexForward: false,
                Limit: limit,
                ExclusiveStartKey: lastEvaluatedKey
            }));
            const items = (response.Items || []);
            const fusedData = items.map(item => item.data);
            const countResponse = await this.client.send(new lib_dynamodb_1.QueryCommand({
                TableName: this.tableName,
                IndexName: 'timestamp-index',
                KeyConditionExpression: '#type = :type',
                ExpressionAttributeNames: { '#type': 'type' },
                ExpressionAttributeValues: { ':type': 'fused' },
                Select: 'COUNT'
            }));
            const total = countResponse.Count || 0;
            return {
                items: fusedData,
                total,
                page,
                limit,
                hasNext: Boolean(response.LastEvaluatedKey),
                hasPrev: page > 1
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting fused data history:', error);
            throw new Error('Failed to get fused data history');
        }
    }
    async getCustomData(params = {}) {
        try {
            const page = params.page ?? 1;
            const limit = params.limit ?? 10;
            let lastEvaluatedKey = undefined;
            for (let i = 1; i < page; i++) {
                const warmup = await this.client.send(new lib_dynamodb_1.QueryCommand({
                    TableName: this.tableName,
                    IndexName: 'type-index',
                    KeyConditionExpression: '#type = :type',
                    ExpressionAttributeNames: { '#type': 'type' },
                    ExpressionAttributeValues: { ':type': 'custom' },
                    ScanIndexForward: false,
                    Limit: limit,
                    ExclusiveStartKey: lastEvaluatedKey
                }));
                if (!warmup.LastEvaluatedKey) {
                    lastEvaluatedKey = undefined;
                    break;
                }
                lastEvaluatedKey = warmup.LastEvaluatedKey;
            }
            const queryParams = {
                TableName: this.tableName,
                IndexName: 'type-index',
                KeyConditionExpression: '#type = :type',
                ExpressionAttributeNames: { '#type': 'type' },
                ExpressionAttributeValues: { ':type': 'custom' },
                ScanIndexForward: false,
                Limit: limit,
                ExclusiveStartKey: lastEvaluatedKey
            };
            if (params.category) {
                queryParams.FilterExpression = '#data.category = :category';
                queryParams.ExpressionAttributeNames['#data'] = 'data';
                queryParams.ExpressionAttributeValues[':category'] = params.category;
            }
            const response = await this.client.send(new lib_dynamodb_1.QueryCommand(queryParams));
            const items = (response.Items || []);
            const customData = items.map(item => item.data);
            return {
                items: customData,
                total: (response.Count || customData.length),
                page,
                limit,
                hasNext: Boolean(response.LastEvaluatedKey),
                hasPrev: page > 1
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting custom data:', error);
            throw new Error('Failed to get custom data');
        }
    }
    async deleteItem(id) {
        try {
            await this.client.send(new lib_dynamodb_1.DeleteCommand({
                TableName: this.tableName,
                Key: { id }
            }));
            logger_1.logger.info(`Deleted item with ID: ${id}`);
        }
        catch (error) {
            logger_1.logger.error('Error deleting item:', error);
            throw new Error('Failed to delete item');
        }
    }
    async cleanupExpiredItems() {
        try {
            const now = Math.floor(Date.now() / 1000);
            const response = await this.client.send(new lib_dynamodb_1.ScanCommand({
                TableName: this.tableName,
                FilterExpression: '#ttl < :now',
                ExpressionAttributeNames: {
                    '#ttl': 'ttl'
                },
                ExpressionAttributeValues: {
                    ':now': now
                }
            }));
            const expiredItems = response.Items || [];
            for (const item of expiredItems) {
                await this.deleteItem(item.id);
            }
            logger_1.logger.info(`Cleaned up ${expiredItems.length} expired items`);
        }
        catch (error) {
            logger_1.logger.error('Error cleaning up expired items:', error);
        }
    }
}
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=databaseService.js.map