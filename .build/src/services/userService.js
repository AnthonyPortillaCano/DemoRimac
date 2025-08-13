"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = require("../utils/logger");
class UserService {
    pool;
    config;
    constructor() {
        const host = process.env['MYSQL_HOST'] || 'localhost';
        const port = parseInt(process.env['MYSQL_PORT'] || '3306', 10);
        const user = process.env['MYSQL_USER'] || 'root';
        const password = process.env['MYSQL_PASSWORD'] || '';
        const database = process.env['MYSQL_DATABASE'] || 'softtek_rimac';
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
        }
        finally {
            await conn.end();
        }
    }
    async ensureTable() {
        const sql = `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('user','admin') NOT NULL DEFAULT 'user',
      created_at BIGINT NOT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;
        await this.pool.execute(sql);
    }
    async getPool() {
        if (!this.pool)
            await this.initialize();
        return this.pool;
    }
    async createUser(email, password, role = 'user') {
        const existing = await this.getUserByEmail(email);
        if (existing) {
            throw new Error('Email already registered');
        }
        const id = cryptoRandomId();
        const password_hash = await bcryptjs_1.default.hash(password, 10);
        const created_at = Date.now();
        const sql = `INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)`;
        const args = [id, email, password_hash, role, created_at];
        const pool = await this.getPool();
        await pool.execute(sql, args);
        logger_1.logger.info('User created', { email, role });
        return { id, email, password_hash, role, created_at };
    }
    async getUserByEmail(email) {
        const pool = await this.getPool();
        const [rows] = await pool.execute(`SELECT id, email, password_hash, role, created_at FROM users WHERE email = ? LIMIT 1`, [email]);
        const list = rows;
        return list.length ? list[0] : null;
    }
    async verifyCredentials(email, password) {
        const user = await this.getUserByEmail(email);
        if (!user)
            return null;
        const ok = await bcryptjs_1.default.compare(password, user.password_hash);
        return ok ? user : null;
    }
}
exports.UserService = UserService;
function cryptoRandomId() {
    const rnd = Math.random().toString(36).slice(2, 10);
    const ts = Date.now().toString(36);
    return `${ts}-${rnd}`;
}
//# sourceMappingURL=userService.js.map