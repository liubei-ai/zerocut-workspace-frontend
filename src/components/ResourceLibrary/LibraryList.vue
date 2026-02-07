<template>
  <div class="library-list">
    <v-container fluid>
      <div v-if="resourceStore.librariesLoading" class="loading-state">
        <v-progress-circular indeterminate />
        <p>{{ $t('common.loading') }}</p>
      </div>

      <div v-else-if="resourceStore.libraries.length === 0" class="empty-state">
        <v-icon icon="mdi-folder-open" size="80" color="surface-variant" />
        <h3>{{ $t('resource.noLibraries') }}</h3>
        <p>{{ $t('resource.createFirstLibrary') }}</p>
      </div>

      <v-row v-else>
        <v-col v-for="library in resourceStore.libraries" :key="library.id" cols="12" sm="6" lg="4">
          <v-card
            class="library-card"
            @click="selectLibrary(library)"
            :class="{ active: isSelected(library.id) }"
          >
            <v-card-item class="pb-0">
              <template #prepend>
                <v-icon icon="mdi-folder-multiple" color="primary" size="32" />
              </template>
              <v-card-title class="text-wrap">{{ library.name }}</v-card-title>
            </v-card-item>

            <v-card-text class="text-caption">
              <div class="library-info">
                <div class="info-row">
                  <span class="label">{{ $t('resource.createdAt') }}:</span>
                  <span class="value">{{ formatDate(library.createdAt) }}</span>
                </div>
                <div class="info-row">
                  <span class="label">{{ $t('resource.uuid') }}:</span>
                  <span class="value font-mono">{{ library.uuid }}</span>
                </div>
                <p v-if="library.description" class="description">{{ library.description }}</p>
              </div>
            </v-card-text>

            <v-divider />

            <v-card-actions>
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                @click.stop="editLibrary(library)"
              />
              <v-btn
                icon="mdi-trash-can"
                size="small"
                variant="text"
                color="error"
                @click.stop="confirmDelete(library)"
              />
              <v-spacer />
              <v-btn
                color="primary"
                variant="text"
                size="small"
                @click.stop="selectLibrary(library)"
              >
                {{ $t('resource.manage') }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- Pagination -->
      <v-pagination v-if="totalPages > 1" v-model="currentPage" :length="totalPages" class="mt-6" />
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useResourceStore } from '@/stores/resourceStore';
import type { ResourceLibrary } from '@/stores/resourceStore';

const emit = defineEmits<{
  'select-library': [library: ResourceLibrary];
  'edit-library': [library: ResourceLibrary];
  'delete-library': [library: ResourceLibrary];
}>();

const resourceStore = useResourceStore();
const currentPage = ref(1);
const pageSize = 12;

const totalPages = computed(() => Math.ceil(resourceStore.librariesTotal / pageSize));

const isSelected = (id: string) => resourceStore.currentLibrary?.id === id;

const selectLibrary = (library: ResourceLibrary) => {
  emit('select-library', library);
};

const editLibrary = (library: ResourceLibrary) => {
  emit('edit-library', library);
};

const confirmDelete = (library: ResourceLibrary) => {
  if (confirm(`Are you sure you want to delete "${library.name}"?`)) {
    emit('delete-library', library);
  }
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};

onMounted(async () => {
  await resourceStore.fetchLibraries(currentPage.value, pageSize);
});
</script>

<style scoped lang="scss">
.library-list {
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    gap: 16px;

    p {
      margin: 0;
      color: rgba(var(--v-theme-on-surface), 0.6);
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    text-align: center;

    h3 {
      margin: 16px 0 8px 0;
    }

    p {
      margin: 0;
      color: rgba(var(--v-theme-on-surface), 0.6);
    }
  }

  .library-card {
    cursor: pointer;
    transition: all 0.3s ease;
    height: 100%;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &.active {
      border: 2px solid rgba(var(--v-theme-primary));
      box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.2);
    }

    .library-info {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .info-row {
        display: flex;
        gap: 8px;
        word-break: break-word;

        .label {
          font-weight: 500;
          color: rgba(var(--v-theme-on-surface), 0.7);
          flex-shrink: 0;
        }

        .value {
          color: rgba(var(--v-theme-on-surface));
          overflow: hidden;
          text-overflow: ellipsis;

          &.font-mono {
            font-family: monospace;
            font-size: 12px;
          }
        }
      }

      .description {
        margin: 8px 0 0 0;
        color: rgba(var(--v-theme-on-surface), 0.7);
        line-height: 1.4;
        max-height: 3em;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
    }
  }
}
</style>
