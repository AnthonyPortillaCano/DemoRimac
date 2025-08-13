import { CustomData, DatabaseItem, FusedData, PaginatedResponse, QueryParams } from '../types';
export interface PersistenceProvider {
    storeFusedData(data: FusedData): Promise<string>;
    storeCustomData(data: CustomData): Promise<string>;
    getItemById(id: string): Promise<DatabaseItem | null>;
    getFusedDataHistory(params?: QueryParams): Promise<PaginatedResponse<FusedData>>;
    getCustomData(params?: QueryParams): Promise<PaginatedResponse<CustomData>>;
    deleteItem(id: string): Promise<void>;
    cleanupExpiredItems(): Promise<void>;
}
export declare function getDatabaseService(): PersistenceProvider;
//# sourceMappingURL=persistenceService.d.ts.map