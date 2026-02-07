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
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useResourceStore } from '@/stores/resourceStore';
import type { ResourceLibrary } from '@/stores/resourceStore';
import LibraryHeader from '@/components/ResourceLibrary/LibraryHeader.vue';
import LibraryList from '@/components/ResourceLibrary/LibraryList.vue';
import LibraryDetail from '@/components/ResourceLibrary/LibraryDetail.vue';
import CreateLibraryDialog from '@/components/ResourceLibrary/CreateLibraryDialog.vue';

const resourceStore = useResourceStore();

const isCreateDialogOpen = ref(false);

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
  // TODO: Implement edit library dialog
  console.log('Edit library:', library);
};

const handleDeleteLibrary = async (library: ResourceLibrary) => {
  try {
    // TODO: Implement delete library functionality
    console.log('Delete library:', library);
  } catch (error) {
    console.error('Failed to delete library:', error);
  }
};

const handleLibraryCreated = async () => {
  // Refresh library list after creation
  await resourceStore.fetchLibraries();
};

const handleBack = () => {
  resourceStore.setCurrentLibrary(null);
};
</script>

<style scoped lang="scss">
.resource-admin {
  min-height: calc(100vh - 64px);
  background-color: rgba(var(--v-theme-surface));
}
</style>
