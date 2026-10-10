export interface DocumentContributor {
  id: string;
  name: string;
}

export interface Document {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  attachments: string[];
  contributors: DocumentContributor[];
  version: string;
}
