/**
 * Input sanitization utilities to prevent XSS and other security issues
 */

export class InputSanitizer {
  /**
   * Sanitize HTML content by removing dangerous tags and attributes
   */
  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return '';
    
    // Remove script tags and their content
    let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove dangerous HTML tags
    const dangerousTags = [
      'script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 
      'button', 'select', 'option', 'link', 'meta', 'style'
    ];
    
    dangerousTags.forEach(tag => {
      const regex = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
      sanitized = sanitized.replace(regex, '');
    });
    
    // Remove javascript: and data: protocols
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/data:/gi, '');
    
    // Remove on* event handlers
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|\S+)/gi, '');
    
    return sanitized.trim();
  }

  /**
   * Sanitize plain text input
   */
  static sanitizeText(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/\0/g, ''); // Remove null bytes
  }

  /**
   * Sanitize email input
   */
  static sanitizeEmail(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .toLowerCase()
      .replace(/[^\w@.-]/g, ''); // Only allow word chars, @, ., and -
  }

  /**
   * Sanitize URL input
   */
  static sanitizeUrl(input: string): string {
    if (typeof input !== 'string') return '';
    
    const trimmed = input.trim();
    
    // Only allow http and https protocols
    if (trimmed && !trimmed.match(/^https?:\/\//i)) {
      return `https://${trimmed}`;
    }
    
    // Remove javascript: and data: protocols
    return trimmed
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '');
  }

  /**
   * Sanitize phone number input
   */
  static sanitizePhone(input: string): string {
    if (typeof input !== 'string') return '';
    
    // Keep only digits, +, -, (, ), and spaces
    return input.replace(/[^\d\+\-\(\)\s]/g, '').trim();
  }

  /**
   * Sanitize file name
   */
  static sanitizeFileName(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
  }

  /**
   * Deep sanitize an object's string values
   */
  static sanitizeObject<T extends Record<string, any>>(
    obj: T, 
    textFields: (keyof T)[] = [],
    emailFields: (keyof T)[] = [],
    urlFields: (keyof T)[] = [],
    phoneFields: (keyof T)[] = []
  ): T {
    const sanitized = { ...obj };
    
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        if (emailFields.includes(key)) {
          sanitized[key] = this.sanitizeEmail(value);
        } else if (urlFields.includes(key)) {
          sanitized[key] = this.sanitizeUrl(value);
        } else if (phoneFields.includes(key)) {
          sanitized[key] = this.sanitizePhone(value);
        } else if (textFields.includes(key)) {
          sanitized[key] = this.sanitizeText(value);
        } else {
          // Default to text sanitization for string fields
          sanitized[key] = this.sanitizeText(value);
        }
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? this.sanitizeText(item) : item
        );
      }
    }
    
    return sanitized;
  }
}

/**
 * Utility function for common sanitization patterns
 */
export const sanitize = {
  text: InputSanitizer.sanitizeText,
  html: InputSanitizer.sanitizeHtml,
  email: InputSanitizer.sanitizeEmail,
  url: InputSanitizer.sanitizeUrl,
  phone: InputSanitizer.sanitizePhone,
  fileName: InputSanitizer.sanitizeFileName,
  object: InputSanitizer.sanitizeObject
};
