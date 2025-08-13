import { CustomData, QueryParams, ValidationError } from '../types';
export declare class ValidationService {
    validateCustomData(data: unknown): {
        value: CustomData;
        error?: ValidationError;
    };
    validateQueryParams(params: unknown): {
        value: QueryParams;
        error?: ValidationError;
    };
    validateDateRange(startDate: number, endDate: number): boolean;
    sanitizeString(input: string): string;
    validateAndSanitizeTags(tags: string[]): string[];
    validateMetadata(metadata: unknown): Record<string, unknown>;
}
//# sourceMappingURL=validationService.d.ts.map