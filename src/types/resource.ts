// State types
export interface ResourceLibrary {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Scene {
  id: number;
  name: string;
  styles: string[];
  description?: string;
  referenceImages: ReferenceImage[];
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: number;
  name: string;
  voice?: string;
  styles: string[];
  description?: string;
  referenceImages: ReferenceImage[];
  createdAt: string;
  updatedAt: string;
}

export interface OtherMaterial {
  id: number;
  libraryId: number;
  name: string;
  type: 'audio' | 'video' | 'image';
  fileUrl: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferenceImage {
  id: number;
  assetId: number;
  assetType: 'subject' | 'scene';
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  displayOrder: number;
  uploadTimestamp: string;
}
