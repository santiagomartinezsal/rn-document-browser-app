import type { Document } from '../domain/document';

export type DocumentsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; documents: Document[] }
  | { status: 'error'; message: string };

export type DocumentsAction =
  | { type: 'FETCH_STARTED' }
  | { type: 'FETCH_SUCCEEDED'; documents: Document[] }
  | { type: 'FETCH_FAILED'; message: string }
  | { type: 'DOCUMENT_CREATED'; document: Document };

export const initialDocumentsState: DocumentsState = { status: 'idle' };

export function documentsReducer(state: DocumentsState, action: DocumentsAction): DocumentsState {
  switch (action.type) {
    case 'FETCH_STARTED':
      return { status: 'loading' };
    case 'FETCH_SUCCEEDED':
      return { status: 'success', documents: action.documents };
    case 'FETCH_FAILED':
      return { status: 'error', message: action.message };
    case 'DOCUMENT_CREATED':
      return state.status === 'success'
        ? { status: 'success', documents: [action.document, ...state.documents] }
        : state;
  }
}
