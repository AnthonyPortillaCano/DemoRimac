import mysql from 'mysql2/promise';
import { CustomData, DatabaseItem, FusedData, PaginatedResponse, QueryParams } from '../types';
import { logger } from '../utils/logger';

export class MysqlService {
  private pool!: mysql.Pool;
  private readonly tableName: string;
  private readonly config: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };

  constructor() {
    const host = process.env['MYSQL_HOST'] || 'localhost';
    const port = parseInt(process.env['MYSQL_PORT'] || '3306', 10);
    const user = process.env['MYSQL_USER'] || 'root';
    const password = process.env['MYSQL_PASSWORD'] || '';
    const database = process.env['MYSQL_DATABASE'] || 'softtek_rimac';

    this.tableName = process.env['MYSQL_TABLE'] || 'items';
    this.config = { host, port, user, password, database };

    // Initialize lazily
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.ensureDatabase();
    this.pool = mysql.createPool({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database,
      connectionLimit: 4,
      enableKeepAlive: true
    });
    await this.ensureTable();
  }

  private async ensureDatabase(): Promise<void> {
    const { host, port, user, password, database } = this.config;
    const conn = await mysql.createConnection({ host, port, user, password });
    try {
      await conn.execute(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
      logger.info(`MySQL: ensured database ${database}`);
    } finally {
      await conn.end();
    }
  }

  private async ensureTable(): Promise<void> {
    const create = `CREATE TABLE IF NOT EXISTS ${this.tableName} (
      id VARCHAR(100) NOT NULL,
      type ENUM('fused','custom') NOT NULL,
      timestamp BIGINT NOT NULL,
      data JSON NOT NULL,
      ttl BIGINT NULL,
      PRIMARY KEY (id),
      KEY idx_type_timestamp (type, timestamp)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;
    await this.pool.execute(create);
    logger.info(`MySQL: ensured table ${this.tableName}`);
  }

  private async getPool(): Promise<mysql.Pool> {
    if (!this.pool) {
      await this.initialize();
    }
    return this.pool;
  }

  async storeFusedData(data: FusedData): Promise<string> {
    const id = `fused_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();
    const ttl = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

    const sql = `INSERT INTO ${this.tableName} (id, type, timestamp, data, ttl)
                 VALUES (?, 'fused', ?, ?, ?)`;
    const params = [id, timestamp, JSON.stringify(data), ttl];

    try {
      const pool = await this.getPool();
      await pool.execute(sql, params);
      logger.info(`MySQL: Stored fused data with ID: ${id}`);
      return id;
    } catch (error) {
      logger.error('MySQL: Error storing fused data:', error);
      throw new Error('Failed to store fused data');
    }
  }

  async storeCustomData(data: CustomData): Promise<string> {
    const timestamp = Date.now();
    const id = data.id;

    const item: DatabaseItem = {
      id,
      type: 'custom',
      timestamp,
      data
    };

    const sql = `INSERT INTO ${this.tableName} (id, type, timestamp, data)
                 VALUES (?, 'custom', ?, ?)
                 ON DUPLICATE KEY UPDATE timestamp = VALUES(timestamp), data = VALUES(data)`;
    const params = [item.id, item.timestamp, JSON.stringify(item.data)];

    try {
      const pool = await this.getPool();
      await pool.execute(sql, params);
      logger.info(`MySQL: Stored custom data with ID: ${id}`);
      return id;
    } catch (error) {
      logger.error('MySQL: Error storing custom data:', error);
      throw new Error('Failed to store custom data');
    }
  }

  async getItemById(id: string): Promise<DatabaseItem | null> {
    const sql = `SELECT id, type, timestamp, data, ttl FROM ${this.tableName} WHERE id = ? LIMIT 1`;
    try {
      const pool = await this.getPool();
      const [rows] = await pool.execute(sql, [id]);
      const result = rows as Array<{ id: string; type: 'fused' | 'custom'; timestamp: number; data: string; ttl?: number }>;
      if (result.length === 0) return null;
      const row = result[0];
      return {
        id: row.id,
        type: row.type,
        timestamp: row.timestamp,
        data: JSON.parse(row.data),
        ttl: row.ttl
      } as DatabaseItem;
    } catch (error) {
      logger.error('MySQL: Error getting item by ID:', error);
      throw new Error('Failed to get item');
    }
  }

  async getFusedDataHistory(params: QueryParams = {}): Promise<PaginatedResponse<FusedData>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const offset = (page - 1) * limit;

    try {
      const pool = await this.getPool();
      const [rows] = await pool.execute(
        `SELECT data FROM ${this.tableName} WHERE type = 'fused' ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      const items = rows as Array<{ data: string }>;
      const fused = items.map(r => JSON.parse(r.data) as FusedData);

      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as total FROM ${this.tableName} WHERE type = 'fused'`
      );
      const total = (countRows as Array<{ total: number }>)[0]?.total ?? 0;

      return {
        items: fused,
        total,
        page,
        limit,
        hasNext: offset + limit < total,
        hasPrev: page > 1
      };
    } catch (error) {
      logger.error('MySQL: Error getting fused data history:', error);
      throw new Error('Failed to get fused data history');
    }
  }

  async getCustomData(params: QueryParams = {}): Promise<PaginatedResponse<CustomData>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const offset = (page - 1) * limit;

    try {
      const pool = await this.getPool();
      let base = `SELECT data FROM ${this.tableName} WHERE type = 'custom'`;
      const args: any[] = [];
      if (params.category) {
        base += ` AND JSON_EXTRACT(data, '$.category') = ?`;
        args.push(params.category);
      }
      base += ` ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
      args.push(limit, offset);

      const [rows] = await pool.execute(base, args);
      const items = rows as Array<{ data: string }>;
      const custom = items.map(r => JSON.parse(r.data) as CustomData);

      const [countRows] = await pool.execute(
        `SELECT COUNT(*) as total FROM ${this.tableName} WHERE type = 'custom'`
      );
      const total = (countRows as Array<{ total: number }>)[0]?.total ?? 0;

      return {
        items: custom,
        total,
        page,
        limit,
        hasNext: offset + limit < total,
        hasPrev: page > 1
      };
    } catch (error) {
      logger.error('MySQL: Error getting custom data:', error);
      throw new Error('Failed to get custom data');
    }
  }

  async deleteItem(id: string): Promise<void> {
    try {
      const pool = await this.getPool();
      await pool.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
      logger.info(`MySQL: Deleted item with ID: ${id}`);
    } catch (error) {
      logger.error('MySQL: Error deleting item:', error);
      throw new Error('Failed to delete item');
    }
  }

  async cleanupExpiredItems(): Promise<void> {
    try {
      const pool = await this.getPool();
      const now = Math.floor(Date.now() / 1000);
      const [result] = await pool.execute(`DELETE FROM ${this.tableName} WHERE ttl IS NOT NULL AND ttl < ?`, [now]);
      const info = result as mysql.ResultSetHeader;
      logger.info(`MySQL: Cleaned up ${info.affectedRows ?? 0} expired items`);
    } catch (error) {
      logger.error('MySQL: Error cleaning up expired items:', error);
    }
  }
} 