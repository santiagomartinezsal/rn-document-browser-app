import type { Document } from '../domain/document';
import { documentsReducer, initialDocumentsState } from './documentsReducer';

const sampleDocuments: Document[] = [
  {
    id: 'doc-1',
    title: 'Sample',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    attachments: [],
    contributors: [],
    version: '1.0.0',
  },
];

describe('documentsReducer', () => {
  it('transitions from idle to loading on FETCH_STARTED', () => {
    const state = documentsReducer(initialDocumentsState, { type: 'FETCH_STARTED' });

    expect(state).toEqual({ status: 'loading' });
  });

  it('transitions from loading to success on FETCH_SUCCEEDED', () => {
    const loadingState = documentsReducer(initialDocumentsState, { type: 'FETCH_STARTED' });

    const state = documentsReducer(loadingState, {
      type: 'FETCH_SUCCEEDED',
      documents: sampleDocuments,
    });

    expect(state).toEqual({ status: 'success', documents: sampleDocuments });
  });

  it('transitions from loading to error on FETCH_FAILED', () => {
    const loadingState = documentsReducer(initialDocumentsState, { type: 'FETCH_STARTED' });

    const state = documentsReducer(loadingState, {
      type: 'FETCH_FAILED',
      message: 'Request timed out',
    });

    expect(state).toEqual({ status: 'error', message: 'Request timed out' });
  });
});
