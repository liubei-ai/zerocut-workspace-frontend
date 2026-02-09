<template>
  <div class="resource-admin">
    <ResponsivePageHeader
      :title="t('menu.resourceAdmin')"
      :primary-actions="headerPrimaryActions"
      :secondary-actions="headerSecondaryActions"
    >
      <template #description>
        <p class="text-medium-emphasis text-sm sm:text-base">
          {{ t('resource.managementSubtitle') }}
        </p>
      </template>
    </ResponsivePageHeader>

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
  </div>
</template>

<script setup lang="ts">
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import CreateLibraryDialog from '@/components/resource/ResourceLibrary/CreateLibraryDialog.vue';
import DeleteLibraryDialog from '@/components/resource/ResourceLibrary/DeleteLibraryDialog.vue';
import EditLibraryDialog from '@/components/resource/ResourceLibrary/EditLibraryDialog.vue';
import LibraryDetail from '@/components/resource/ResourceLibrary/LibraryDetail.vue';
import LibraryList from '@/components/resource/ResourceLibrary/LibraryList.vue';
import { useResourceStore } from '@/stores/resourceStore';
import type { ResourceLibrary } from '@/types/resource';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const resourceStore = useResourceStore();
const { t } = useI18n();

const isCreateDialogOpen = ref(false);
const isEditDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const selectedLibrary = ref<ResourceLibrary | null>(null);

const headerPrimaryActions = computed(() => [
  {
    key: 'create',
    label: t('resource.createLibrary'),
    icon: 'mdi-plus',
    color: 'primary',
    variant: 'flat' as const,
    onClick: () => openCreateDialog(),
  },
]);

const headerSecondaryActions = computed(() =>
  resourceStore.currentLibrary
    ? [
        {
          key: 'back',
          label: t('common.back'),
          icon: 'mdi-arrow-left',
          variant: 'outlined' as const,
          onClick: () => handleBack(),
        },
      ]
    : []
);

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
