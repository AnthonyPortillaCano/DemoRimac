"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseService = getDatabaseService;
const databaseService_1 = require("./databaseService");
const mysqlService_1 = require("./mysqlService");
function getDatabaseService() {
    const engine = (process.env['DB_ENGINE'] || 'dynamo').toLowerCase();
    if (engine === 'mysql') {
        return new mysqlService_1.MysqlService();
    }
    return new databaseService_1.DatabaseService();
}
//# sourceMappingURL=persistenceService.js.map