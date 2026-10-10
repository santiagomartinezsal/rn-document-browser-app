import fixture from './documents-response.fixture.json';
import {
  InvalidDocumentError,
  InvalidDocumentsResponseError,
  mapDocument,
  mapDocuments,
} from './document-mapper';

describe('mapDocuments', () => {
  it('maps every document in the server fixture', () => {
    const documents = mapDocuments(fixture);

    expect(documents).toHaveLength(fixture.length);
  });

  it('maps DTO fields to their camelCase domain equivalents', () => {
    const [firstDto] = fixture;

    const [firstDocument] = mapDocuments(fixture);

    expect(firstDocument).toEqual({
      id: firstDto.ID,
      title: firstDto.Title,
      createdAt: firstDto.CreatedAt,
      updatedAt: firstDto.UpdatedAt,
      attachments: firstDto.Attachments,
      contributors: firstDto.Contributors.map((contributor) => ({
        id: contributor.ID,
        name: contributor.Name,
      })),
      version: firstDto.Version,
    });
  });

  it('throws InvalidDocumentsResponseError when the payload is not an array', () => {
    expect(() => mapDocuments({})).toThrow(InvalidDocumentsResponseError);
  });

  it('skips a malformed entry instead of failing the whole response', () => {
    const [validDto] = fixture;
    const { ID, ...entryMissingId } = validDto;

    const documents = mapDocuments([validDto, entryMissingId]);

    expect(documents).toHaveLength(1);
  });

  it('warns when skipping a malformed entry', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { ID, ...entryMissingId } = fixture[0];

    mapDocuments([entryMissingId]);

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe('mapDocument', () => {
  const [validDto] = fixture;

  it('throws InvalidDocumentError when Title is missing', () => {
    const { Title, ...entryMissingTitle } = validDto;

    expect(() => mapDocument(entryMissingTitle)).toThrow(InvalidDocumentError);
  });

  it('throws InvalidDocumentError when Attachments is not an array', () => {
    const invalidDto = { ...validDto, Attachments: 'not-an-array' };

    expect(() => mapDocument(invalidDto)).toThrow(InvalidDocumentError);
  });

  it('throws InvalidDocumentError when a contributor is missing Name', () => {
    const [firstContributor, ...restContributors] = validDto.Contributors;
    const { Name, ...contributorMissingName } = firstContributor;
    const invalidDto = {
      ...validDto,
      Contributors: [contributorMissingName, ...restContributors],
    };

    expect(() => mapDocument(invalidDto)).toThrow(InvalidDocumentError);
  });
});
