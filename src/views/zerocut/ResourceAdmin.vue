<template>
  <div class="resource-admin">
    <v-container fluid class="pa-6">
      <LibraryHeader @create-library="openCreateDialog" />

      <div v-if="!resourceStore.currentLibrary">
        <LibraryList
          @select-library="handleSelectLibrary"
          @edit-library="handleEditLibrary"
          @delete-library="handleDeleteLibrary"
        />
      </div>

      <div v-else>
        <LibraryDetail @back="handleBack" />
      </div>

      <CreateLibraryDialog
        v-model:open="isCreateDialogOpen"
        @library-created="handleLibraryCreated"
      />

      <EditLibraryDialog
        v-model:open="isEditDialogOpen"
        :library="selectedLibrary"
        @library-updated="handleLibraryUpdated"
      />

      <DeleteLibraryDialog
        v-model:open="isDeleteDialogOpen"
        :library="selectedLibrary"
        @library-deleted="handleLibraryDeleted"
      />
    </v-container>
  </div>
</template>

<script setup lang="ts">
import CreateLibraryDialog from '@/components/resource/ResourceLibrary/CreateLibraryDialog.vue';
import DeleteLibraryDialog from '@/components/resource/ResourceLibrary/DeleteLibraryDialog.vue';
import EditLibraryDialog from '@/components/resource/ResourceLibrary/EditLibraryDialog.vue';
import LibraryDetail from '@/components/resource/ResourceLibrary/LibraryDetail.vue';
import LibraryHeader from '@/components/resource/ResourceLibrary/LibraryHeader.vue';
import LibraryList from '@/components/resource/ResourceLibrary/LibraryList.vue';
import { useResourceStore } from '@/stores/resourceStore';
import type { ResourceLibrary } from '@/types/resource';
import { onMounted, ref } from 'vue';

const resourceStore = useResourceStore();

const isCreateDialogOpen = ref(false);
const isEditDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const selectedLibrary = ref<ResourceLibrary | null>(null);

const openCreateDialog = () => {
  isCreateDialogOpen.value = true;
};

const handleSelectLibrary = async (library: ResourceLibrary) => {
  try {
    resourceStore.setCurrentLibrary(library);

    // Load assets for the selected library in parallel
    await Promise.all([
      resourceStore.fetchSubjects(library.id),
      resourceStore.fetchScenes(library.id),
      resourceStore.fetchMaterials(library.id),
    ]);
  } catch (error) {
    console.error('Failed to load library assets:', error);
    // Reset current library on error to show library list again
    resourceStore.setCurrentLibrary(null);
    // TODO: Show error toast notification
  }
};

const handleEditLibrary = (library: ResourceLibrary) => {
  selectedLibrary.value = library;
  isEditDialogOpen.value = true;
};

const handleDeleteLibrary = (library: ResourceLibrary) => {
  selectedLibrary.value = library;
  isDeleteDialogOpen.value = true;
};

const handleLibraryCreated = async () => {
  // Refresh library list after creation
  await resourceStore.fetchLibraries();
};

const handleLibraryUpdated = async () => {
  // Refresh library list after update
  await resourceStore.fetchLibraries();
  selectedLibrary.value = null;
};

const handleLibraryDeleted = async () => {
  // Refresh library list after deletion
  await resourceStore.fetchLibraries();
  selectedLibrary.value = null;
};

const handleBack = () => {
  resourceStore.setCurrentLibrary(null);
};

// Load libraries on page mount
onMounted(async () => {
  try {
    await resourceStore.fetchLibraries();
  } catch (error) {
    console.error('Failed to load libraries on mount:', error);
    // TODO: Show error toast notification
  }
});
</script>

<style scoped lang="scss">
.resource-admin {
  min-height: calc(100vh - 64px);
  background-color: rgba(var(--v-theme-surface));
}
</style>
