export interface DocumentContributorDto {
  ID: string;
  Name: string;
}

export interface DocumentDto {
  ID: string;
  CreatedAt: string;
  UpdatedAt: string;
  Title: string;
  Attachments: string[];
  Contributors: DocumentContributorDto[];
  Version: string;
}
