<template>
  <div class="library-detail">
    <v-card>
      <v-card-item>
        <template #prepend>
          <v-btn icon="mdi-arrow-left" variant="text" @click="$emit('back')" />
        </template>
        <v-card-title>{{ resourceStore.currentLibrary?.name }}</v-card-title>
        <v-card-subtitle>{{ resourceStore.currentLibrary?.description }}</v-card-subtitle>
      </v-card-item>

      <v-tabs v-model="activeTab" class="tabs">
        <v-tab value="subjects">
          <v-icon icon="mdi-account" start />
          {{ $t('resource.subjects') }} ({{ resourceStore.currentLibrarySubjectsCount }})
        </v-tab>
        <v-tab value="scenes">
          <v-icon icon="mdi-image" start />
          {{ $t('resource.scenes') }} ({{ resourceStore.currentLibraryScenesCount }})
        </v-tab>
        <v-tab value="materials">
          <v-icon icon="mdi-file-multiple" start />
          {{ $t('resource.materials') }} ({{ resourceStore.currentLibraryMaterialsCount }})
        </v-tab>
      </v-tabs>

      <v-card-text class="pa-6">
        <v-window v-model="activeTab">
          <v-window-item value="subjects">
            <SubjectList
              v-if="resourceStore.currentLibrary?.id"
              :library-id="resourceStore.currentLibrary.id"
              @update="handleSubjectsUpdate"
            />
          </v-window-item>

          <v-window-item value="scenes">
            <SceneList
              v-if="resourceStore.currentLibrary?.id"
              :library-id="resourceStore.currentLibrary.id"
              @update="handleScenesUpdate"
            />
          </v-window-item>

          <v-window-item value="materials">
            <MaterialList
              v-if="resourceStore.currentLibrary?.id"
              :library-id="resourceStore.currentLibrary.id"
              @update="handleMaterialsUpdate"
            />
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useResourceStore } from '@/stores/resourceStore';
import SubjectList from '@/components/SubjectAssets/SubjectList.vue';
import SceneList from '@/components/SceneAssets/SceneList.vue';
import MaterialList from '@/components/OtherMaterials/MaterialList.vue';

defineEmits<{
  back: [];
}>();

const resourceStore = useResourceStore();
const activeTab = ref('subjects');

const handleSubjectsUpdate = () => {
  // Refresh library counts when subjects are updated
  if (resourceStore.currentLibrary?.id) {
    resourceStore.fetchLibrary(resourceStore.currentLibrary.id);
  }
};

const handleScenesUpdate = () => {
  // Refresh library counts when scenes are updated
  if (resourceStore.currentLibrary?.id) {
    resourceStore.fetchLibrary(resourceStore.currentLibrary.id);
  }
};

const handleMaterialsUpdate = () => {
  // Refresh library counts when materials are updated
  if (resourceStore.currentLibrary?.id) {
    resourceStore.fetchLibrary(resourceStore.currentLibrary.id);
  }
};
</script>

<style scoped lang="scss">
.library-detail {
  .tabs {
    border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    padding: 48px 24px;

    p {
      color: rgba(var(--v-theme-on-surface), 0.6);
      font-size: 14px;
    }
  }

  .placeholder {
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
      max-width: 400px;
    }
  }
}
</style>
