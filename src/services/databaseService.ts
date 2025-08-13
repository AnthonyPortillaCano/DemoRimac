import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DatabaseItem, FusedData, CustomData, PaginatedResponse, QueryParams } from '../types';
import { logger } from '../utils/logger';

export class DatabaseService {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor() {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = process.env.DYNAMODB_TABLE || 'softtek-rimac-api-dev';
  }

  /**
   * Store fused data from APIs
   */
  async storeFusedData(data: FusedData): Promise<string> {
    try {
      const id = `fused_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const item: DatabaseItem = {
        id,
        type: 'fused',
        timestamp: Date.now(),
        data,
        ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours TTL
      };

      await this.client.send(new PutCommand({
        TableName: this.tableName,
        Item: item
      }));

      logger.info(`Stored fused data with ID: ${id}`);
      return id;
    } catch (error) {
      logger.error('Error storing fused data:', error);
      throw new Error('Failed to store fused data');
    }
  }

  /**
   * Store custom data
   */
  async storeCustomData(data: CustomData): Promise<string> {
    try {
      const item: DatabaseItem = {
        id: data.id,
        type: 'custom',
        timestamp: Date.now(),
        data
      };

      await this.client.send(new PutCommand({
        TableName: this.tableName,
        Item: item
      }));

      logger.info(`Stored custom data with ID: ${data.id}`);
      return data.id;
    } catch (error) {
      logger.error('Error storing custom data:', error);
      throw new Error('Failed to store custom data');
    }
  }

  /**
   * Get item by ID
   */
  async getItemById(id: string): Promise<DatabaseItem | null> {
    try {
      const response = await this.client.send(new GetCommand({
        TableName: this.tableName,
        Key: { id }
      }));

      return response.Item as DatabaseItem || null;
    } catch (error) {
      logger.error('Error getting item by ID:', error);
      throw new Error('Failed to get item');
    }
  }

  /**
   * Get fused data history with pagination
   */
  async getFusedDataHistory(params: QueryParams = {}): Promise<PaginatedResponse<FusedData>> {
    try {
      const page = params.page ?? 1;
      const limit = params.limit ?? 10;

      let lastEvaluatedKey: Record<string, unknown> | undefined = undefined;
      // Walk pages (inefficient but correct without a page token)
      for (let i = 1; i < page; i++) {
        const warmup = await this.client.send(new QueryCommand({
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
          // No more pages
          lastEvaluatedKey = undefined;
          break;
        }
        lastEvaluatedKey = warmup.LastEvaluatedKey as Record<string, unknown>;
      }

      const response = await this.client.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'timestamp-index',
        KeyConditionExpression: '#type = :type',
        ExpressionAttributeNames: { '#type': 'type' },
        ExpressionAttributeValues: { ':type': 'fused' },
        ScanIndexForward: false,
        Limit: limit,
        ExclusiveStartKey: lastEvaluatedKey
      }));

      const items = (response.Items || []) as DatabaseItem[];
      const fusedData = items.map(item => item.data as FusedData);

      // Count (best-effort; may be approximate for large datasets)
      const countResponse = await this.client.send(new QueryCommand({
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
    } catch (error) {
      logger.error('Error getting fused data history:', error);
      throw new Error('Failed to get fused data history');
    }
  }

  /**
   * Get custom data with pagination
   */
  async getCustomData(params: QueryParams = {}): Promise<PaginatedResponse<CustomData>> {
    try {
      const page = params.page ?? 1;
      const limit = params.limit ?? 10;

      let lastEvaluatedKey: Record<string, unknown> | undefined = undefined;
      for (let i = 1; i < page; i++) {
        const warmup = await this.client.send(new QueryCommand({
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
        lastEvaluatedKey = warmup.LastEvaluatedKey as Record<string, unknown>;
      }

      const queryParams: any = {
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

      const response = await this.client.send(new QueryCommand(queryParams));

      const items = (response.Items || []) as DatabaseItem[];
      const customData = items.map(item => item.data as CustomData);

      return {
        items: customData,
        total: (response.Count || customData.length),
        page,
        limit,
        hasNext: Boolean(response.LastEvaluatedKey),
        hasPrev: page > 1
      };
    } catch (error) {
      logger.error('Error getting custom data:', error);
      throw new Error('Failed to get custom data');
    }
  }

  /**
   * Delete item by ID
   */
  async deleteItem(id: string): Promise<void> {
    try {
      await this.client.send(new DeleteCommand({
        TableName: this.tableName,
        Key: { id }
      }));

      logger.info(`Deleted item with ID: ${id}`);
    } catch (error) {
      logger.error('Error deleting item:', error);
      throw new Error('Failed to delete item');
    }
  }

  /**
   * Clean up expired items
   */
  async cleanupExpiredItems(): Promise<void> {
    try {
      const now = Math.floor(Date.now() / 1000);
      
      const response = await this.client.send(new ScanCommand({
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
        await this.deleteItem((item as any).id);
      }

      logger.info(`Cleaned up ${expiredItems.length} expired items`);
    } catch (error) {
      logger.error('Error cleaning up expired items:', error);
    }
  }
} 