import type {
  CreateLibraryDto,
  CreateMaterialDto,
  CreateSceneDto,
  CreateSubjectDto,
  GenerateRequestDto,
  UpdateLibraryDto,
  UpdateSceneDto,
  UpdateSubjectDto,
  UploadUrlRequestDto,
} from '@/api/resourceApi';
import * as resourceApi from '@/api/resourceApi';
import { defineStore } from 'pinia';
import { useWorkspaceStore } from '@/stores/workspaceStore';

// State types
export interface ResourceLibrary {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  workspaceId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectAsset {
  id: string;
  libraryId: string;
  name: string;
  voice?: string;
  styles: string[];
  description?: string;
  referenceImages?: ReferenceImage[];
  createdAt: string;
  updatedAt: string;
}

export interface SceneAsset {
  id: string;
  libraryId: string;
  name: string;
  styles: string[];
  description?: string;
  referenceImages?: ReferenceImage[];
  createdAt: string;
  updatedAt: string;
}

export interface OtherMaterial {
  id: string;
  libraryId: string;
  name: string;
  type: 'audio' | 'video' | 'image';
  fileUrl: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferenceImage {
  id: string;
  assetId: string;
  assetType: 'subject' | 'scene';
  fileUrl: string;
  displayOrder: number;
  uploadTimestamp: string;
}

interface ResourceState {
  // Library management
  libraries: ResourceLibrary[];
  currentLibrary: ResourceLibrary | null;
  librariesTotal: number;
  librariesLoading: boolean;

  // Subject assets
  subjects: SubjectAsset[];
  subjectsTotal: number;
  subjectsLoading: boolean;

  // Scene assets
  scenes: SceneAsset[];
  scenesTotal: number;
  scenesLoading: boolean;

  // Other materials
  materials: OtherMaterial[];
  materialsTotal: number;
  materialsLoading: boolean;

  // UI state
  selectedAssetType: 'subjects' | 'scenes' | 'materials';
  error: string | null;
}

export const useResourceStore = defineStore('resource', {
  state: (): ResourceState => ({
    libraries: [],
    currentLibrary: null,
    librariesTotal: 0,
    librariesLoading: false,

    subjects: [],
    subjectsTotal: 0,
    subjectsLoading: false,

    scenes: [],
    scenesTotal: 0,
    scenesLoading: false,

    materials: [],
    materialsTotal: 0,
    materialsLoading: false,

    selectedAssetType: 'subjects',
    error: null,
  }),

  getters: {
    /**
     * Get current library's subjects count
     */
    currentLibrarySubjectsCount: state => state.subjectsTotal,

    /**
     * Get current library's scenes count
     */
    currentLibraryScenesCount: state => state.scenesTotal,

    /**
     * Get current library's materials count
     */
    currentLibraryMaterialsCount: state => state.materialsTotal,

    /**
     * Check if any loading operation is in progress
     */
    isLoading: state =>
      state.librariesLoading ||
      state.subjectsLoading ||
      state.scenesLoading ||
      state.materialsLoading,

    /**
     * Get materials by type
     */
    getMaterialsByType: state => (type: 'audio' | 'video' | 'image') => {
      return state.materials.filter(m => m.type === type);
    },
  },

  actions: {
    /**
     * Get current workspace ID with validation
     * @throws Error if no workspace is selected
     */
    getWorkspaceId(): string {
      const workspaceStore = useWorkspaceStore();
      const workspaceId = workspaceStore.currentWorkspaceId;

      if (!workspaceId) {
        this.error = 'No workspace selected';
        throw new Error('No workspace selected');
      }

      return workspaceId;
    },

    // ==================== Library Management ====================

    /**
     * Fetch all libraries for current workspace
     */
    async fetchLibraries(page = 1, limit = 20) {
      const workspaceId = this.getWorkspaceId();

      this.librariesLoading = true;
      this.error = null;

      try {
        const response = await resourceApi.getLibraries(page, limit, workspaceId);
        this.libraries = response.data.data.items;
        this.librariesTotal = response.data.data.total;
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        this.error = apiError.response?.data?.message || 'Failed to fetch libraries';
        throw error;
      } finally {
        this.librariesLoading = false;
      }
    },

    /**
     * Fetch a single library and set as current
     */
    async fetchLibrary(id: string) {
      const workspaceId = this.getWorkspaceId();

      this.librariesLoading = true;
      this.error = null;

      try {
        const response = await resourceApi.getLibrary(id, workspaceId);
        this.currentLibrary = response.data.data;
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        this.error = apiError.response?.data?.message || 'Failed to fetch library';
        throw error;
      } finally {
        this.librariesLoading = false;
      }
    },

    /**
     * Create a new library
     */
    async createLibrary(data: CreateLibraryDto) {
      const workspaceId = this.getWorkspaceId();

      this.librariesLoading = true;
      this.error = null;

      try {
        const response = await resourceApi.createLibrary(data, workspaceId);
        const newLibrary = response.data.data;
        this.libraries.unshift(newLibrary);
        this.librariesTotal += 1;
        return newLibrary;
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        this.error = apiError.response?.data?.message || 'Failed to create library';
        throw error;
      } finally {
        this.librariesLoading = false;
      }
    },

    /**
     * Update an existing library
     */
    async updateLibrary(id: string, data: UpdateLibraryDto) {
      const workspaceId = this.getWorkspaceId();

      this.librariesLoading = true;
      this.error = null;

      try {
        const response = await resourceApi.updateLibrary(id, data, workspaceId);
        const updatedLibrary = response.data.data;

        // Update in list
        const index = this.libraries.findIndex(lib => lib.id === id);
        if (index !== -1) {
          this.libraries[index] = updatedLibrary;
        }

        // Update current library if it's the one being edited
        if (this.currentLibrary?.id === id) {
          this.currentLibrary = updatedLibrary;
        }

        return updatedLibrary;
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        this.error = apiError.response?.data?.message || 'Failed to update library';
        throw error;
      } finally {
        this.librariesLoading = false;
      }
    },

    /**
     * Set the current library
     */
    setCurrentLibrary(library: ResourceLibrary | null) {
      this.currentLibrary = library;

      // Clear assets when switching libraries
      if (library) {
        this.subjects = [];
        this.scenes = [];
        this.materials = [];
      }
    },

    // ==================== Subject Asset Management ====================

    /**
     * Fetch subjects for current library
     */
    async fetchSubjects(libraryId: string, page = 1, limit = 50) {
      const workspaceId = this.getWorkspaceId();

      this.subjectsLoading = true;
      this.error = null;

      try {
        const response = await resourceApi.getSubjects(libraryId, page, limit, workspaceId);
        this.subjects = response.data.data.items;
        this.subjectsTotal = response.data.data.total;

        // Return data for component use
        return {
          data: response.data.data.items,
          total: response.data.data.total,
        };
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        this.error = apiError.response?.data?.message || 'Failed to fetch subjects';
        throw error;
      } finally {
        this.subjectsLoading = false;
      }
    },

    /**
     * Create a new subject
     */
    async createSubject(libraryId: string, data: CreateSubjectDto) {
      const workspaceId = this.getWorkspaceId();

      this.subjectsLoading = true;
      this.error = null;

      try {
        const response = await resourceApi.createSubject(libraryId, data, workspaceId);
        const newSubject = response.data.data;
        this.subjects.unshift(newSubject);
        this.subjectsTotal += 1;
        return newSubject;
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        this.error = apiError.response?.data?.message || 'Failed to create subject';
        throw error;
      } finally {
        this.subjectsLoading = false;
      }
    },

    /**
     * Update a subject
     */
    async updateSubject(id: string, data: UpdateSubjectDto) {
      const workspaceId = this.getWorkspaceId();

      this.subjectsLoading = true;
      this.error = null;

      try {
        const response = await resourceApi.updateSubject(id, data, workspaceId);
        const updatedSubject = response.data.data;

        // Update in list
        const index = this.subjects.findIndex(subj => subj.id === id);
        if (index !== -1) {
          this.subjects[index] = updatedSubject;
        }

        return updatedSubject;
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        this.error = apiError.response?.data?.message || 'Failed to update subject';
        throw error;
      } finally {
        this.subjectsLoading = false;
      }
    },

    /**
     * Delete a subject
     */
    async deleteSubject(id: string) {
      const workspaceId = this.getWorkspaceId();

      this.subjectsLoading = true;
      this.error = null;

      try {
        await resourceApi.deleteSubject(id, workspaceId);

        // Remove from list
        this.subjects = this.subjects.filter(subj => subj.id !== id);
        this.subjectsTotal -= 1;
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        this.error = apiError.response?.data?.message || 'Failed to delete subject';
        throw error;
      } finally {
        this.subjectsLoading = false;
      }
    },

    // ==================== Scene Asset Management ====================

    /**
     * Fetch scenes for current library
     */
    async fetchScenes(libraryId: string, page = 1, limit = 50) {
      const workspaceId = this.getWorkspaceId();

      this.scenesLoading = true;
      this.error = null;

      try {
        const response = await resourceApi.getScenes(libraryId, page, limit, workspaceId);
        this.scenes = response.data.data.items;
        this.scenesTotal = response.data.data.total;

        // Return data for component use
        return {
          data: response.data.data.items,
          total: response.data.data.total,
        };
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        this.error = apiError.response?.data?.message || 'Failed to fetch scenes';
        throw error;
      } finally {
        this.scenesLoading = false;
      }
    },

    /**
     * Create a new scene
     */
    async createScene(libraryId: string, data: CreateSceneDto) {
      const workspaceId = this.getWorkspaceId();

      this.scenesLoading = true;
      this.error = null;

      try {
        const response = await resourceApi.createScene(libraryId, data, workspaceId);
        const newScene = response.data.data;
        this.scenes.unshift(newScene);
        this.scenesTotal += 1;
        return newScene;
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        this.error = apiError.response?.data?.message || 'Failed to create scene';
        throw error;
      } finally {
        this.scenesLoading = false;
      }
    },

    /**
     * Update a scene
     */
    async updateScene(id: string, data: UpdateSceneDto) {
      const workspaceId = this.getWorkspaceId();

      this.scenesLoading = true;
      this.error = null;

      try {
        const response = await resourceApi.updateScene(id, data, workspaceId);
        const updatedScene = response.data.data;

        // Update in list
        const index = this.scenes.findIndex(scene => scene.id === id);
        if (index !== -1) {
          this.scenes[index] = updatedScene;
        }

        return updatedScene;
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        this.error = apiError.response?.data?.message || 'Failed to update scene';
        throw error;
      } finally {
        this.scenesLoading = false;
      }
    },

    /**
     * Delete a scene
     */
    async deleteScene(id: string) {
      const workspaceId = this.getWorkspaceId();

      this.scenesLoading = true;
      this.error = null;

      try {
        await resourceApi.deleteScene(id, workspaceId);

        // Remove from list
        this.scenes = this.scenes.filter(scene => scene.id !== id);
        this.scenesTotal -= 1;
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        this.error = apiError.response?.data?.message || 'Failed to delete scene';
        throw error;
      } finally {
        this.scenesLoading = false;
      }
    },

    // ==================== Other Material Management ====================

    /**
     * Fetch materials for current library
     */
    async fetchMaterials(
      libraryId: string,
      type?: 'audio' | 'video' | 'image',
      page = 1,
      limit = 50
    ) {
      const workspaceId = this.getWorkspaceId();

      this.materialsLoading = true;
      this.error = null;

      try {
        const response = await resourceApi.getMaterials(libraryId, workspaceId, type, page, limit);
        this.materials = response.data.data.items;
        this.materialsTotal = response.data.data.total;

        // Return data for component use
        return {
          data: response.data.data.items,
          total: response.data.data.total,
        };
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        this.error = apiError.response?.data?.message || 'Failed to fetch materials';
        throw error;
      } finally {
        this.materialsLoading = false;
      }
    },

    /**
     * Create a new material
     */
    async createMaterial(libraryId: string, data: CreateMaterialDto) {
      const workspaceId = this.getWorkspaceId();

      this.materialsLoading = true;
      this.error = null;

      try {
        const response = await resourceApi.createMaterial(libraryId, data, workspaceId);
        const newMaterial = response.data.data;
        this.materials.unshift(newMaterial);
        this.materialsTotal += 1;
        return newMaterial;
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        this.error = apiError.response?.data?.message || 'Failed to create material';
        throw error;
      } finally {
        this.materialsLoading = false;
      }
    },

    /**
     * Delete a material
     */
    async deleteMaterial(id: string) {
      const workspaceId = this.getWorkspaceId();

      this.materialsLoading = true;
      this.error = null;

      try {
        await resourceApi.deleteMaterial(id, workspaceId);

        // Remove from list
        this.materials = this.materials.filter(mat => mat.id !== id);
        this.materialsTotal -= 1;
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        this.error = apiError.response?.data?.message || 'Failed to delete material';
        throw error;
      } finally {
        this.materialsLoading = false;
      }
    },

    // ==================== File Upload Operations ====================

    /**
     * Get presigned upload URL
     */
    async getUploadUrl(data: UploadUrlRequestDto) {
      const workspaceId = this.getWorkspaceId();

      try {
        const response = await resourceApi.getUploadUrl(data, workspaceId);
        return response.data;
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        this.error = apiError.response?.data?.message || 'Failed to get upload URL';
        throw error;
      }
    },

    /**
     * Verify file upload
     */
    async verifyUpload(key: string) {
      const workspaceId = this.getWorkspaceId();

      try {
        const response = await resourceApi.verifyUpload(key, workspaceId);
        return response.data.data;
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        this.error = apiError.response?.data?.message || 'Failed to verify upload';
        throw error;
      }
    },

    /**
     * Get presigned upload URL (wrapper for component compatibility)
     */
    async getPresignedUploadUrl(data: UploadUrlRequestDto) {
      return this.getUploadUrl(data);
    },

    /**
     * Verify file exists (wrapper for component compatibility)
     */
    async verifyFileExists(fileUrl: string) {
      // Extract key from fileUrl - assuming format like https://domain/bucket/key
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1); // Remove leading slash
      return this.verifyUpload(key);
    },

    // ==================== AI Generation ====================

    /**
     * Generate voice for subject
     */
    async generateVoice(data: GenerateRequestDto) {
      const workspaceId = this.getWorkspaceId();

      try {
        const response = await resourceApi.generateVoice(data, workspaceId);
        return response.data.data.voice;
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        this.error = apiError.response?.data?.message || 'Failed to generate voice';
        throw error;
      }
    },

    /**
     * Generate voice for subject (wrapper for component compatibility)
     */
    async generateSubjectVoice(referenceImages: string[]) {
      return this.generateVoice({ referenceImages });
    },

    /**
     * Generate styles for subject
     */
    async generateSubjectStyles(data: GenerateRequestDto) {
      const workspaceId = this.getWorkspaceId();

      try {
        const response = await resourceApi.generateSubjectStyles(data, workspaceId);
        return response.data.data.styles;
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        this.error = apiError.response?.data?.message || 'Failed to generate styles';
        throw error;
      }
    },

    /**
     * Generate description for subject
     */
    async generateSubjectDescription(data: GenerateRequestDto) {
      const workspaceId = this.getWorkspaceId();

      try {
        const response = await resourceApi.generateSubjectDescription(data, workspaceId);
        return response.data.data.description;
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        this.error = apiError.response?.data?.message || 'Failed to generate description';
        throw error;
      }
    },

    /**
     * Generate styles for scene
     */
    async generateSceneStyles(data: GenerateRequestDto) {
      const workspaceId = this.getWorkspaceId();

      try {
        const response = await resourceApi.generateSceneStyles(data, workspaceId);
        return response.data.data.styles;
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        this.error = apiError.response?.data?.message || 'Failed to generate styles';
        throw error;
      }
    },

    /**
     * Generate description for scene
     */
    async generateSceneDescription(data: GenerateRequestDto) {
      const workspaceId = this.getWorkspaceId();

      try {
        const response = await resourceApi.generateSceneDescription(data, workspaceId);
        return response.data.data.description;
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        this.error = apiError.response?.data?.message || 'Failed to generate description';
        throw error;
      }
    },

    // ==================== UI State Management ====================

    /**
     * Set selected asset type tab
     */
    setSelectedAssetType(type: 'subjects' | 'scenes' | 'materials') {
      this.selectedAssetType = type;
    },

    /**
     * Clear error message
     */
    clearError() {
      this.error = null;
    },

    /**
     * Reset store to initial state
     */
    reset() {
      this.libraries = [];
      this.currentLibrary = null;
      this.librariesTotal = 0;
      this.subjects = [];
      this.subjectsTotal = 0;
      this.scenes = [];
      this.scenesTotal = 0;
      this.materials = [];
      this.materialsTotal = 0;
      this.selectedAssetType = 'subjects';
      this.error = null;
    },
  },
});
