import { CustomData, DatabaseItem, FusedData, PaginatedResponse, QueryParams } from '../types';
export declare class MysqlService {
    private pool;
    private readonly tableName;
    private readonly config;
    constructor();
    private initialize;
    private ensureDatabase;
    private ensureTable;
    private getPool;
    storeFusedData(data: FusedData): Promise<string>;
    storeCustomData(data: CustomData): Promise<string>;
    getItemById(id: string): Promise<DatabaseItem | null>;
    getFusedDataHistory(params?: QueryParams): Promise<PaginatedResponse<FusedData>>;
    getCustomData(params?: QueryParams): Promise<PaginatedResponse<CustomData>>;
    deleteItem(id: string): Promise<void>;
    cleanupExpiredItems(): Promise<void>;
}
//# sourceMappingURL=mysqlService.d.ts.map