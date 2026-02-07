<template>
  <div class="scene-list">
    <div class="scene-list__header">
      <v-text-field
        v-model="searchQuery"
        :label="$t('common.search')"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        class="mb-4"
        @update:model-value="handleSearch"
      />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="showCreateDialog = true" class="mb-4">
        {{ $t('resource.createScene') }}
      </v-btn>
    </div>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <v-empty-state
      v-if="!loading && scenes.length === 0"
      :icon="'mdi-image'"
      :headline="$t('resource.scenesPlaceholder')"
      :title="$t('resource.scenesDescription')"
    />

    <v-row v-else>
      <v-col v-for="scene in scenes" :key="scene.id" cols="12" sm="6" md="4">
        <SceneCard :scene="scene" @edit="handleEditScene" @delete="handleDeleteScene" />
      </v-col>
    </v-row>

    <!-- Pagination -->
    <div v-if="!loading && totalScenes > limit" class="d-flex justify-center mt-6">
      <v-pagination
        v-model="currentPage"
        :length="totalPages"
        @update:model-value="handlePageChange"
      />
    </div>

    <!-- Create/Edit Dialog -->
    <CreateSceneDialog
      v-model="showCreateDialog"
      :edit-scene="editingScene"
      :library-id="libraryId"
      @save="handleSaveScene"
      @close="handleDialogClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useResourceStore } from '@/stores/resourceStore';
import SceneCard from './SceneCard.vue';
import CreateSceneDialog from './CreateSceneDialog.vue';

interface Scene {
  id: string;
  name: string;
  styles: string[];
  description?: string;
  referenceImages: any[];
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

const loading = ref(false);
const searchQuery = ref('');
const showCreateDialog = ref(false);
const editingScene = ref<Scene | null>(null);
const currentPage = ref(1);
const limit = ref(12);

// Use store data directly to avoid duplicate loading
const scenes = computed(() => resourceStore.scenes as Scene[]);
const totalScenes = computed(() => resourceStore.scenesTotal);

const totalPages = computed(() => Math.ceil(totalScenes.value / limit.value));

const fetchScenes = async (page: number = 1) => {
  loading.value = true;
  try {
    await resourceStore.fetchScenes(props.libraryId, page, limit.value);
  } catch (error) {
    console.error('Failed to fetch scenes:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = async () => {
  currentPage.value = 1;
  // TODO: Implement search filtering
  await fetchScenes(1);
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchScenes(page);
};

const handleEditScene = (scene: Scene) => {
  editingScene.value = scene;
  showCreateDialog.value = true;
};

const handleDeleteScene = async (sceneId: string) => {
  if (confirm('Are you sure you want to delete this scene?')) {
    try {
      await resourceStore.deleteScene(sceneId);
      emit('update');
      await fetchScenes(currentPage.value);
    } catch (error) {
      console.error('Failed to delete scene:', error);
    }
  }
};

const handleSaveScene = async () => {
  editingScene.value = null;
  await fetchScenes(currentPage.value);
  emit('update');
};

const handleDialogClose = () => {
  editingScene.value = null;
  showCreateDialog.value = false;
};

onMounted(() => {
  // Only fetch if scenes are not already loaded by parent component
  // Parent (ResourceAdmin) pre-loads scenes when selecting a library
  if (scenes.value.length === 0) {
    fetchScenes();
  }
});
</script>

<style scoped lang="scss">
.scene-list {
  &__header {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    align-items: flex-end;

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
