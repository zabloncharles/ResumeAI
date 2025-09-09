export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  url?: boolean;
  custom?: (value: string) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class InputValidator {
  static validateField(value: string, rules: ValidationRule): ValidationResult {
    const errors: string[] = [];
    const trimmedValue = value.trim();

    // Required validation
    if (rules.required && !trimmedValue) {
      errors.push('This field is required');
      return { isValid: false, errors };
    }

    // Skip other validations if empty and not required
    if (!trimmedValue && !rules.required) {
      return { isValid: true, errors: [] };
    }

    // Length validations
    if (rules.minLength && trimmedValue.length < rules.minLength) {
      errors.push(`Must be at least ${rules.minLength} characters long`);
    }

    if (rules.maxLength && trimmedValue.length > rules.maxLength) {
      errors.push(`Must be no more than ${rules.maxLength} characters long`);
    }

    // Email validation
    if (rules.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedValue)) {
        errors.push('Please enter a valid email address');
      }
    }

    // URL validation
    if (rules.url) {
      try {
        new URL(trimmedValue);
      } catch {
        errors.push('Please enter a valid URL');
      }
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(trimmedValue)) {
      errors.push('Invalid format');
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(trimmedValue);
      if (customError) {
        errors.push(customError);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateForm(data: Record<string, string>, rules: Record<string, ValidationRule>): ValidationResult {
    const allErrors: string[] = [];
    
    for (const [field, fieldRules] of Object.entries(rules)) {
      const fieldValue = data[field] || '';
      const fieldResult = this.validateField(fieldValue, fieldRules);
      
      if (!fieldResult.isValid) {
        allErrors.push(...fieldResult.errors.map(error => `${field}: ${error}`));
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    };
  }
}

// Common validation rules
export const CommonValidations = {
  email: { required: true, email: true, maxLength: 254 },
  password: { required: true, minLength: 8, maxLength: 128 },
  name: { required: true, minLength: 2, maxLength: 100 },
  phone: { 
    pattern: /^[\+]?[1-9][\d]{0,15}$/, 
    custom: (value: string) => {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length < 10 || cleaned.length > 15) {
        return 'Phone number must be 10-15 digits';
      }
      return null;
    }
  },
  url: { url: true, maxLength: 2048 },
  jobTitle: { required: true, minLength: 2, maxLength: 100 },
  company: { required: true, minLength: 2, maxLength: 100 },
  description: { maxLength: 1000 },
  location: { maxLength: 100 }
};
