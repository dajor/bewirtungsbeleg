import { useState, useCallback } from 'react';
import { z } from 'zod';
import { sanitizeInput } from '@/lib/validation';

interface ValidationError {
  field: string;
  message: string;
}

export function useFormValidation<T extends z.ZodSchema>(schema: T) {
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const validate = useCallback((data: unknown): z.infer<T> | null => {
    try {
      const validated = schema.parse(data);
      setErrors([]);
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors: ValidationError[] = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        setErrors(validationErrors);
      }
      return null;
    }
  }, [schema]);

  const getFieldError = useCallback((field: string): string | undefined => {
    const error = errors.find((err) => err.field === field);
    return error?.message;
  }, [errors]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const sanitizeFormData = useCallback(<T extends Record<string, any>>(data: T): T => {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      } else if (value instanceof File) {
        // Don't sanitize File objects
        sanitized[key] = value;
      } else if (value instanceof Date) {
        sanitized[key] = value;
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeFormData(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }, []);

  return {
    validate,
    errors,
    getFieldError,
    clearErrors,
    sanitizeFormData,
  };
}