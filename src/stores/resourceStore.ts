import type {
  CreateLibraryDto,
  CreateMaterialDto,
  CreateSceneDto,
  CreateSubjectDto,
  GenerateRequestDto,
  UpdateLibraryDto,
  UpdateMaterialDto,
  UpdateSceneDto,
  UpdateSubjectDto,
  UploadUrlRequestDto,
} from '@/api/resourceApi';
import * as resourceApi from '@/api/resourceApi';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import type { OtherMaterial, ResourceLibrary, Scene, Subject } from '@/types/resource';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useResourceStore = defineStore('resource', () => {
  // ==================== State ====================

  // Library management
  const libraries = ref<ResourceLibrary[]>([]);
  const currentLibrary = ref<ResourceLibrary | null>(null);
  const librariesTotal = ref(0);
  const librariesLoading = ref(false);

  // Subject assets
  const subjects = ref<Subject[]>([]);
  const subjectsTotal = ref(0);
  const subjectsLoading = ref(false);

  // Scene assets
  const scenes = ref<Scene[]>([]);
  const scenesTotal = ref(0);
  const scenesLoading = ref(false);

  // Other materials
  const materials = ref<OtherMaterial[]>([]);
  const materialsTotal = ref(0);
  const materialsLoading = ref(false);

  // UI state
  const selectedAssetType = ref<'subjects' | 'scenes' | 'materials'>('subjects');
  const error = ref<string | null>(null);

  // ==================== Computed ====================

  /**
   * Get current library's subjects count
   */
  const currentLibrarySubjectsCount = computed(() => subjectsTotal.value);

  /**
   * Get current library's scenes count
   */
  const currentLibraryScenesCount = computed(() => scenesTotal.value);

  /**
   * Get current library's materials count
   */
  const currentLibraryMaterialsCount = computed(() => materialsTotal.value);

  /**
   * Check if any loading operation is in progress
   */
  const isLoading = computed(
    () =>
      librariesLoading.value ||
      subjectsLoading.value ||
      scenesLoading.value ||
      materialsLoading.value
  );

  /**
   * Get materials by type
   */
  const getMaterialsByType = computed(() => {
    return (type: 'audio' | 'video' | 'image') => {
      return materials.value.filter(m => m.type === type);
    };
  });

  // ==================== Utility Functions ====================

  /**
   * Get current workspace ID with validation
   * @throws Error if no workspace is selected
   */
  function getWorkspaceId(): string {
    const workspaceStore = useWorkspaceStore();
    const workspaceId = workspaceStore.currentWorkspaceId;

    if (!workspaceId) {
      error.value = 'No workspace selected';
      throw new Error('No workspace selected');
    }

    return workspaceId;
  }

  // ==================== Library Management ====================

  /**
   * Fetch all libraries for current workspace
   */
  async function fetchLibraries(page = 1, limit = 20) {
    const workspaceId = getWorkspaceId();

    librariesLoading.value = true;
    error.value = null;

    try {
      const response = await resourceApi.getLibraries(page, limit, workspaceId);
      libraries.value = response.data.data.items;
      librariesTotal.value = response.data.data.total;
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to fetch libraries';
      throw err;
    } finally {
      librariesLoading.value = false;
    }
  }

  /**
   * Fetch a single library and set as current
   */
  async function fetchLibrary(id: number) {
    const workspaceId = getWorkspaceId();

    librariesLoading.value = true;
    error.value = null;

    try {
      const response = await resourceApi.getLibrary(id, workspaceId);
      currentLibrary.value = response.data.data;
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to fetch library';
      throw err;
    } finally {
      librariesLoading.value = false;
    }
  }

  /**
   * Create a new library
   */
  async function createLibrary(data: CreateLibraryDto) {
    const workspaceId = getWorkspaceId();

    librariesLoading.value = true;
    error.value = null;

    try {
      const response = await resourceApi.createLibrary(data, workspaceId);
      const newLibrary = response.data.data;
      libraries.value.unshift(newLibrary);
      librariesTotal.value += 1;
      return newLibrary;
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to create library';
      throw err;
    } finally {
      librariesLoading.value = false;
    }
  }

  /**
   * Update an existing library
   */
  async function updateLibrary(id: number, data: UpdateLibraryDto) {
    const workspaceId = getWorkspaceId();

    librariesLoading.value = true;
    error.value = null;

    try {
      const response = await resourceApi.updateLibrary(id, data, workspaceId);
      const updatedLibrary = response.data.data;

      // Update in list
      const index = libraries.value.findIndex(lib => lib.id === id);
      if (index !== -1) {
        libraries.value[index] = updatedLibrary;
      }

      // Update current library if it's the one being edited
      if (currentLibrary.value?.id === id) {
        currentLibrary.value = updatedLibrary;
      }

      return updatedLibrary;
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to update library';
      throw err;
    } finally {
      librariesLoading.value = false;
    }
  }

  /**
   * Delete a library and all its related assets
   */
  async function deleteLibrary(id: number) {
    const workspaceId = getWorkspaceId();

    librariesLoading.value = true;
    error.value = null;

    try {
      await resourceApi.deleteLibrary(id, workspaceId);

      // Remove from list
      const index = libraries.value.findIndex(lib => lib.id === id);
      if (index !== -1) {
        libraries.value.splice(index, 1);
        librariesTotal.value -= 1;
      }

      // Clear current library if it's the one being deleted
      if (currentLibrary.value?.id === id) {
        currentLibrary.value = null;
        subjects.value = [];
        scenes.value = [];
        materials.value = [];
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to delete library';
      throw err;
    } finally {
      librariesLoading.value = false;
    }
  }

  /**
   * Get statistics for a library (asset counts)
   */
  async function getLibraryStatistics(id: number): Promise<{
    subjectsCount: number;
    scenesCount: number;
    materialsCount: number;
  }> {
    const workspaceId = getWorkspaceId();

    try {
      const response = await resourceApi.getLibraryStatistics(id, workspaceId);
      return response.data.data;
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to fetch library statistics';
      throw err;
    }
  }

  /**
   * Set the current library
   */
  function setCurrentLibrary(library: ResourceLibrary | null) {
    currentLibrary.value = library;

    // Clear assets when switching libraries
    if (library) {
      subjects.value = [];
      scenes.value = [];
      materials.value = [];
    }
  }

  // ==================== Subject Asset Management ====================

  /**
   * Fetch subjects for current library
   */
  async function fetchSubjects(libraryId: number, page = 1, limit = 50) {
    const workspaceId = getWorkspaceId();

    subjectsLoading.value = true;
    error.value = null;

    try {
      const response = await resourceApi.getSubjects(libraryId, page, limit, workspaceId);
      subjects.value = response.data.list;
      subjectsTotal.value = response.data.total;

      // Return data for component use
      return {
        data: response.data.list,
        total: response.data.total,
      };
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to fetch subjects';
      throw err;
    } finally {
      subjectsLoading.value = false;
    }
  }

  /**
   * Create a new subject
   */
  async function createSubject(libraryId: number, data: CreateSubjectDto) {
    const workspaceId = getWorkspaceId();

    subjectsLoading.value = true;
    error.value = null;

    try {
      const response = await resourceApi.createSubject(libraryId, data, workspaceId);
      const newSubject = response.data;
      subjects.value.unshift(newSubject);
      subjectsTotal.value += 1;
      return newSubject;
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to create subject';
      throw err;
    } finally {
      subjectsLoading.value = false;
    }
  }

  /**
   * Update a subject
   */
  async function updateSubject(id: number, data: UpdateSubjectDto) {
    const workspaceId = getWorkspaceId();

    subjectsLoading.value = true;
    error.value = null;

    try {
      const response = await resourceApi.updateSubject(id, data, workspaceId);
      const updatedSubject = response.data.data;

      // Update in list
      const index = subjects.value.findIndex(subj => subj.id === id);
      if (index !== -1) {
        subjects.value[index] = updatedSubject;
      }

      return updatedSubject;
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to update subject';
      throw err;
    } finally {
      subjectsLoading.value = false;
    }
  }

  /**
   * Delete a subject
   */
  async function deleteSubject(id: number) {
    const workspaceId = getWorkspaceId();

    subjectsLoading.value = true;
    error.value = null;

    try {
      await resourceApi.deleteSubject(id, workspaceId);

      // Remove from list
      subjects.value = subjects.value.filter(subj => subj.id !== id);
      subjectsTotal.value -= 1;
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to delete subject';
      throw err;
    } finally {
      subjectsLoading.value = false;
    }
  }

  // ==================== Scene Asset Management ====================

  /**
   * Fetch scenes for current library
   */
  async function fetchScenes(libraryId: number, page = 1, limit = 50) {
    const workspaceId = getWorkspaceId();

    scenesLoading.value = true;
    error.value = null;

    try {
      const response = await resourceApi.getScenes(libraryId, page, limit, workspaceId);
      const { list, total } = response.data;
      scenes.value = list;
      scenesTotal.value = total;

      // Return data for component use
      return {
        data: list,
        total,
      };
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to fetch scenes';
      throw err;
    } finally {
      scenesLoading.value = false;
    }
  }

  /**
   * Create a new scene
   */
  async function createScene(libraryId: number, data: CreateSceneDto) {
    const workspaceId = getWorkspaceId();

    scenesLoading.value = true;
    error.value = null;

    try {
      const response = await resourceApi.createScene(libraryId, data, workspaceId);
      const newScene = response.data.data;
      scenes.value.unshift(newScene);
      scenesTotal.value += 1;
      return newScene;
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to create scene';
      throw err;
    } finally {
      scenesLoading.value = false;
    }
  }

  /**
   * Update a scene
   */
  async function updateScene(id: number, data: UpdateSceneDto) {
    const workspaceId = getWorkspaceId();

    scenesLoading.value = true;
    error.value = null;

    try {
      const response = await resourceApi.updateScene(id, data, workspaceId);
      const updatedScene = response.data.data;

      // Update in list
      const index = scenes.value.findIndex(scene => scene.id === id);
      if (index !== -1) {
        scenes.value[index] = updatedScene;
      }

      return updatedScene;
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to update scene';
      throw err;
    } finally {
      scenesLoading.value = false;
    }
  }

  /**
   * Delete a scene
   */
  async function deleteScene(id: number) {
    const workspaceId = getWorkspaceId();

    scenesLoading.value = true;
    error.value = null;

    try {
      await resourceApi.deleteScene(id, workspaceId);

      // Remove from list
      scenes.value = scenes.value.filter(scene => scene.id !== id);
      scenesTotal.value -= 1;
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to delete scene';
      throw err;
    } finally {
      scenesLoading.value = false;
    }
  }

  // ==================== Other Material Management ====================

  /**
   * Fetch materials for current library
   */
  async function fetchMaterials(
    libraryId: number,
    type?: 'audio' | 'video' | 'image',
    page = 1,
    limit = 50
  ) {
    const workspaceId = getWorkspaceId();

    materialsLoading.value = true;
    error.value = null;

    try {
      const response = await resourceApi.getMaterials(libraryId, workspaceId, type, page, limit);
      const { list, total } = response.data;
      materials.value = list;
      materialsTotal.value = total;

      // Return data for component use
      return {
        data: list,
        total,
      };
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to fetch materials';
      throw err;
    } finally {
      materialsLoading.value = false;
    }
  }

  /**
   * Create a new material
   */
  async function createMaterial(libraryId: number, data: CreateMaterialDto) {
    const workspaceId = getWorkspaceId();

    materialsLoading.value = true;
    error.value = null;

    try {
      const response = await resourceApi.createMaterial(libraryId, data, workspaceId);
      const newMaterial = response.data.data;
      materials.value.unshift(newMaterial);
      materialsTotal.value += 1;
      return newMaterial;
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to create material';
      throw err;
    } finally {
      materialsLoading.value = false;
    }
  }

  /**
   * Update an existing material
   */
  async function updateMaterial(id: number, data: UpdateMaterialDto) {
    const workspaceId = getWorkspaceId();

    materialsLoading.value = true;
    error.value = null;

    try {
      const response = await resourceApi.updateMaterial(id, data, workspaceId);
      const updatedMaterial = response.data.data;

      // Update in list
      const index = materials.value.findIndex(mat => mat.id === id);
      if (index !== -1) {
        materials.value[index] = updatedMaterial;
      }

      return updatedMaterial;
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to update material';
      throw err;
    } finally {
      materialsLoading.value = false;
    }
  }

  /**
   * Delete a material
   */
  async function deleteMaterial(id: number) {
    const workspaceId = getWorkspaceId();

    materialsLoading.value = true;
    error.value = null;

    try {
      await resourceApi.deleteMaterial(id, workspaceId);

      // Remove from list
      materials.value = materials.value.filter(mat => mat.id !== id);
      materialsTotal.value -= 1;
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to delete material';
      throw err;
    } finally {
      materialsLoading.value = false;
    }
  }

  // ==================== File Upload Operations ====================

  /**
   * Get presigned upload URL
   */
  async function getUploadUrl(data: UploadUrlRequestDto) {
    const workspaceId = getWorkspaceId();

    try {
      const response = await resourceApi.getUploadUrl(data, workspaceId);
      return response.data;
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to get upload URL';
      throw err;
    }
  }

  /**
   * Verify file upload
   */
  async function verifyUpload(key: string) {
    const workspaceId = getWorkspaceId();

    try {
      const response = await resourceApi.verifyUpload(key, workspaceId);
      return response.data.data;
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to verify upload';
      throw err;
    }
  }

  /**
   * Get presigned upload URL (wrapper for component compatibility)
   */
  async function getPresignedUploadUrl(data: UploadUrlRequestDto) {
    return getUploadUrl(data);
  }

  /**
   * Verify file exists (wrapper for component compatibility)
   */
  async function verifyFileExists(fileUrl: string) {
    // Extract key from fileUrl - assuming format like https://domain/bucket/key
    const url = new URL(fileUrl);
    const key = url.pathname.substring(1); // Remove leading slash
    return verifyUpload(key);
  }

  // ==================== AI Generation ====================

  /**
   * Generate voice for subject
   */
  async function generateVoice(data: GenerateRequestDto) {
    const workspaceId = getWorkspaceId();

    try {
      const response = await resourceApi.generateVoice(data, workspaceId);
      return response.data.data.voice;
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to generate voice';
      throw err;
    }
  }

  /**
   * Generate voice for subject (wrapper for component compatibility)
   */
  async function generateSubjectVoice(referenceImages: string[]) {
    return generateVoice({ referenceImages });
  }

  /**
   * Generate styles for subject
   */
  async function generateSubjectStyles(data: GenerateRequestDto) {
    const workspaceId = getWorkspaceId();

    try {
      const response = await resourceApi.generateSubjectStyles(data, workspaceId);
      return response.data.data.styles;
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to generate styles';
      throw err;
    }
  }

  /**
   * Generate description for subject
   */
  async function generateSubjectDescription(data: GenerateRequestDto) {
    const workspaceId = getWorkspaceId();

    try {
      const response = await resourceApi.generateSubjectDescription(data, workspaceId);
      return response.data.data.description;
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to generate description';
      throw err;
    }
  }

  /**
   * Generate styles for scene
   */
  async function generateSceneStyles(data: GenerateRequestDto) {
    const workspaceId = getWorkspaceId();

    try {
      const response = await resourceApi.generateSceneStyles(data, workspaceId);
      return response.data.data.styles;
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to generate styles';
      throw err;
    }
  }

  /**
   * Generate description for scene
   */
  async function generateSceneDescription(data: GenerateRequestDto) {
    const workspaceId = getWorkspaceId();

    try {
      const response = await resourceApi.generateSceneDescription(data, workspaceId);
      return response.data.data.description;
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      error.value = apiError.response?.data?.message || 'Failed to generate description';
      throw err;
    }
  }

  // ==================== UI State Management ====================

  /**
   * Set selected asset type tab
   */
  function setSelectedAssetType(type: 'subjects' | 'scenes' | 'materials') {
    selectedAssetType.value = type;
  }

  /**
   * Clear error message
   */
  function clearError() {
    error.value = null;
  }

  /**
   * Reset store to initial state
   */
  function reset() {
    libraries.value = [];
    currentLibrary.value = null;
    librariesTotal.value = 0;
    subjects.value = [];
    subjectsTotal.value = 0;
    scenes.value = [];
    scenesTotal.value = 0;
    materials.value = [];
    materialsTotal.value = 0;
    selectedAssetType.value = 'subjects';
    error.value = null;
  }

  // ==================== Return Public API ====================

  return {
    // State
    libraries,
    currentLibrary,
    librariesTotal,
    librariesLoading,
    subjects,
    subjectsTotal,
    subjectsLoading,
    scenes,
    scenesTotal,
    scenesLoading,
    materials,
    materialsTotal,
    materialsLoading,
    selectedAssetType,
    error,

    // Computed
    currentLibrarySubjectsCount,
    currentLibraryScenesCount,
    currentLibraryMaterialsCount,
    isLoading,
    getMaterialsByType,

    // Library Management
    fetchLibraries,
    fetchLibrary,
    createLibrary,
    updateLibrary,
    deleteLibrary,
    getLibraryStatistics,
    setCurrentLibrary,

    // Subject Asset Management
    fetchSubjects,
    createSubject,
    updateSubject,
    deleteSubject,

    // Scene Asset Management
    fetchScenes,
    createScene,
    updateScene,
    deleteScene,

    // Other Material Management
    fetchMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,

    // File Upload Operations
    getUploadUrl,
    verifyUpload,
    getPresignedUploadUrl,
    verifyFileExists,

    // AI Generation
    generateVoice,
    generateSubjectVoice,
    generateSubjectStyles,
    generateSubjectDescription,
    generateSceneStyles,
    generateSceneDescription,

    // UI State Management
    setSelectedAssetType,
    clearError,
    reset,
  };
});
