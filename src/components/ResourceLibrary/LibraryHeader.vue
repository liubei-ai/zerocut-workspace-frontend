<template>
  <div class="library-header">
    <div class="header-content">
      <div class="header-left">
        <h1 class="page-title">{{ $t('menu.resourceAdmin') }}</h1>
        <p class="page-subtitle">{{ $t('resource.managementSubtitle') }}</p>
      </div>
      <div class="header-right">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog" class="create-btn">
          {{ $t('resource.createLibrary') }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineEmits } from 'vue';

const emit = defineEmits<{
  'create-library': [];
}>();

const openCreateDialog = () => {
  emit('create-library');
};
</script>

<style scoped lang="scss">
.library-header {
  padding: 24px 0;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
  margin-bottom: 24px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;

    @media (max-width: 600px) {
      flex-direction: column;
      align-items: stretch;
    }
  }

  .header-left {
    flex: 1;

    .page-title {
      font-size: 28px;
      font-weight: 500;
      margin: 0 0 8px 0;
      color: rgba(var(--v-theme-on-surface));
    }

    .page-subtitle {
      margin: 0;
      color: rgba(var(--v-theme-on-surface), 0.6);
      font-size: 14px;
    }
  }

  .header-right {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    @media (max-width: 600px) {
      width: 100%;

      .create-btn {
        flex: 1;
      }
    }
  }
}
</style>
