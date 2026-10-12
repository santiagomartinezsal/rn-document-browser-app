import type { CreateDocumentInput } from './document';
import { validateCreateDocumentInput } from './validateCreateDocumentInput';

function buildInput(overrides: Partial<CreateDocumentInput> = {}): CreateDocumentInput {
  return {
    title: 'Hop Rod Rye',
    version: '2.6.16',
    fileName: 'manual.pdf',
    ...overrides,
  };
}

describe('validateCreateDocumentInput', () => {
  it('accepts a fully filled-in input', () => {
    expect(validateCreateDocumentInput(buildInput())).toEqual({ valid: true });
  });

  it('rejects an empty title', () => {
    const result = validateCreateDocumentInput(buildInput({ title: '  ' }));

    expect(result).toEqual({ valid: false, errors: { title: 'Name is required' } });
  });

  it('rejects a version that is not dot-separated numbers', () => {
    const result = validateCreateDocumentInput(buildInput({ version: 'v2.6' }));

    expect(result).toEqual({
      valid: false,
      errors: { version: 'Version must look like 1.0.0' },
    });
  });

  it('rejects a missing file name', () => {
    const result = validateCreateDocumentInput(buildInput({ fileName: '' }));

    expect(result).toEqual({ valid: false, errors: { fileName: 'Choose a file' } });
  });

  it('reports every invalid field at once', () => {
    const result = validateCreateDocumentInput(
      buildInput({ title: '', version: '', fileName: '' }),
    );

    expect(result).toEqual({
      valid: false,
      errors: {
        title: 'Name is required',
        version: 'Version must look like 1.0.0',
        fileName: 'Choose a file',
      },
    });
  });
});
