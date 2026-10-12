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

export interface CreateDocumentInput {
  title: string;
  version: string;
  fileName: string;
}
