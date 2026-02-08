<template>
  <v-card class="subject-card" elevation="2" hover>
    <!-- Reference Images Carousel -->
    <v-carousel
      v-if="subject.referenceImages && subject.referenceImages.length > 0"
      :height="200"
      hide-delimiters
      show-arrows="hover"
      class="subject-card__carousel"
    >
      <v-carousel-item
        v-for="(image, index) in subject.referenceImages"
        :key="index"
        :src="image.fileUrl"
        cover
      />
    </v-carousel>

    <!-- Placeholder if no images -->
    <div v-else class="subject-card__placeholder">
      <v-icon icon="mdi-account" size="64" color="grey-lighten-2" />
    </div>

    <v-card-item>
      <v-card-title class="text-h6">{{ subject.name }}</v-card-title>
      <v-card-subtitle v-if="subject.voice">
        <v-icon icon="mdi-microphone" size="small" class="mr-1" />
        {{ subject.voice }}
      </v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <!-- Style Tags -->
      <div v-if="subject.styles && subject.styles.length > 0" class="mb-2">
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
          v-if="subject.styles.length > maxDisplayStyles"
          size="small"
          variant="text"
          class="mb-1"
        >
          +{{ subject.styles.length - maxDisplayStyles }}
        </v-chip>
      </div>

      <!-- Description -->
      <p
        v-if="subject.description"
        class="text-body-2 text-medium-emphasis subject-card__description"
      >
        {{ truncatedDescription }}
      </p>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn icon="mdi-pencil" variant="text" size="small" @click="$emit('edit', subject)" />
      <v-btn
        icon="mdi-delete"
        variant="text"
        size="small"
        color="error"
        @click="$emit('delete', subject.id)"
      />
    </v-card-actions>

    <!-- Metadata Footer -->
    <v-divider />
    <v-card-text class="text-caption text-medium-emphasis pa-2">
      <v-icon icon="mdi-clock-outline" size="x-small" class="mr-1" />
      {{ formatDate(subject.createdAt) }}
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { Subject } from '@/types/resource';
import { computed } from 'vue';

const props = defineProps<{
  subject: Subject;
}>();

defineEmits<{
  edit: [subject: Subject];
  delete: [id: number];
}>();

const maxDisplayStyles = 5;
const maxDescriptionLength = 100;

const displayStyles = computed(() => {
  return props.subject.styles.slice(0, maxDisplayStyles);
});

const truncatedDescription = computed(() => {
  if (!props.subject.description) return '';
  if (props.subject.description.length <= maxDescriptionLength) {
    return props.subject.description;
  }
  return props.subject.description.substring(0, maxDescriptionLength) + '...';
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
.subject-card {
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
