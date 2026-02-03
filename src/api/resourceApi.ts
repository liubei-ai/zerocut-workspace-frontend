import client from './api2client';

// Types for API requests and responses
export interface CreateLibraryDto {
  name: string;
  description?: string;
}

export interface UpdateLibraryDto {
  name?: string;
  description?: string;
}

export interface CreateSubjectDto {
  name: string;
  voice?: string;
  styles?: string[];
  description?: string;
  referenceImages?: string[];
}

export interface UpdateSubjectDto {
  name?: string;
  voice?: string;
  styles?: string[];
  description?: string;
  referenceImages?: string[];
}

export interface CreateSceneDto {
  name: string;
  styles?: string[];
  description?: string;
  referenceImages?: string[];
}

export interface UpdateSceneDto {
  name?: string;
  styles?: string[];
  description?: string;
  referenceImages?: string[];
}

export interface CreateMaterialDto {
  name: string;
  type: 'audio' | 'video' | 'image';
  fileUrl: string;
  description?: string;
}

export interface UploadUrlRequestDto {
  fileName: string;
  fileType: string;
  fileSize: number;
  category: 'reference-image' | 'audio' | 'video' | 'image';
}

export interface UploadUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

export interface GenerateRequestDto {
  referenceImages: string[];
  context?: string;
}

// ==================== Library Management ====================

/**
 * Get all resource libraries for current workspace
 */
export async function getLibraries(page: number = 1, limit: number = 20) {
  return client.get('/resource/libraries', {
    params: { page, limit },
  });
}

/**
 * Get a single library by ID
 */
export async function getLibrary(id: string) {
  return client.get(`/resource/libraries/${id}`);
}

/**
 * Create a new resource library
 */
export async function createLibrary(data: CreateLibraryDto) {
  return client.post('/resource/libraries', data);
}

/**
 * Update an existing library
 */
export async function updateLibrary(id: string, data: UpdateLibraryDto) {
  return client.put(`/resource/libraries/${id}`, data);
}

// ==================== Subject Asset Management ====================

/**
 * Get all subjects in a library
 */
export async function getSubjects(libraryId: string, page: number = 1, limit: number = 50) {
  return client.get(`/resource/libraries/${libraryId}/subjects`, {
    params: { page, limit },
  });
}

/**
 * Get a single subject by ID
 */
export async function getSubject(id: string) {
  return client.get(`/resource/subjects/${id}`);
}

/**
 * Create a new subject asset
 */
export async function createSubject(libraryId: string, data: CreateSubjectDto) {
  return client.post(`/resource/libraries/${libraryId}/subjects`, data);
}

/**
 * Update an existing subject
 */
export async function updateSubject(id: string, data: UpdateSubjectDto) {
  return client.put(`/resource/subjects/${id}`, data);
}

/**
 * Delete a subject
 */
export async function deleteSubject(id: string) {
  return client.delete(`/resource/subjects/${id}`);
}

// ==================== Scene Asset Management ====================

/**
 * Get all scenes in a library
 */
export async function getScenes(libraryId: string, page: number = 1, limit: number = 50) {
  return client.get(`/resource/libraries/${libraryId}/scenes`, {
    params: { page, limit },
  });
}

/**
 * Get a single scene by ID
 */
export async function getScene(id: string) {
  return client.get(`/resource/scenes/${id}`);
}

/**
 * Create a new scene asset
 */
export async function createScene(libraryId: string, data: CreateSceneDto) {
  return client.post(`/resource/libraries/${libraryId}/scenes`, data);
}

/**
 * Update an existing scene
 */
export async function updateScene(id: string, data: UpdateSceneDto) {
  return client.put(`/resource/scenes/${id}`, data);
}

/**
 * Delete a scene
 */
export async function deleteScene(id: string) {
  return client.delete(`/resource/scenes/${id}`);
}

// ==================== Other Material Management ====================

/**
 * Get all materials in a library
 */
export async function getMaterials(
  libraryId: string,
  type?: 'audio' | 'video' | 'image',
  page: number = 1,
  limit: number = 50
) {
  return client.get(`/resource/libraries/${libraryId}/materials`, {
    params: { type, page, limit },
  });
}

/**
 * Get a single material by ID
 */
export async function getMaterial(id: string) {
  return client.get(`/resource/materials/${id}`);
}

/**
 * Create a new material
 */
export async function createMaterial(libraryId: string, data: CreateMaterialDto) {
  return client.post(`/resource/libraries/${libraryId}/materials`, data);
}

/**
 * Delete a material
 */
export async function deleteMaterial(id: string) {
  return client.delete(`/resource/materials/${id}`);
}

// ==================== File Upload Operations ====================

/**
 * Get presigned upload URL for direct browser upload to TOS
 */
export async function getUploadUrl(data: UploadUrlRequestDto) {
  return client.post<UploadUrlResponse>('/resource/upload-url', data);
}

/**
 * Verify file upload completion
 */
export async function verifyUpload(key: string) {
  return client.post('/resource/files/verify', { key });
}

// ==================== AI Generation ====================

/**
 * Generate voice characteristic for a subject
 */
export async function generateVoice(data: GenerateRequestDto) {
  return client.post('/resource/generate/subject/voice', data);
}

/**
 * Generate style tags for a subject
 */
export async function generateSubjectStyles(data: GenerateRequestDto) {
  return client.post('/resource/generate/subject/styles', data);
}

/**
 * Generate description for a subject
 */
export async function generateSubjectDescription(data: GenerateRequestDto) {
  return client.post('/resource/generate/subject/description', data);
}

/**
 * Generate style tags for a scene
 */
export async function generateSceneStyles(data: GenerateRequestDto) {
  return client.post('/resource/generate/scene/styles', data);
}

/**
 * Generate description for a scene
 */
export async function generateSceneDescription(data: GenerateRequestDto) {
  return client.post('/resource/generate/scene/description', data);
}
