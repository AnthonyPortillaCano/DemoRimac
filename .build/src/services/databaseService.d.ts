import { DatabaseItem, FusedData, CustomData, PaginatedResponse, QueryParams } from '../types';
export declare class DatabaseService {
    private readonly client;
    private readonly tableName;
    constructor();
    storeFusedData(data: FusedData): Promise<string>;
    storeCustomData(data: CustomData): Promise<string>;
    getItemById(id: string): Promise<DatabaseItem | null>;
    getFusedDataHistory(params?: QueryParams): Promise<PaginatedResponse<FusedData>>;
    getCustomData(params?: QueryParams): Promise<PaginatedResponse<CustomData>>;
    deleteItem(id: string): Promise<void>;
    cleanupExpiredItems(): Promise<void>;
}
//# sourceMappingURL=databaseService.d.ts.map