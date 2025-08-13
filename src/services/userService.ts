import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
  created_at: number;
}

export class UserService {
  private pool!: mysql.Pool;
  private readonly config: { host: string; port: number; user: string; password: string; database: string };

  constructor() {
    const host = process.env['MYSQL_HOST'] || 'localhost';
    const port = parseInt(process.env['MYSQL_PORT'] || '3306', 10);
    const user = process.env['MYSQL_USER'] || 'root';
    const password = process.env['MYSQL_PASSWORD'] || '';
    const database = process.env['MYSQL_DATABASE'] || 'softtek_rimac';

    this.config = { host, port, user, password, database };

    // Lazy init
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
    } finally {
      await conn.end();
    }
  }

  private async ensureTable(): Promise<void> {
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

  private async getPool(): Promise<mysql.Pool> {
    if (!this.pool) await this.initialize();
    return this.pool;
  }

  async createUser(email: string, password: string, role: 'user' | 'admin' = 'user'): Promise<UserRecord> {
    const existing = await this.getUserByEmail(email);
    if (existing) {
      throw new Error('Email already registered');
    }
    const id = cryptoRandomId();
    const password_hash = await bcrypt.hash(password, 10);
    const created_at = Date.now();

    const sql = `INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)`;
    const args = [id, email, password_hash, role, created_at];
    const pool = await this.getPool();
    await pool.execute(sql, args);

    logger.info('User created', { email, role });
    return { id, email, password_hash, role, created_at };
  }

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    const pool = await this.getPool();
    const [rows] = await pool.execute(`SELECT id, email, password_hash, role, created_at FROM users WHERE email = ? LIMIT 1`, [email]);
    const list = rows as Array<UserRecord>;
    return list.length ? list[0] : null;
  }

  async verifyCredentials(email: string, password: string): Promise<UserRecord | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password_hash);
    return ok ? user : null;
  }
}

function cryptoRandomId(): string {
  const rnd = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return `${ts}-${rnd}`;
} 