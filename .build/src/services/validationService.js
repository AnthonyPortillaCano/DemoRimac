"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationService = void 0;
const joi_1 = __importDefault(require("joi"));
class ValidationService {
    validateCustomData(data) {
        const schema = joi_1.default.object({
            title: joi_1.default.string().required().min(1).max(200),
            description: joi_1.default.string().required().min(1).max(1000),
            category: joi_1.default.string().required().min(1).max(100),
            tags: joi_1.default.array().items(joi_1.default.string().min(1).max(50)).max(20),
            metadata: joi_1.default.object().unknown()
        });
        const { error, value } = schema.validate(data);
        if (error) {
            return {
                value: {},
                error: {
                    field: error.details[0]?.path.join('.') || 'unknown',
                    message: error.details[0]?.message || 'Validation error'
                }
            };
        }
        return { value: value };
    }
    validateQueryParams(params) {
        const schema = joi_1.default.object({
            page: joi_1.default.number().integer().min(1).default(1),
            limit: joi_1.default.number().integer().min(1).max(100).default(10),
            type: joi_1.default.string().valid('fused', 'custom'),
            category: joi_1.default.string().min(1).max(100),
            startDate: joi_1.default.number().integer().min(0),
            endDate: joi_1.default.number().integer().min(0)
        });
        const { error, value } = schema.validate(params);
        if (error) {
            return {
                value: {},
                error: {
                    field: error.details[0]?.path.join('.') || 'unknown',
                    message: error.details[0]?.message || 'Validation error'
                }
            };
        }
        return { value: value };
    }
    validateDateRange(startDate, endDate) {
        if (startDate && endDate && startDate > endDate) {
            return false;
        }
        return true;
    }
    sanitizeString(input) {
        return input
            .trim()
            .replace(/[<>]/g, '')
            .substring(0, 1000);
    }
    validateAndSanitizeTags(tags) {
        if (!Array.isArray(tags))
            return [];
        return tags
            .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
            .map(tag => this.sanitizeString(tag.trim()))
            .filter(tag => tag.length <= 50)
            .slice(0, 20);
    }
    validateMetadata(metadata) {
        if (typeof metadata !== 'object' || metadata === null) {
            return {};
        }
        const validMetadata = {};
        const entries = Object.entries(metadata);
        for (const [key, value] of entries.slice(0, 50)) {
            if (typeof key === 'string' && key.length <= 100) {
                const sanitizedKey = this.sanitizeString(key);
                if (sanitizedKey) {
                    validMetadata[sanitizedKey] = value;
                }
            }
        }
        return validMetadata;
    }
}
exports.ValidationService = ValidationService;
//# sourceMappingURL=validationService.js.map