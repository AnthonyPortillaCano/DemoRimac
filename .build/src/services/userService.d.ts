export interface UserRecord {
    id: string;
    email: string;
    password_hash: string;
    role: 'user' | 'admin';
    created_at: number;
}
export declare class UserService {
    private pool;
    private readonly config;
    constructor();
    private initialize;
    private ensureDatabase;
    private ensureTable;
    private getPool;
    createUser(email: string, password: string, role?: 'user' | 'admin'): Promise<UserRecord>;
    getUserByEmail(email: string): Promise<UserRecord | null>;
    verifyCredentials(email: string, password: string): Promise<UserRecord | null>;
}
//# sourceMappingURL=userService.d.ts.map