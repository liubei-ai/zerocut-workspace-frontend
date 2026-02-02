import apiclient from '@/api/apiclient';

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

/**
 * Resource Admin API Service
 * Provides methods for managing resource libraries, subjects, scenes, and materials
 */
const resourceService = {
  // ==================== Library Management ====================

  /**
   * Get all resource libraries for current workspace
   */
  getLibraries(page: number = 1, limit: number = 20) {
    return apiclient.get('/api/resource/libraries', {
      params: { page, limit },
    });
  },

  /**
   * Get a single library by ID
   */
  getLibrary(id: string) {
    return apiclient.get(`/api/resource/libraries/${id}`);
  },

  /**
   * Create a new resource library
   */
  createLibrary(data: CreateLibraryDto) {
    return apiclient.post('/api/resource/libraries', data);
  },

  /**
   * Update an existing library
   */
  updateLibrary(id: string, data: UpdateLibraryDto) {
    return apiclient.put(`/api/resource/libraries/${id}`, data);
  },

  // ==================== Subject Asset Management ====================

  /**
   * Get all subjects in a library
   */
  getSubjects(libraryId: string, page: number = 1, limit: number = 50) {
    return apiclient.get(`/api/resource/libraries/${libraryId}/subjects`, {
      params: { page, limit },
    });
  },

  /**
   * Get a single subject by ID
   */
  getSubject(id: string) {
    return apiclient.get(`/api/resource/subjects/${id}`);
  },

  /**
   * Create a new subject asset
   */
  createSubject(libraryId: string, data: CreateSubjectDto) {
    return apiclient.post(`/api/resource/libraries/${libraryId}/subjects`, data);
  },

  /**
   * Update an existing subject
   */
  updateSubject(id: string, data: UpdateSubjectDto) {
    return apiclient.put(`/api/resource/subjects/${id}`, data);
  },

  /**
   * Delete a subject
   */
  deleteSubject(id: string) {
    return apiclient.delete(`/api/resource/subjects/${id}`);
  },

  // ==================== Scene Asset Management ====================

  /**
   * Get all scenes in a library
   */
  getScenes(libraryId: string, page: number = 1, limit: number = 50) {
    return apiclient.get(`/api/resource/libraries/${libraryId}/scenes`, {
      params: { page, limit },
    });
  },

  /**
   * Get a single scene by ID
   */
  getScene(id: string) {
    return apiclient.get(`/api/resource/scenes/${id}`);
  },

  /**
   * Create a new scene asset
   */
  createScene(libraryId: string, data: CreateSceneDto) {
    return apiclient.post(`/api/resource/libraries/${libraryId}/scenes`, data);
  },

  /**
   * Update an existing scene
   */
  updateScene(id: string, data: UpdateSceneDto) {
    return apiclient.put(`/api/resource/scenes/${id}`, data);
  },

  /**
   * Delete a scene
   */
  deleteScene(id: string) {
    return apiclient.delete(`/api/resource/scenes/${id}`);
  },

  // ==================== Other Material Management ====================

  /**
   * Get all materials in a library
   */
  getMaterials(
    libraryId: string,
    type?: 'audio' | 'video' | 'image',
    page: number = 1,
    limit: number = 50
  ) {
    return apiclient.get(`/api/resource/libraries/${libraryId}/materials`, {
      params: { type, page, limit },
    });
  },

  /**
   * Get a single material by ID
   */
  getMaterial(id: string) {
    return apiclient.get(`/api/resource/materials/${id}`);
  },

  /**
   * Create a new material
   */
  createMaterial(libraryId: string, data: CreateMaterialDto) {
    return apiclient.post(`/api/resource/libraries/${libraryId}/materials`, data);
  },

  /**
   * Delete a material
   */
  deleteMaterial(id: string) {
    return apiclient.delete(`/api/resource/materials/${id}`);
  },

  // ==================== File Upload Operations ====================

  /**
   * Get presigned upload URL for direct browser upload to TOS
   */
  getUploadUrl(data: UploadUrlRequestDto) {
    return apiclient.post<UploadUrlResponse>('/api/resource/upload-url', data);
  },

  /**
   * Verify file upload completion
   */
  verifyUpload(key: string) {
    return apiclient.post('/api/resource/files/verify', { key });
  },

  // ==================== AI Generation ====================

  /**
   * Generate voice characteristic for a subject
   */
  generateVoice(data: GenerateRequestDto) {
    return apiclient.post('/api/resource/generate/subject/voice', data);
  },

  /**
   * Generate style tags for a subject
   */
  generateSubjectStyles(data: GenerateRequestDto) {
    return apiclient.post('/api/resource/generate/subject/styles', data);
  },

  /**
   * Generate description for a subject
   */
  generateSubjectDescription(data: GenerateRequestDto) {
    return apiclient.post('/api/resource/generate/subject/description', data);
  },

  /**
   * Generate style tags for a scene
   */
  generateSceneStyles(data: GenerateRequestDto) {
    return apiclient.post('/api/resource/generate/scene/styles', data);
  },

  /**
   * Generate description for a scene
   */
  generateSceneDescription(data: GenerateRequestDto) {
    return apiclient.post('/api/resource/generate/scene/description', data);
  },
};

export default resourceService;
