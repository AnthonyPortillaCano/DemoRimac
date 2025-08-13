import { CustomData, DatabaseItem, FusedData, PaginatedResponse, QueryParams } from '../types';
import { DatabaseService as DynamoDatabaseService } from './databaseService';
import { MysqlService } from './mysqlService';

export interface PersistenceProvider {
  storeFusedData(data: FusedData): Promise<string>;
  storeCustomData(data: CustomData): Promise<string>;
  getItemById(id: string): Promise<DatabaseItem | null>;
  getFusedDataHistory(params?: QueryParams): Promise<PaginatedResponse<FusedData>>;
  getCustomData(params?: QueryParams): Promise<PaginatedResponse<CustomData>>;
  deleteItem(id: string): Promise<void>;
  cleanupExpiredItems(): Promise<void>;
}

export function getDatabaseService(): PersistenceProvider {
  const engine = (process.env['DB_ENGINE'] || 'dynamo').toLowerCase();
  if (engine === 'mysql') {
    return new MysqlService() as unknown as PersistenceProvider;
  }
  return new DynamoDatabaseService() as unknown as PersistenceProvider;
} 