<template>
  <div class="material-list">
    <div class="material-list__header">
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
        <MaterialCard
          :material="material"
          @edit="handleEditMaterial"
          @delete="handleDeleteMaterial"
        />
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

    <!-- Create/Edit Dialog -->
    <CreateMaterialDialog
      v-model="showCreateDialog"
      :library-id="libraryId"
      :edit-material="editingMaterial"
      @save="handleSaveMaterial"
      @material-updated="handleMaterialUpdated"
      @close="handleDialogClose"
    />
  </div>
</template>

<script setup lang="ts">
import { useResourceStore } from '@/stores/resourceStore';
import type { OtherMaterial } from '@/types/resource';
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import CreateMaterialDialog from './CreateMaterialDialog.vue';
import MaterialCard from './MaterialCard.vue';

interface Material {
  id: number;
  name: string;
  type: 'audio' | 'video' | 'image';
  fileUrl: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const props = defineProps<{
  libraryId: number;
}>();

const emit = defineEmits<{
  update: [];
}>();

const resourceStore = useResourceStore();
const { t } = useI18n();

const loading = ref(false);
const selectedType = ref<'all' | 'audio' | 'video' | 'image'>('all');
const showCreateDialog = ref(false);
const editingMaterial = ref<OtherMaterial | null>(null);
const currentPage = ref(1);
const limit = ref(12);

// Use store data directly to avoid duplicate loading
// Filter out any null/undefined values for safety
const materials = computed(() => {
  const rawMaterials = resourceStore.materials || [];
  return rawMaterials.filter(m => m != null) as Material[];
});
const totalMaterials = computed(() => resourceStore.materialsTotal);

// const materialTypes = computed(() => [
//   { value: 'all', title: t('resource.allMaterials') },
//   { value: 'audio', title: t('resource.audioMaterials') },
//   { value: 'video', title: t('resource.videoMaterials') },
//   { value: 'image', title: t('resource.imageMaterials') },
// ]);

const totalPages = computed(() => Math.ceil(totalMaterials.value / limit.value));

const fetchMaterials = async (page = 1) => {
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

// const handleTypeChange = async () => {
//   currentPage.value = 1;
//   await fetchMaterials(1);
// };

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchMaterials(page);
};

const handleEditMaterial = (material: OtherMaterial) => {
  editingMaterial.value = material;
  showCreateDialog.value = true;
};

const handleDeleteMaterial = async (materialId: number) => {
  if (window.confirm('Are you sure you want to delete this material?')) {
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

const handleMaterialUpdated = async () => {
  await fetchMaterials(currentPage.value);
  emit('update');
  editingMaterial.value = null;
};

const handleDialogClose = () => {
  showCreateDialog.value = false;
};

// Clean up editing material when dialog closes
watch(
  () => showCreateDialog.value,
  newVal => {
    if (!newVal) {
      editingMaterial.value = null;
    }
  }
);

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
