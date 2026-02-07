<template>
  <div class="material-list">
    <div class="material-list__header">
      <v-text-field
        v-model="searchQuery"
        :label="$t('common.search')"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        class="mb-4"
        @update:model-value="handleSearch"
      />
      <v-select
        v-model="selectedType"
        :label="$t('resource.materialType')"
        :items="materialTypes"
        variant="outlined"
        density="compact"
        class="mb-4"
        @update:model-value="handleTypeChange"
      />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="showCreateDialog = true" class="mb-4">
        {{ $t('resource.createMaterial') }}
      </v-btn>
    </div>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <v-empty-state
      v-if="!loading && materials.length === 0"
      :icon="'mdi-file-multiple'"
      :headline="$t('resource.materialsPlaceholder')"
      :title="$t('resource.materialsDescription')"
    />

    <v-row v-else>
      <v-col v-for="material in materials" :key="material.id" cols="12" sm="6" md="4">
        <MaterialCard :material="material" @delete="handleDeleteMaterial" />
      </v-col>
    </v-row>

    <!-- Pagination -->
    <div v-if="!loading && totalMaterials > limit" class="d-flex justify-center mt-6">
      <v-pagination
        v-model="currentPage"
        :length="totalPages"
        @update:model-value="handlePageChange"
      />
    </div>

    <!-- Create Dialog -->
    <CreateMaterialDialog
      v-model="showCreateDialog"
      :library-id="libraryId"
      @save="handleSaveMaterial"
      @close="handleDialogClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useResourceStore } from '@/stores/resourceStore';
import { useI18n } from 'vue-i18n';
import MaterialCard from './MaterialCard.vue';
import CreateMaterialDialog from './CreateMaterialDialog.vue';

interface Material {
  id: string;
  name: string;
  type: 'audio' | 'video' | 'image';
  fileUrl: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const props = defineProps<{
  libraryId: string;
}>();

const emit = defineEmits<{
  update: [];
}>();

const resourceStore = useResourceStore();
const { t } = useI18n();

const loading = ref(false);
const searchQuery = ref('');
const selectedType = ref<'all' | 'audio' | 'video' | 'image'>('all');
const showCreateDialog = ref(false);
const currentPage = ref(1);
const limit = ref(12);

// Use store data directly to avoid duplicate loading
const materials = computed(() => resourceStore.materials as Material[]);
const totalMaterials = computed(() => resourceStore.materialsTotal);

const materialTypes = computed(() => [
  { value: 'all', title: t('resource.allMaterials') },
  { value: 'audio', title: t('resource.audioMaterials') },
  { value: 'video', title: t('resource.videoMaterials') },
  { value: 'image', title: t('resource.imageMaterials') },
]);

const totalPages = computed(() => Math.ceil(totalMaterials.value / limit.value));

const fetchMaterials = async (page: number = 1) => {
  loading.value = true;
  try {
    const type = selectedType.value === 'all' ? undefined : selectedType.value;
    await resourceStore.fetchMaterials(props.libraryId, type, page, limit.value);
  } catch (error) {
    console.error('Failed to fetch materials:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = async () => {
  currentPage.value = 1;
  // TODO: Implement search filtering
  await fetchMaterials(1);
};

const handleTypeChange = async () => {
  currentPage.value = 1;
  await fetchMaterials(1);
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchMaterials(page);
};

const handleDeleteMaterial = async (materialId: string) => {
  if (confirm('Are you sure you want to delete this material?')) {
    try {
      await resourceStore.deleteMaterial(materialId);
      emit('update');
      await fetchMaterials(currentPage.value);
    } catch (error) {
      console.error('Failed to delete material:', error);
    }
  }
};

const handleSaveMaterial = async () => {
  await fetchMaterials(currentPage.value);
  emit('update');
};

const handleDialogClose = () => {
  showCreateDialog.value = false;
};

onMounted(() => {
  // Only fetch if materials are not already loaded by parent component
  // Parent (ResourceAdmin) pre-loads materials when selecting a library
  if (materials.value.length === 0) {
    fetchMaterials();
  }
});
</script>

<style scoped lang="scss">
.material-list {
  &__header {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    align-items: flex-end;

    @media (max-width: 960px) {
      flex-wrap: wrap;

      .v-text-field {
        flex: 1 1 100%;
      }

      .v-select {
        flex: 1 1 auto;
      }

      .v-btn {
        flex: 1 1 auto;
      }
    }

    @media (max-width: 600px) {
      flex-direction: column;
      align-items: stretch;

      .v-btn {
        width: 100%;
      }
    }
  }
}
</style>
