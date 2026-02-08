<template>
  <v-card class="scene-card" elevation="2" hover>
    <!-- Scene Background Images Carousel -->
    <v-carousel
      v-if="scene.referenceImages && scene.referenceImages.length > 0"
      :height="200"
      hide-delimiters
      show-arrows="hover"
      class="scene-card__carousel"
    >
      <v-carousel-item
        v-for="(image, index) in scene.referenceImages"
        :key="index"
        :src="image.fileUrl"
        cover
      />
    </v-carousel>

    <!-- Placeholder if no images -->
    <div v-else class="scene-card__placeholder">
      <v-icon icon="mdi-image" size="64" color="grey-lighten-2" />
    </div>

    <v-card-item>
      <v-card-title class="text-h6">{{ scene.name }}</v-card-title>
    </v-card-item>

    <v-card-text>
      <!-- Style Tags -->
      <div v-if="scene.styles && scene.styles.length > 0" class="mb-2">
        <v-chip
          v-for="(style, index) in displayStyles"
          :key="index"
          size="small"
          class="mr-1 mb-1"
          color="primary"
          variant="tonal"
        >
          {{ style }}
        </v-chip>
        <v-chip
          v-if="scene.styles.length > maxDisplayStyles"
          size="small"
          variant="text"
          class="mb-1"
        >
          +{{ scene.styles.length - maxDisplayStyles }}
        </v-chip>
      </div>

      <!-- Description -->
      <p v-if="scene.description" class="text-body-2 text-medium-emphasis scene-card__description">
        {{ truncatedDescription }}
      </p>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn icon="mdi-pencil" variant="text" size="small" @click="$emit('edit', scene)" />
      <v-btn
        icon="mdi-delete"
        variant="text"
        size="small"
        color="error"
        @click="$emit('delete', scene.id)"
      />
    </v-card-actions>

    <!-- Metadata Footer -->
    <v-divider />
    <v-card-text class="text-caption text-medium-emphasis pa-2">
      <v-icon icon="mdi-clock-outline" size="x-small" class="mr-1" />
      {{ formatDate(scene.createdAt) }}
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { Scene } from '@/types/resource';
import { computed } from 'vue';

const props = defineProps<{
  scene: Scene;
}>();

defineEmits<{
  edit: [scene: Scene];
  delete: [id: number];
}>();

const maxDisplayStyles = 5;
const maxDescriptionLength = 100;

const displayStyles = computed(() => {
  return props.scene.styles.slice(0, maxDisplayStyles);
});

const truncatedDescription = computed(() => {
  if (!props.scene.description) return '';
  if (props.scene.description.length <= maxDescriptionLength) {
    return props.scene.description;
  }
  return props.scene.description.substring(0, maxDescriptionLength) + '...';
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
</script>

<style scoped lang="scss">
.scene-card {
  height: 100%;
  display: flex;
  flex-direction: column;

  &__carousel {
    flex-shrink: 0;
  }

  &__placeholder {
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgb(var(--v-theme-surface-variant));
  }

  &__description {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }

  .v-card-item,
  .v-card-text,
  .v-card-actions {
    flex-shrink: 0;
  }
}
</style>
