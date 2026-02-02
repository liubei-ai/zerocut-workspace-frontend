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
            <div class="placeholder">
              <v-icon icon="mdi-account" size="64" color="surface-variant" />
              <h3>{{ $t('resource.subjectsPlaceholder') }}</h3>
              <p>{{ $t('resource.subjectsDescription') }}</p>
              <v-btn color="primary" prepend-icon="mdi-plus" @click="createSubject" class="mt-4">
                {{ $t('resource.createSubject') }}
              </v-btn>
            </div>
          </v-window-item>

          <v-window-item value="scenes">
            <div class="placeholder">
              <v-icon icon="mdi-image" size="64" color="surface-variant" />
              <h3>{{ $t('resource.scenesPlaceholder') }}</h3>
              <p>{{ $t('resource.scenesDescription') }}</p>
              <v-btn color="primary" prepend-icon="mdi-plus" @click="createScene" class="mt-4">
                {{ $t('resource.createScene') }}
              </v-btn>
            </div>
          </v-window-item>

          <v-window-item value="materials">
            <div class="placeholder">
              <v-icon icon="mdi-file-multiple" size="64" color="surface-variant" />
              <h3>{{ $t('resource.materialsPlaceholder') }}</h3>
              <p>{{ $t('resource.materialsDescription') }}</p>
              <v-btn color="primary" prepend-icon="mdi-plus" @click="createMaterial" class="mt-4">
                {{ $t('resource.createMaterial') }}
              </v-btn>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useResourceStore } from '@/stores/resourceStore';

defineEmits<{
  back: [];
}>();

const resourceStore = useResourceStore();
const activeTab = ref('subjects');

const createSubject = () => {
  // TODO: Implement create subject dialog
  console.log('Create subject');
};

const createScene = () => {
  // TODO: Implement create scene dialog
  console.log('Create scene');
};

const createMaterial = () => {
  // TODO: Implement create material dialog
  console.log('Create material');
};
</script>

<style scoped lang="scss">
.library-detail {
  .tabs {
    border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
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
