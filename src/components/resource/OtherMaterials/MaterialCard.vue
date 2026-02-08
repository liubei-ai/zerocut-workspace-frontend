<template>
  <v-card class="material-card" elevation="2" hover>
    <!-- Type-specific preview -->
    <div class="material-card__preview">
      <ImageMaterialViewer v-if="material.type === 'image'" :file-url="material.fileUrl" />
      <AudioMaterialPlayer v-else-if="material.type === 'audio'" :file-url="material.fileUrl" />
      <VideoMaterialPlayer v-else-if="material.type === 'video'" :file-url="material.fileUrl" />
    </div>

    <v-card-item>
      <v-card-title class="text-h6">{{ material.name }}</v-card-title>
      <v-card-subtitle>
        <v-chip size="small" :color="typeColor" variant="tonal">
          <v-icon :icon="typeIcon" size="small" class="mr-1" />
          {{ typeLabel }}
        </v-chip>
      </v-card-subtitle>
    </v-card-item>

    <v-card-text v-if="material.description">
      <p class="text-body-2 text-medium-emphasis material-card__description">
        {{ truncatedDescription }}
      </p>
    </v-card-text>

    <v-card-actions>
      <v-btn icon="mdi-pencil" variant="text" size="small" @click.stop="$emit('edit', material)" />
      <v-spacer />
      <v-btn
        icon="mdi-delete"
        variant="text"
        size="small"
        color="error"
        @click="$emit('delete', material.id)"
      />
    </v-card-actions>

    <!-- Metadata Footer -->
    <v-divider />
    <v-card-text class="text-caption text-medium-emphasis pa-2">
      <v-icon icon="mdi-clock-outline" size="x-small" class="mr-1" />
      {{ formatDate(material.createdAt) }}
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AudioMaterialPlayer from './AudioMaterialPlayer.vue';
import ImageMaterialViewer from './ImageMaterialViewer.vue';
import VideoMaterialPlayer from './VideoMaterialPlayer.vue';

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
  material: Material;
}>();

defineEmits<{
  edit: [material: Material];
  delete: [id: number];
}>();

const { t } = useI18n();
const maxDescriptionLength = 100;

const typeIcon = computed(() => {
  switch (props.material.type) {
    case 'audio':
      return 'mdi-music';
    case 'video':
      return 'mdi-video';
    case 'image':
      return 'mdi-image';
    default:
      return 'mdi-file';
  }
});

const typeColor = computed(() => {
  switch (props.material.type) {
    case 'audio':
      return 'purple';
    case 'video':
      return 'blue';
    case 'image':
      return 'green';
    default:
      return 'grey';
  }
});

const typeLabel = computed(() => {
  return t(`resource.${props.material.type}Material`);
});

const truncatedDescription = computed(() => {
  if (!props.material.description) return '';
  if (props.material.description.length <= maxDescriptionLength) {
    return props.material.description;
  }
  return props.material.description.substring(0, maxDescriptionLength) + '...';
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
.material-card {
  height: 100%;
  display: flex;
  flex-direction: column;

  &__preview {
    flex-shrink: 0;
    height: 200px;
    background-color: rgb(var(--v-theme-surface-variant));
  }

  &__description {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .v-card-item,
  .v-card-text,
  .v-card-actions {
    flex-shrink: 0;
  }
}
</style>
