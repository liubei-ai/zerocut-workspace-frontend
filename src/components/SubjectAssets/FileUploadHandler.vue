<template>
  <div class="file-upload-handler">
    <!-- Drag & Drop Area -->
    <div
      class="upload-area"
      :class="{ 'upload-area--dragging': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        :accept="acceptFileTypes"
        style="display: none"
        @change="handleFileSelect"
      />

      <div class="upload-area__content">
        <v-icon icon="mdi-cloud-upload" size="64" color="primary" />
        <h3 class="mt-2">{{ $t('resource.uploadReferenceImages') }}</h3>
        <p class="text-body-2 text-medium-emphasis">
          {{ $t('resource.maxImages', { max: maxImages }) }}
        </p>
        <v-btn variant="outlined" color="primary" @click="fileInput?.click()" class="mt-2">
          {{ $t('common.search') }}
        </v-btn>
      </div>
    </div>

    <!-- Preview Images -->
    <div v-if="previewImages.length > 0" class="mt-4">
      <h4 class="mb-2">{{ $t('resource.referenceImages') }}</h4>
      <v-row>
        <v-col v-for="(image, index) in previewImages" :key="index" cols="12" sm="6" md="4">
          <v-card class="preview-card">
            <v-img :src="image.preview" :aspect-ratio="1" cover />
            <v-card-text class="pa-2">
              <div class="text-caption text-truncate">{{ image.file.name }}</div>
              <v-progress-linear
                v-if="uploadProgress[index] !== undefined"
                :model-value="uploadProgress[index]"
                class="mt-1"
              />
            </v-card-text>
            <v-card-actions class="pa-2">
              <v-spacer />
              <v-btn icon="mdi-delete" size="small" variant="text" @click="removeImage(index)" />
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <v-alert
        v-if="uploadedUrls.length > 0"
        type="success"
        class="mt-4"
        :icon="'mdi-check-circle'"
      >
        {{ uploadedUrls.length }} {{ $t('resource.referenceImages') }} {{ $t('common.save') }}
      </v-alert>
    </div>

    <!-- Error Messages -->
    <v-alert v-if="error" type="error" class="mt-4" closable @click="error = ''">
      {{ error }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useResourceStore } from '@/stores/resourceStore';

interface PreviewImage {
  file: File;
  preview: string;
}

const props = defineProps<{
  maxImages?: number;
  category?: 'reference-image' | 'audio' | 'video' | 'image';
}>();

const emit = defineEmits<{
  'update:urls': [urls: string[]];
}>();

const resourceStore = useResourceStore();
const fileInput = ref<HTMLInputElement>();
const isDragging = ref(false);
const previewImages = ref<PreviewImage[]>([]);
const uploadedUrls = ref<string[]>([]);
const uploadProgress = ref<Record<number, number>>({});
const error = ref('');

const maxImages = computed(() => props.maxImages ?? 4);
const acceptFileTypes = computed(() => {
  const category = props.category ?? 'reference-image';
  const types: Record<string, string> = {
    'reference-image': 'image/jpeg,image/png,image/webp',
    audio: 'audio/mpeg,audio/wav',
    video: 'video/mp4,video/quicktime',
    image: 'image/jpeg,image/png,image/webp',
  };
  return types[category] || 'image/*';
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
};

const processFiles = async (files: File[]) => {
  error.value = '';

  if (previewImages.value.length + files.length > maxImages.value) {
    error.value = `Maximum ${maxImages.value} files allowed`;
    return;
  }

  for (const file of files) {
    if (!acceptFileTypes.value.includes(file.type)) {
      error.value = `Invalid file type: ${file.type}`;
      continue;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = async e => {
      const preview = e.target?.result as string;
      const index = previewImages.value.length;

      previewImages.value.push({
        file,
        preview,
      });

      // Upload file
      await uploadFile(file, index);
    };
    reader.readAsDataURL(file);
  }
};

const uploadFile = async (file: File, index: number) => {
  try {
    // Get presigned URL
    const response = await resourceStore.getPresignedUploadUrl({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      category: props.category ?? 'reference-image',
    });

    // Upload to TOS
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', event => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        uploadProgress.value[index] = percentComplete;
      }
    });

    xhr.addEventListener('load', async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        uploadProgress.value[index] = 100;
        uploadedUrls.value.push(response.fileUrl);
        emit('update:urls', uploadedUrls.value);

        // Verify file exists
        try {
          await resourceStore.verifyFileExists(response.fileUrl);
        } catch (error) {
          console.warn('File verification failed:', error);
        }
      } else {
        error.value = `Upload failed: ${xhr.statusText}`;
        removeImage(index);
      }
    });

    xhr.addEventListener('error', () => {
      error.value = 'Upload error occurred';
      removeImage(index);
    });

    xhr.open('PUT', response.uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  } catch (err) {
    error.value = `Failed to upload file: ${String(err)}`;
    removeImage(index);
  }
};

const removeImage = (index: number) => {
  previewImages.value.splice(index, 1);
  uploadedUrls.value.splice(index, 1);
  delete uploadProgress.value[index];
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

    &:hover {
      border-color: rgb(var(--v-theme-primary));
      background-color: rgba(var(--v-theme-primary), 0.05);
    }

    &--dragging {
      border-color: rgb(var(--v-theme-primary));
      background-color: rgba(var(--v-theme-primary), 0.1);
    }

    &__content {
      pointer-events: none;
    }
  }

  .preview-card {
    position: relative;
    overflow: hidden;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
}
</style>
