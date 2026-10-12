import type { Document, DocumentContributor } from '../domain/document';
import type { DocumentContributorDto, DocumentDto } from './documentDto';

export class InvalidDocumentError extends Error {}
export class InvalidDocumentsResponseError extends Error {}

function isContributorDto(value: unknown): value is DocumentContributorDto {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as DocumentContributorDto;
  return typeof candidate.ID === 'string' && typeof candidate.Name === 'string';
}

function isDocumentDto(value: unknown): value is DocumentDto {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as DocumentDto;
  return (
    typeof candidate.ID === 'string' &&
    typeof candidate.CreatedAt === 'string' &&
    typeof candidate.UpdatedAt === 'string' &&
    typeof candidate.Title === 'string' &&
    typeof candidate.Version === 'string' &&
    Array.isArray(candidate.Attachments) &&
    candidate.Attachments.every((attachment) => typeof attachment === 'string') &&
    Array.isArray(candidate.Contributors) &&
    candidate.Contributors.every(isContributorDto)
  );
}

function mapContributor(dto: DocumentContributorDto): DocumentContributor {
  return { id: dto.ID, name: dto.Name };
}

export function mapDocument(dto: unknown): Document {
  if (!isDocumentDto(dto)) {
    throw new InvalidDocumentError(`Invalid document payload: ${JSON.stringify(dto)}`);
  }

  return {
    id: dto.ID,
    title: dto.Title,
    createdAt: dto.CreatedAt,
    updatedAt: dto.UpdatedAt,
    attachments: dto.Attachments,
    contributors: dto.Contributors.map(mapContributor),
    version: dto.Version,
  };
}

export function mapDocuments(payload: unknown): Document[] {
  if (!Array.isArray(payload)) {
    throw new InvalidDocumentsResponseError(
      `Expected an array of documents, got: ${typeof payload}`,
    );
  }

  const documents: Document[] = [];
  for (const entry of payload) {
    try {
      documents.push(mapDocument(entry));
    } catch (error) {
      console.warn('Skipping invalid document in server response', error);
    }
  }

  return documents;
}
