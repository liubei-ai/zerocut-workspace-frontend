<template>
  <div class="image-gallery">
    <div v-if="images.length === 0" class="empty-state">
      <v-icon icon="mdi-image-off" size="48" color="grey" />
      <p>{{ emptyText || $t('resource.noImages') }}</p>
    </div>

    <div v-else class="image-grid">
      <div v-for="(image, index) in images" :key="image" class="image-item">
        <img :src="image" :alt="`Image ${index + 1}`" />

        <div class="image-overlay">
          <v-btn
            v-if="!readonly"
            icon="mdi-delete"
            size="small"
            color="error"
            variant="elevated"
            @click="handleDelete(index)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  images: string[];
  readonly?: boolean;
  emptyText?: string;
}>();

const emit = defineEmits<{
  delete: [index: number];
}>();

const handleDelete = (index: number) => {
  emit('delete', index);
};
</script>

<style scoped lang="scss">
.image-gallery {
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    gap: 12px;

    p {
      margin: 0;
      color: rgba(var(--v-theme-on-surface), 0.6);
    }
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }

  .image-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden;
    background: rgba(var(--v-theme-surface-variant));

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover .image-overlay {
      opacity: 1;
    }
  }
}
</style>
