"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MysqlService = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const logger_1 = require("../utils/logger");
class MysqlService {
    pool;
    tableName;
    config;
    constructor() {
        const host = process.env['MYSQL_HOST'] || 'localhost';
        const port = parseInt(process.env['MYSQL_PORT'] || '3306', 10);
        const user = process.env['MYSQL_USER'] || 'root';
        const password = process.env['MYSQL_PASSWORD'] || '';
        const database = process.env['MYSQL_DATABASE'] || 'softtek_rimac';
        this.tableName = process.env['MYSQL_TABLE'] || 'items';
        this.config = { host, port, user, password, database };
        this.initialize();
    }
    async initialize() {
        await this.ensureDatabase();
        this.pool = promise_1.default.createPool({
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
    async ensureDatabase() {
        const { host, port, user, password, database } = this.config;
        const conn = await promise_1.default.createConnection({ host, port, user, password });
        try {
            await conn.execute(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
            logger_1.logger.info(`MySQL: ensured database ${database}`);
        }
        finally {
            await conn.end();
        }
    }
    async ensureTable() {
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
        logger_1.logger.info(`MySQL: ensured table ${this.tableName}`);
    }
    async getPool() {
        if (!this.pool) {
            await this.initialize();
        }
        return this.pool;
    }
    async storeFusedData(data) {
        const id = `fused_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = Date.now();
        const ttl = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
        const sql = `INSERT INTO ${this.tableName} (id, type, timestamp, data, ttl)
                 VALUES (?, 'fused', ?, ?, ?)`;
        const params = [id, timestamp, JSON.stringify(data), ttl];
        try {
            const pool = await this.getPool();
            await pool.execute(sql, params);
            logger_1.logger.info(`MySQL: Stored fused data with ID: ${id}`);
            return id;
        }
        catch (error) {
            logger_1.logger.error('MySQL: Error storing fused data:', error);
            throw new Error('Failed to store fused data');
        }
    }
    async storeCustomData(data) {
        const timestamp = Date.now();
        const id = data.id;
        const item = {
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
            logger_1.logger.info(`MySQL: Stored custom data with ID: ${id}`);
            return id;
        }
        catch (error) {
            logger_1.logger.error('MySQL: Error storing custom data:', error);
            throw new Error('Failed to store custom data');
        }
    }
    async getItemById(id) {
        const sql = `SELECT id, type, timestamp, data, ttl FROM ${this.tableName} WHERE id = ? LIMIT 1`;
        try {
            const pool = await this.getPool();
            const [rows] = await pool.execute(sql, [id]);
            const result = rows;
            if (result.length === 0)
                return null;
            const row = result[0];
            return {
                id: row.id,
                type: row.type,
                timestamp: row.timestamp,
                data: JSON.parse(row.data),
                ttl: row.ttl
            };
        }
        catch (error) {
            logger_1.logger.error('MySQL: Error getting item by ID:', error);
            throw new Error('Failed to get item');
        }
    }
    async getFusedDataHistory(params = {}) {
        const page = params.page ?? 1;
        const limit = params.limit ?? 10;
        const offset = (page - 1) * limit;
        try {
            const pool = await this.getPool();
            const [rows] = await pool.execute(`SELECT data FROM ${this.tableName} WHERE type = 'fused' ORDER BY timestamp DESC LIMIT ? OFFSET ?`, [limit, offset]);
            const items = rows;
            const fused = items.map(r => JSON.parse(r.data));
            const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM ${this.tableName} WHERE type = 'fused'`);
            const total = countRows[0]?.total ?? 0;
            return {
                items: fused,
                total,
                page,
                limit,
                hasNext: offset + limit < total,
                hasPrev: page > 1
            };
        }
        catch (error) {
            logger_1.logger.error('MySQL: Error getting fused data history:', error);
            throw new Error('Failed to get fused data history');
        }
    }
    async getCustomData(params = {}) {
        const page = params.page ?? 1;
        const limit = params.limit ?? 10;
        const offset = (page - 1) * limit;
        try {
            const pool = await this.getPool();
            let base = `SELECT data FROM ${this.tableName} WHERE type = 'custom'`;
            const args = [];
            if (params.category) {
                base += ` AND JSON_EXTRACT(data, '$.category') = ?`;
                args.push(params.category);
            }
            base += ` ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
            args.push(limit, offset);
            const [rows] = await pool.execute(base, args);
            const items = rows;
            const custom = items.map(r => JSON.parse(r.data));
            const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM ${this.tableName} WHERE type = 'custom'`);
            const total = countRows[0]?.total ?? 0;
            return {
                items: custom,
                total,
                page,
                limit,
                hasNext: offset + limit < total,
                hasPrev: page > 1
            };
        }
        catch (error) {
            logger_1.logger.error('MySQL: Error getting custom data:', error);
            throw new Error('Failed to get custom data');
        }
    }
    async deleteItem(id) {
        try {
            const pool = await this.getPool();
            await pool.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
            logger_1.logger.info(`MySQL: Deleted item with ID: ${id}`);
        }
        catch (error) {
            logger_1.logger.error('MySQL: Error deleting item:', error);
            throw new Error('Failed to delete item');
        }
    }
    async cleanupExpiredItems() {
        try {
            const pool = await this.getPool();
            const now = Math.floor(Date.now() / 1000);
            const [result] = await pool.execute(`DELETE FROM ${this.tableName} WHERE ttl IS NOT NULL AND ttl < ?`, [now]);
            const info = result;
            logger_1.logger.info(`MySQL: Cleaned up ${info.affectedRows ?? 0} expired items`);
        }
        catch (error) {
            logger_1.logger.error('MySQL: Error cleaning up expired items:', error);
        }
    }
}
exports.MysqlService = MysqlService;
//# sourceMappingURL=mysqlService.js.map