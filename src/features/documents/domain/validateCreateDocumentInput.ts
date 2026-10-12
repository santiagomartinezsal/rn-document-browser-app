import type { CreateDocumentInput } from './document';

const VERSION_PATTERN = /^\d+(\.\d+)*$/;

export type ValidationErrors = Partial<Record<keyof CreateDocumentInput, string>>;

export type ValidationResult = { valid: true } | { valid: false; errors: ValidationErrors };

export function validateCreateDocumentInput(input: CreateDocumentInput): ValidationResult {
  const errors: ValidationErrors = {};

  if (input.title.trim().length === 0) {
    errors.title = 'Name is required';
  }
  if (!VERSION_PATTERN.test(input.version.trim())) {
    errors.version = 'Version must look like 1.0.0';
  }
  if (input.fileName.trim().length === 0) {
    errors.fileName = 'Choose a file';
  }

  return Object.keys(errors).length === 0 ? { valid: true } : { valid: false, errors };
}
