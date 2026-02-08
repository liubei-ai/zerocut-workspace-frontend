<template>
  <div class="image-gallery">
    <div v-if="images.length === 0" class="empty-state">
      <v-icon icon="mdi-image-off" size="48" color="grey" />
      <p>{{ emptyText || $t('resource.noImages') }}</p>
    </div>

    <div v-else class="image-grid" :style="{ gridTemplateColumns: `repeat(${columns}, 1fr)` }">
      <div
        v-for="image in images"
        :key="image.id"
        class="image-item"
        :class="{
          'image-item--uploading': image.status === 'uploading',
          'image-item--error': image.status === 'error',
        }"
      >
        <!-- 图片 -->
        <img :src="image.url" :alt="image.fileName || 'Image'" />

        <!-- 状态徽章层（右上角） -->
        <div v-if="showBadge(image)" class="status-badge" :class="`status-badge--${image.status}`">
          <span v-if="image.status === 'new'">{{ $t('common.new') }}</span>
          <span v-if="image.status === 'error'">{{ $t('common.error') }}</span>
        </div>

        <!-- 上传进度层（居中） -->
        <div v-if="image.status === 'uploading'" class="upload-progress">
          <v-progress-circular
            :model-value="image.uploadProgress || 0"
            :size="48"
            :width="4"
            color="primary"
          >
            {{ Math.round(image.uploadProgress || 0) }}%
          </v-progress-circular>
        </div>

        <!-- 悬停操作层（居中） -->
        <div v-if="!readonly && image.status !== 'uploading'" class="image-overlay">
          <v-btn
            icon="mdi-delete"
            size="small"
            color="error"
            variant="elevated"
            @click="handleDelete(image.id)"
          />
        </div>

        <!-- 底部文件名 -->
        <div v-if="showFileName(image)" class="file-name">
          {{ image.fileName }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GalleryImage } from '@/types/image';

interface Props {
  images: GalleryImage[];
  readonly?: boolean;
  emptyText?: string;
  columns?: number;
  showNewBadge?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  columns: 4,
  showNewBadge: false,
});

const emit = defineEmits<{
  delete: [imageId: string];
}>();

const handleDelete = (imageId: string) => {
  emit('delete', imageId);
};

const showBadge = (image: GalleryImage) => {
  if (image.status === 'new' && props.showNewBadge) return true;
  if (image.status === 'error') return true;
  return false;
};

const showFileName = (image: GalleryImage) => {
  return (image.status === 'uploading' || image.status === 'error') && image.fileName;
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
    gap: 12px;

    @media (max-width: 960px) {
      grid-template-columns: repeat(3, 1fr) !important;
    }

    @media (max-width: 600px) {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }

  .image-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden;
    background: rgba(var(--v-theme-surface-variant));
    border: 2px solid transparent;
    transition: border-color 0.2s;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition:
        opacity 0.2s,
        filter 0.2s;
    }

    // 上传中状态：图片模糊+降低透明度
    &--uploading {
      img {
        opacity: 0.6;
        filter: blur(2px);
      }
    }

    // 错误状态：红色边框+半透明图片
    &--error {
      border-color: rgb(var(--v-theme-error));

      img {
        opacity: 0.4;
      }
    }

    // 状态徽章（右上角）
    .status-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      z-index: 2;
      backdrop-filter: blur(4px);

      &--new {
        background: rgba(76, 175, 80, 0.9);
        color: white;
      }

      &--error {
        background: rgba(244, 67, 54, 0.9);
        color: white;
      }
    }

    // 上传进度层（居中）
    .upload-progress {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1;
    }

    // 悬停操作层（居中）
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
      z-index: 1;
    }

    &:hover .image-overlay {
      opacity: 1;
    }

    // 底部文件名
    .file-name {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 8px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      font-size: 12px;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      z-index: 1;
    }
  }
}
</style>
