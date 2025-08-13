import Joi from 'joi';
import { CustomData, QueryParams, ValidationError } from '../types';

export class ValidationService {
  /**
   * Validate custom data for storage
   */
  validateCustomData(data: unknown): { value: CustomData; error?: ValidationError } {
    const schema = Joi.object({
      title: Joi.string().required().min(1).max(200),
      description: Joi.string().required().min(1).max(1000),
      category: Joi.string().required().min(1).max(100),
      tags: Joi.array().items(Joi.string().min(1).max(50)).max(20),
      metadata: Joi.object().unknown()
    });

    const { error, value } = schema.validate(data);

    if (error) {
      return {
        value: {} as CustomData,
        error: {
          field: error.details[0]?.path.join('.') || 'unknown',
          message: error.details[0]?.message || 'Validation error'
        }
      };
    }

    return { value: value as CustomData };
  }

  /**
   * Validate query parameters for pagination
   */
  validateQueryParams(params: unknown): { value: QueryParams; error?: ValidationError } {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      type: Joi.string().valid('fused', 'custom'),
      category: Joi.string().min(1).max(100),
      startDate: Joi.number().integer().min(0),
      endDate: Joi.number().integer().min(0)
    });

    const { error, value } = schema.validate(params);

    if (error) {
      return {
        value: {} as QueryParams,
        error: {
          field: error.details[0]?.path.join('.') || 'unknown',
          message: error.details[0]?.message || 'Validation error'
        }
      };
    }

    return { value: value as QueryParams };
  }

  /**
   * Validate date range
   */
  validateDateRange(startDate: number, endDate: number): boolean {
    if (startDate && endDate && startDate > endDate) {
      return false;
    }
    return true;
  }

  /**
   * Sanitize input strings
   */
  sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  }

  /**
   * Validate and sanitize tags
   */
  validateAndSanitizeTags(tags: string[]): string[] {
    if (!Array.isArray(tags)) return [];
    
    return tags
      .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
      .map(tag => this.sanitizeString(tag.trim()))
      .filter(tag => tag.length <= 50)
      .slice(0, 20); // Limit to 20 tags
  }

  /**
   * Validate metadata object
   */
  validateMetadata(metadata: unknown): Record<string, unknown> {
    if (typeof metadata !== 'object' || metadata === null) {
      return {};
    }

    const validMetadata: Record<string, unknown> = {};
    const entries = Object.entries(metadata as Record<string, unknown>);

    for (const [key, value] of entries.slice(0, 50)) { // Limit to 50 metadata fields
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