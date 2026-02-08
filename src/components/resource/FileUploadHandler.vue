<template>
  <div class="file-upload-handler">
    <!-- Drag & Drop Area -->
    <div
      class="upload-area"
      :class="{
        'upload-area--dragging': isDragging,
        'upload-area--disabled': disabled,
      }"
      @click="!disabled && fileInput?.click()"
      @dragover.prevent="!disabled && (isDragging = true)"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="!disabled && handleDrop($event)"
    >
      <input
        ref="fileInput"
        type="file"
        :multiple="maxImages > 1"
        :accept="acceptFileTypes"
        :disabled="disabled"
        style="display: none"
        @change="handleFileSelect"
      />

      <div class="upload-area__content">
        <v-icon
          :icon="disabled ? 'mdi-cloud-off' : 'mdi-cloud-upload'"
          size="64"
          :color="disabled ? 'grey' : 'primary'"
        />
        <h3 class="mt-2">
          {{ disabled ? $t('resource.maxImagesReached') : $t(uploadTitleKey) }}
        </h3>
        <p v-if="!disabled" class="text-body-2 text-medium-emphasis">
          {{ $t(uploadHintKey, { max: maxImages }) }}
        </p>
      </div>
    </div>

    <!-- Error Messages -->
    <v-alert v-if="error" type="error" class="mt-4" closable @click="error = ''">
      {{ error }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { useResourceStore } from '@/stores/resourceStore';
import { computed, ref } from 'vue';
import { nanoid } from 'nanoid';
import type { GalleryImage } from '@/types/image';

interface Props {
  maxImages?: number;
  category?: 'reference-image' | 'audio' | 'video' | 'image';
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  maxImages: 4,
  category: 'reference-image',
  disabled: false,
});

const emit = defineEmits<{
  'upload-start': [image: GalleryImage];
  'upload-progress': [imageId: string, progress: number];
  'upload-complete': [imageId: string, url: string];
  'upload-error': [imageId: string, error: string];
}>();

const resourceStore = useResourceStore();
const fileInput = ref<HTMLInputElement>();
const isDragging = ref(false);
const error = ref('');

const category = computed(() => props.category);
const maxImages = computed(() => props.maxImages);
const isImageCategory = computed(
  () => category.value === 'reference-image' || category.value === 'image'
);

const uploadTitleKey = computed(() => {
  switch (category.value) {
    case 'audio':
      return 'resource.uploadAudio';
    case 'video':
      return 'resource.uploadVideo';
    case 'image':
      return 'resource.uploadImage';
    case 'reference-image':
      return 'resource.uploadReferenceImages';
    default:
      return 'resource.uploadFile';
  }
});

const uploadHintKey = computed(() =>
  isImageCategory.value ? 'resource.maxImages' : 'resource.maxFiles'
);

const acceptFileTypes = computed(() => {
  const types: Record<string, string> = {
    'reference-image': 'image/jpeg,image/png,image/webp',
    audio: 'audio/mpeg,audio/wav',
    video: 'video/mp4,video/quicktime',
    image: 'image/jpeg,image/png,image/webp',
  };
  return types[category.value] || 'image/*';
});

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  const files = event.dataTransfer?.files;
  if (files) {
    processFiles(Array.from(files));
  }
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    processFiles(Array.from(target.files));
  }
  // 重置input值以允许重复选择同一文件
  target.value = '';
};

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const processFiles = async (files: File[]) => {
  error.value = '';

  for (const file of files) {
    // 验证文件类型
    if (!acceptFileTypes.value.includes(file.type)) {
      error.value = `Invalid file type: ${file.type}`;
      continue;
    }

    const imageId = nanoid();

    // 生成预览URL
    let previewUrl: string;
    if (isImageCategory.value) {
      try {
        previewUrl = await readFileAsDataURL(file);
      } catch (err) {
        error.value = `Failed to read file: ${String(err)}`;
        continue;
      }
    } else {
      previewUrl = URL.createObjectURL(file);
    }

    // 立即emit上传开始事件
    emit('upload-start', {
      id: imageId,
      url: previewUrl,
      status: 'uploading',
      uploadProgress: 0,
      fileName: file.name,
      file,
    });

    // 异步上传
    uploadFile(file, imageId);
  }
};

const uploadFile = async (file: File, imageId: string) => {
  try {
    // Get presigned URL
    const response = await resourceStore.getPresignedUploadUrl({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      category: category.value,
    });

    console.log('[Upload] Starting upload:', {
      fileName: file.name,
      fileSize: file.size,
      imageId,
      uploadUrl: response.uploadUrl,
    });

    const xhr = new XMLHttpRequest();

    // IMPORTANT: 必须在xhr.open()之前添加所有事件监听器

    // 上传进度
    xhr.upload.addEventListener('progress', event => {
      console.log('[Upload] Progress event:', {
        imageId,
        lengthComputable: event.lengthComputable,
        loaded: event.loaded,
        total: event.total,
      });

      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        console.log('[Upload] Emitting progress:', imageId, progress);
        emit('upload-progress', imageId, progress);
      }
    });

    // 上传完成
    xhr.addEventListener('load', async () => {
      console.log('[Upload] Load event:', {
        imageId,
        status: xhr.status,
        statusText: xhr.statusText,
      });

      if (xhr.status >= 200 && xhr.status < 300) {
        emit('upload-progress', imageId, 100);

        // 验证文件存在
        try {
          await resourceStore.verifyFileExists(response.fileUrl);
          console.log('[Upload] Upload complete:', imageId, response.fileUrl);
          emit('upload-complete', imageId, response.fileUrl);
        } catch (err) {
          console.warn('File verification failed:', err);
          emit('upload-error', imageId, 'File verification failed');
        }
      } else {
        emit('upload-error', imageId, xhr.statusText || 'Upload failed');
      }
    });

    // 上传开始
    xhr.upload.addEventListener('loadstart', () => {
      console.log('[Upload] Load start:', imageId);
    });

    // 上传错误
    xhr.addEventListener('error', () => {
      console.error('[Upload] Error event:', imageId);
      emit('upload-error', imageId, 'Network error occurred');
    });

    // 上传超时
    xhr.addEventListener('timeout', () => {
      console.error('[Upload] Timeout event:', imageId);
      emit('upload-error', imageId, 'Upload timeout');
    });

    // 上传中止
    xhr.addEventListener('abort', () => {
      console.warn('[Upload] Abort event:', imageId);
      emit('upload-error', imageId, 'Upload aborted');
    });

    // 必须在添加完所有事件监听器后再open和send
    xhr.open('PUT', response.uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.timeout = 60000; // 60秒超时

    console.log('[Upload] Sending request:', imageId);
    xhr.send(file);
  } catch (err) {
    console.error('[Upload] Exception:', err);
    emit('upload-error', imageId, String(err));
  }
};
</script>

<style scoped lang="scss">
.file-upload-handler {
  .upload-area {
    border: 2px dashed rgba(var(--v-border-color), 0.5);
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover:not(&--disabled) {
      border-color: rgb(var(--v-theme-primary));
      background-color: rgba(var(--v-theme-primary), 0.05);
    }

    &--dragging {
      border-color: rgb(var(--v-theme-primary));
      background-color: rgba(var(--v-theme-primary), 0.1);
    }

    &--disabled {
      cursor: not-allowed;
      opacity: 0.6;
      background-color: rgba(var(--v-theme-surface-variant), 0.3);
    }

    &__content {
      h3 {
        margin: 0;
      }

      p {
        margin: 0.5rem 0 0;
      }
    }
  }
}
</style>
