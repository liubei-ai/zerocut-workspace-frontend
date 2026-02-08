<template>
  <v-dialog v-model="isOpen" max-width="500px" persistent>
    <v-card>
      <v-card-title>{{ $t('resource.deleteLibrary') }}</v-card-title>

      <v-card-text>
        <!-- Warning Alert -->
        <v-alert type="error" prominent class="mb-4">
          <v-alert-title>{{ $t('resource.deleteWarning') }}</v-alert-title>
          <div>{{ $t('resource.deleteConfirmMessage') }}</div>
        </v-alert>

        <!-- Library Name -->
        <div class="mb-4">
          <strong>{{ $t('resource.libraryName') }}:</strong>
          {{ library?.name }}
        </div>

        <!-- Statistics Loading -->
        <div v-if="statsLoading" class="text-center py-4">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <!-- Statistics Display -->
        <div v-else-if="stats" class="mb-4">
          <div class="text-subtitle-2 mb-2">{{ $t('resource.willDelete') }}:</div>
          <v-list dense>
            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-account-outline" />
              </template>
              <v-list-item-title>
                {{ stats.subjectsCount }} {{ $t('resource.subjects') }}
              </v-list-item-title>
            </v-list-item>

            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-image-outline" />
              </template>
              <v-list-item-title>
                {{ stats.scenesCount }} {{ $t('resource.scenes') }}
              </v-list-item-title>
            </v-list-item>

            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-file-outline" />
              </template>
              <v-list-item-title>
                {{ stats.materialsCount }} {{ $t('resource.materials') }}
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <v-divider class="my-3" />

          <div class="text-error text-center font-weight-bold">
            {{ $t('resource.cannotUndo') }}
          </div>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="error-message mb-4">
          <v-icon icon="mdi-alert-circle" size="small" />
          {{ error }}
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="handleClose" variant="text" :disabled="isDeleting">
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn
          @click="handleDelete"
          color="error"
          variant="elevated"
          :loading="isDeleting"
          :disabled="statsLoading"
        >
          {{ $t('common.delete') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useResourceStore, type ResourceLibrary } from '@/stores/resourceStore';

const props = defineProps<{
  open: boolean;
  library: ResourceLibrary | null;
}>();

const emit = defineEmits<{
  'update:open': [boolean];
  'library-deleted': [];
}>();

const resourceStore = useResourceStore();

const statsLoading = ref(false);
const isDeleting = ref(false);
const error = ref('');
const stats = ref<{
  subjectsCount: number;
  scenesCount: number;
  materialsCount: number;
} | null>(null);

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

// Load statistics when dialog opens
watch(
  () => props.open,
  async newVal => {
    if (newVal && props.library) {
      await loadStatistics();
    } else {
      // Reset state when closing
      stats.value = null;
      error.value = '';
    }
  }
);

const loadStatistics = async () => {
  if (!props.library) return;

  statsLoading.value = true;
  error.value = '';

  try {
    stats.value = await resourceStore.getLibraryStatistics(props.library.id);
  } catch (err: any) {
    // Extract error message from API response
    const errorMessage =
      err.response?.data?.message || err.message || 'Failed to load library statistics';
    error.value = errorMessage;
    // Still allow deletion even if stats fail
    stats.value = { subjectsCount: 0, scenesCount: 0, materialsCount: 0 };
  } finally {
    statsLoading.value = false;
  }
};

const handleDelete = async () => {
  if (!props.library) return;

  isDeleting.value = true;
  error.value = '';

  try {
    await resourceStore.deleteLibrary(props.library.id);
    handleClose();
    emit('library-deleted');
  } catch (err: any) {
    // Extract error message from API response
    const errorMessage = err.response?.data?.message || err.message || 'Failed to delete library';
    error.value = errorMessage;
    // Don't close dialog on error, allow retry
  } finally {
    isDeleting.value = false;
  }
};

const handleClose = () => {
  stats.value = null;
  error.value = '';
  isOpen.value = false;
};
</script>

<style scoped lang="scss">
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background-color: rgba(var(--v-theme-error), 0.1);
  color: rgba(var(--v-theme-error));
  border-radius: 4px;
  font-size: 14px;
}
</style>
