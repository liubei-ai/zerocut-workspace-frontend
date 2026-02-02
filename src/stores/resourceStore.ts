import { defineStore } from 'pinia';
import resourceService, {
  CreateLibraryDto,
  UpdateLibraryDto,
  CreateSubjectDto,
  UpdateSubjectDto,
  CreateSceneDto,
  UpdateSceneDto,
  CreateMaterialDto,
  UploadUrlRequestDto,
  GenerateRequestDto,
} from '@/services/resourceService';

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
    // ==================== Library Management ====================

    /**
     * Fetch all libraries for current workspace
     */
    async fetchLibraries(page: number = 1, limit: number = 20) {
      this.librariesLoading = true;
      this.error = null;

      try {
        const response = await resourceService.getLibraries(page, limit);
        this.libraries = response.data.data.items;
        this.librariesTotal = response.data.data.total;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch libraries';
        throw error;
      } finally {
        this.librariesLoading = false;
      }
    },

    /**
     * Fetch a single library and set as current
     */
    async fetchLibrary(id: string) {
      this.librariesLoading = true;
      this.error = null;

      try {
        const response = await resourceService.getLibrary(id);
        this.currentLibrary = response.data.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch library';
        throw error;
      } finally {
        this.librariesLoading = false;
      }
    },

    /**
     * Create a new library
     */
    async createLibrary(data: CreateLibraryDto) {
      this.librariesLoading = true;
      this.error = null;

      try {
        const response = await resourceService.createLibrary(data);
        const newLibrary = response.data.data;
        this.libraries.unshift(newLibrary);
        this.librariesTotal += 1;
        return newLibrary;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to create library';
        throw error;
      } finally {
        this.librariesLoading = false;
      }
    },

    /**
     * Update an existing library
     */
    async updateLibrary(id: string, data: UpdateLibraryDto) {
      this.librariesLoading = true;
      this.error = null;

      try {
        const response = await resourceService.updateLibrary(id, data);
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
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to update library';
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
    async fetchSubjects(libraryId: string, page: number = 1, limit: number = 50) {
      this.subjectsLoading = true;
      this.error = null;

      try {
        const response = await resourceService.getSubjects(libraryId, page, limit);
        this.subjects = response.data.data.items;
        this.subjectsTotal = response.data.data.total;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch subjects';
        throw error;
      } finally {
        this.subjectsLoading = false;
      }
    },

    /**
     * Create a new subject
     */
    async createSubject(libraryId: string, data: CreateSubjectDto) {
      this.subjectsLoading = true;
      this.error = null;

      try {
        const response = await resourceService.createSubject(libraryId, data);
        const newSubject = response.data.data;
        this.subjects.unshift(newSubject);
        this.subjectsTotal += 1;
        return newSubject;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to create subject';
        throw error;
      } finally {
        this.subjectsLoading = false;
      }
    },

    /**
     * Update a subject
     */
    async updateSubject(id: string, data: UpdateSubjectDto) {
      this.subjectsLoading = true;
      this.error = null;

      try {
        const response = await resourceService.updateSubject(id, data);
        const updatedSubject = response.data.data;

        // Update in list
        const index = this.subjects.findIndex(subj => subj.id === id);
        if (index !== -1) {
          this.subjects[index] = updatedSubject;
        }

        return updatedSubject;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to update subject';
        throw error;
      } finally {
        this.subjectsLoading = false;
      }
    },

    /**
     * Delete a subject
     */
    async deleteSubject(id: string) {
      this.subjectsLoading = true;
      this.error = null;

      try {
        await resourceService.deleteSubject(id);

        // Remove from list
        this.subjects = this.subjects.filter(subj => subj.id !== id);
        this.subjectsTotal -= 1;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to delete subject';
        throw error;
      } finally {
        this.subjectsLoading = false;
      }
    },

    // ==================== Scene Asset Management ====================

    /**
     * Fetch scenes for current library
     */
    async fetchScenes(libraryId: string, page: number = 1, limit: number = 50) {
      this.scenesLoading = true;
      this.error = null;

      try {
        const response = await resourceService.getScenes(libraryId, page, limit);
        this.scenes = response.data.data.items;
        this.scenesTotal = response.data.data.total;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch scenes';
        throw error;
      } finally {
        this.scenesLoading = false;
      }
    },

    /**
     * Create a new scene
     */
    async createScene(libraryId: string, data: CreateSceneDto) {
      this.scenesLoading = true;
      this.error = null;

      try {
        const response = await resourceService.createScene(libraryId, data);
        const newScene = response.data.data;
        this.scenes.unshift(newScene);
        this.scenesTotal += 1;
        return newScene;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to create scene';
        throw error;
      } finally {
        this.scenesLoading = false;
      }
    },

    /**
     * Update a scene
     */
    async updateScene(id: string, data: UpdateSceneDto) {
      this.scenesLoading = true;
      this.error = null;

      try {
        const response = await resourceService.updateScene(id, data);
        const updatedScene = response.data.data;

        // Update in list
        const index = this.scenes.findIndex(scene => scene.id === id);
        if (index !== -1) {
          this.scenes[index] = updatedScene;
        }

        return updatedScene;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to update scene';
        throw error;
      } finally {
        this.scenesLoading = false;
      }
    },

    /**
     * Delete a scene
     */
    async deleteScene(id: string) {
      this.scenesLoading = true;
      this.error = null;

      try {
        await resourceService.deleteScene(id);

        // Remove from list
        this.scenes = this.scenes.filter(scene => scene.id !== id);
        this.scenesTotal -= 1;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to delete scene';
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
      page: number = 1,
      limit: number = 50
    ) {
      this.materialsLoading = true;
      this.error = null;

      try {
        const response = await resourceService.getMaterials(libraryId, type, page, limit);
        this.materials = response.data.data.items;
        this.materialsTotal = response.data.data.total;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch materials';
        throw error;
      } finally {
        this.materialsLoading = false;
      }
    },

    /**
     * Create a new material
     */
    async createMaterial(libraryId: string, data: CreateMaterialDto) {
      this.materialsLoading = true;
      this.error = null;

      try {
        const response = await resourceService.createMaterial(libraryId, data);
        const newMaterial = response.data.data;
        this.materials.unshift(newMaterial);
        this.materialsTotal += 1;
        return newMaterial;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to create material';
        throw error;
      } finally {
        this.materialsLoading = false;
      }
    },

    /**
     * Delete a material
     */
    async deleteMaterial(id: string) {
      this.materialsLoading = true;
      this.error = null;

      try {
        await resourceService.deleteMaterial(id);

        // Remove from list
        this.materials = this.materials.filter(mat => mat.id !== id);
        this.materialsTotal -= 1;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to delete material';
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
      try {
        const response = await resourceService.getUploadUrl(data);
        return response.data.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to get upload URL';
        throw error;
      }
    },

    /**
     * Verify file upload
     */
    async verifyUpload(key: string) {
      try {
        const response = await resourceService.verifyUpload(key);
        return response.data.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to verify upload';
        throw error;
      }
    },

    // ==================== AI Generation ====================

    /**
     * Generate voice for subject
     */
    async generateVoice(data: GenerateRequestDto) {
      try {
        const response = await resourceService.generateVoice(data);
        return response.data.data.voice;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to generate voice';
        throw error;
      }
    },

    /**
     * Generate styles for subject
     */
    async generateSubjectStyles(data: GenerateRequestDto) {
      try {
        const response = await resourceService.generateSubjectStyles(data);
        return response.data.data.styles;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to generate styles';
        throw error;
      }
    },

    /**
     * Generate description for subject
     */
    async generateSubjectDescription(data: GenerateRequestDto) {
      try {
        const response = await resourceService.generateSubjectDescription(data);
        return response.data.data.description;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to generate description';
        throw error;
      }
    },

    /**
     * Generate styles for scene
     */
    async generateSceneStyles(data: GenerateRequestDto) {
      try {
        const response = await resourceService.generateSceneStyles(data);
        return response.data.data.styles;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to generate styles';
        throw error;
      }
    },

    /**
     * Generate description for scene
     */
    async generateSceneDescription(data: GenerateRequestDto) {
      try {
        const response = await resourceService.generateSceneDescription(data);
        return response.data.data.description;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to generate description';
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
