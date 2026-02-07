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
export async function getLibraries(page = 1, limit = 20, workspaceId: string) {
  return client.get('/resource/libraries', {
    params: { page, limit, workspaceId },
  });
}

/**
 * Get a single library by ID
 */
export async function getLibrary(id: string, workspaceId: string) {
  return client.get(`/resource/libraries/${id}`, {
    params: { workspaceId },
  });
}

/**
 * Create a new resource library
 */
export async function createLibrary(data: CreateLibraryDto, workspaceId: string) {
  return client.post('/resource/libraries', { ...data, workspaceId });
}

/**
 * Update an existing library
 */
export async function updateLibrary(id: string, data: UpdateLibraryDto, workspaceId: string) {
  return client.put(`/resource/libraries/${id}`, { ...data, workspaceId });
}

// ==================== Subject Asset Management ====================

/**
 * Get all subjects in a library
 */
export async function getSubjects(libraryId: string, page = 1, limit = 50, workspaceId: string) {
  return client.get(`/resource/libraries/${libraryId}/subjects`, {
    params: { page, limit, workspaceId },
  });
}

/**
 * Get a single subject by ID
 */
export async function getSubject(id: string, workspaceId: string) {
  return client.get(`/resource/subjects/${id}`, {
    params: { workspaceId },
  });
}

/**
 * Create a new subject asset
 */
export async function createSubject(
  libraryId: string,
  data: CreateSubjectDto,
  workspaceId: string
) {
  return client.post(`/resource/libraries/${libraryId}/subjects`, { ...data, workspaceId });
}

/**
 * Update an existing subject
 */
export async function updateSubject(id: string, data: UpdateSubjectDto, workspaceId: string) {
  return client.put(`/resource/subjects/${id}`, { ...data, workspaceId });
}

/**
 * Delete a subject
 */
export async function deleteSubject(id: string, workspaceId: string) {
  return client.delete(`/resource/subjects/${id}`, { data: { workspaceId } });
}

// ==================== Scene Asset Management ====================

/**
 * Get all scenes in a library
 */
export async function getScenes(libraryId: string, page = 1, limit = 50, workspaceId: string) {
  return client.get(`/resource/libraries/${libraryId}/scenes`, {
    params: { page, limit, workspaceId },
  });
}

/**
 * Get a single scene by ID
 */
export async function getScene(id: string, workspaceId: string) {
  return client.get(`/resource/scenes/${id}`, {
    params: { workspaceId },
  });
}

/**
 * Create a new scene asset
 */
export async function createScene(libraryId: string, data: CreateSceneDto, workspaceId: string) {
  return client.post(`/resource/libraries/${libraryId}/scenes`, { ...data, workspaceId });
}

/**
 * Update an existing scene
 */
export async function updateScene(id: string, data: UpdateSceneDto, workspaceId: string) {
  return client.put(`/resource/scenes/${id}`, { ...data, workspaceId });
}

/**
 * Delete a scene
 */
export async function deleteScene(id: string, workspaceId: string) {
  return client.delete(`/resource/scenes/${id}`, { data: { workspaceId } });
}

// ==================== Other Material Management ====================

/**
 * Get all materials in a library
 */
export async function getMaterials(
  libraryId: string,
  workspaceId: string,
  type?: 'audio' | 'video' | 'image',
  page = 1,
  limit = 50
) {
  return client.get(`/resource/libraries/${libraryId}/materials`, {
    params: { type, page, limit, workspaceId },
  });
}

/**
 * Get a single material by ID
 */
export async function getMaterial(id: string, workspaceId: string) {
  return client.get(`/resource/materials/${id}`, {
    params: { workspaceId },
  });
}

/**
 * Create a new material
 */
export async function createMaterial(
  libraryId: string,
  data: CreateMaterialDto,
  workspaceId: string
) {
  return client.post(`/resource/libraries/${libraryId}/materials`, { ...data, workspaceId });
}

/**
 * Delete a material
 */
export async function deleteMaterial(id: string, workspaceId: string) {
  return client.delete(`/resource/materials/${id}`, { data: { workspaceId } });
}

// ==================== File Upload Operations ====================

/**
 * Get presigned upload URL for direct browser upload to TOS
 */
export async function getUploadUrl(data: UploadUrlRequestDto, workspaceId: string) {
  return client.post<UploadUrlResponse>('/resource/upload-url', { ...data, workspaceId });
}

/**
 * Verify file upload completion
 */
export async function verifyUpload(key: string, workspaceId: string) {
  return client.post('/resource/files/verify', { key, workspaceId });
}

// ==================== AI Generation ====================

/**
 * Generate voice characteristic for a subject
 */
export async function generateVoice(data: GenerateRequestDto, workspaceId: string) {
  return client.post('/resource/generate/subject/voice', { ...data, workspaceId });
}

/**
 * Generate style tags for a subject
 */
export async function generateSubjectStyles(data: GenerateRequestDto, workspaceId: string) {
  return client.post('/resource/generate/subject/styles', { ...data, workspaceId });
}

/**
 * Generate description for a subject
 */
export async function generateSubjectDescription(data: GenerateRequestDto, workspaceId: string) {
  return client.post('/resource/generate/subject/description', { ...data, workspaceId });
}

/**
 * Generate style tags for a scene
 */
export async function generateSceneStyles(data: GenerateRequestDto, workspaceId: string) {
  return client.post('/resource/generate/scene/styles', { ...data, workspaceId });
}

/**
 * Generate description for a scene
 */
export async function generateSceneDescription(data: GenerateRequestDto, workspaceId: string) {
  return client.post('/resource/generate/scene/description', { ...data, workspaceId });
}
