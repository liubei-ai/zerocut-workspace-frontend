<template>
  <v-dialog
    :model-value="modelValue"
    max-width="600"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="text-h5">
        {{ editMaterial ? $t('resource.editMaterial') : $t('resource.createMaterial') }}
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <!-- Material Type Selection -->
          <v-select
            v-model="formData.type"
            :label="$t('resource.materialType') + ' *'"
            :items="materialTypes"
            :rules="[rules.required]"
            variant="outlined"
            class="mb-4"
            @update:model-value="handleTypeChange"
          />

          <!-- Name Field -->
          <v-text-field
            v-model="formData.name"
            :label="$t('resource.materialName') + ' *'"
            :rules="[rules.required, rules.maxLength(255)]"
            variant="outlined"
            class="mb-4"
          />

          <!-- File Upload -->
          <div class="mb-4">
            <h4 class="mb-2">{{ uploadLabel }} *</h4>

            <!-- 上传成功的文件预览 -->
            <v-card v-if="uploadedFile" class="mb-4" variant="outlined">
              <v-card-text class="d-flex align-center gap-3">
                <v-icon :icon="fileIcon" size="32" :color="fileIconColor" />
                <div class="flex-grow-1">
                  <div class="text-body-1 font-weight-medium">{{ uploadedFile.fileName }}</div>
                  <div class="text-caption text-medium-emphasis">{{ $t('common.save') }}</div>
                </div>
                <v-btn icon="mdi-delete" size="small" variant="text" @click="handleDeleteFile" />
              </v-card-text>
            </v-card>

            <!-- 上传中的文件 -->
            <v-card v-else-if="uploadingFile" class="mb-4" variant="outlined">
              <v-card-text>
                <div class="d-flex align-center gap-3 mb-2">
                  <v-icon :icon="fileIcon" size="32" color="grey" />
                  <div class="flex-grow-1">
                    <div class="text-body-2">{{ uploadingFile.fileName }}</div>
                  </div>
                </div>
                <v-progress-linear :model-value="uploadingFile.progress" color="primary" height="6">
                  <template #default="{ value }">
                    <span class="text-caption">{{ Math.round(value) }}%</span>
                  </template>
                </v-progress-linear>
              </v-card-text>
            </v-card>

            <!-- 上传失败的文件 -->
            <v-alert
              v-else-if="uploadError"
              type="error"
              class="mb-4"
              closable
              @click="uploadError = ''"
            >
              {{ uploadError }}
            </v-alert>

            <!-- 上传区域 -->
            <FileUploadHandler
              v-if="!uploadedFile"
              :max-images="1"
              :category="formData.type"
              :class="{ 'd-none': uploadingFile }"
              @upload-start="handleUploadStart"
              @upload-progress="handleUploadProgress"
              @upload-complete="handleUploadComplete"
              @upload-error="handleUploadError"
            />
          </div>

          <!-- Description Field -->
          <v-textarea
            v-model="formData.description"
            :label="$t('resource.description')"
            variant="outlined"
            rows="3"
            class="mb-4"
          />

          <!-- Error Alert -->
          <v-alert v-if="error" type="error" class="mb-4" closable @click="error = ''">
            {{ error }}
          </v-alert>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="handleClose">
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          :loading="saving"
          :disabled="!uploadedFile && !editMaterial"
          @click="handleSubmit"
        >
          {{ editMaterial ? $t('common.update') : $t('common.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useResourceStore } from '@/stores/resourceStore';
import type { OtherMaterial } from '@/types/resource';
import type { GalleryImage } from '@/types/image';
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import FileUploadHandler from '../FileUploadHandler.vue';

interface UploadingFile {
  fileName: string;
  progress: number;
}

interface UploadedFile {
  fileName: string;
  url: string;
}

const props = defineProps<{
  modelValue: boolean;
  libraryId: number;
  editMaterial?: OtherMaterial | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  save: [];
  close: [];
  'material-updated': [];
}>();

const resourceStore = useResourceStore();
const { t } = useI18n();
const formRef = ref();
const saving = ref(false);
const error = ref('');
const uploadError = ref('');

// 上传状态
const uploadingFile = ref<UploadingFile | null>(null);
const uploadedFile = ref<UploadedFile | null>(null);
const currentUploadId = ref<string>('');

const formData = reactive({
  name: '',
  type: 'image' as 'audio' | 'video' | 'image',
  description: '',
});

const materialTypes = computed(() => [
  { value: 'audio', title: t('resource.audioMaterial') },
  { value: 'video', title: t('resource.videoMaterial') },
  { value: 'image', title: t('resource.imageMaterial') },
]);

const uploadLabel = computed(() => {
  switch (formData.type) {
    case 'audio':
      return t('resource.uploadAudio');
    case 'video':
      return t('resource.uploadVideo');
    case 'image':
      return t('resource.uploadImage');
    default:
      return t('resource.uploadFile');
  }
});

const fileIcon = computed(() => {
  switch (formData.type) {
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

const fileIconColor = computed(() => {
  if (uploadedFile.value) return 'success';
  if (uploadingFile.value) return 'grey';
  return 'primary';
});

const rules = {
  required: (v: string) => !!v || 'This field is required',
  maxLength: (max: number) => (v: string) => !v || v.length <= max || `Max ${max} characters`,
};

const handleTypeChange = () => {
  // Reset upload when type changes
  uploadingFile.value = null;
  uploadedFile.value = null;
  uploadError.value = '';
  currentUploadId.value = '';
};

const handleDeleteFile = () => {
  uploadedFile.value = null;
  uploadingFile.value = null;
  uploadError.value = '';
  currentUploadId.value = '';
};

// 上传开始
const handleUploadStart = (image: GalleryImage) => {
  console.log('[CreateMaterialDialog] Upload start:', image);
  currentUploadId.value = image.id;
  uploadingFile.value = {
    fileName: image.fileName || 'Uploading...',
    progress: 0,
  };
  uploadedFile.value = null;
  uploadError.value = '';
};

// 上传进度
const handleUploadProgress = (imageId: string, progress: number) => {
  console.log('[CreateMaterialDialog] Upload progress:', {
    imageId,
    currentUploadId: currentUploadId.value,
    progress,
    hasUploadingFile: !!uploadingFile.value,
  });

  if (imageId === currentUploadId.value && uploadingFile.value) {
    uploadingFile.value.progress = progress;
    console.log('[CreateMaterialDialog] Progress updated:', uploadingFile.value.progress);
  }
};

// 上传完成
const handleUploadComplete = (imageId: string, url: string) => {
  console.log('[CreateMaterialDialog] Upload complete:', { imageId, url });

  if (imageId === currentUploadId.value && uploadingFile.value) {
    uploadedFile.value = {
      fileName: uploadingFile.value.fileName,
      url,
    };
    uploadingFile.value = null;
    uploadError.value = '';
  }
};

// 上传失败
const handleUploadError = (imageId: string, errorMsg: string) => {
  if (imageId === currentUploadId.value) {
    uploadError.value = errorMsg;
    uploadingFile.value = null;
    uploadedFile.value = null;
  }
};

const resetForm = () => {
  formData.name = '';
  formData.type = 'image';
  formData.description = '';
  uploadingFile.value = null;
  uploadedFile.value = null;
  uploadError.value = '';
  currentUploadId.value = '';
  error.value = '';
};

// Pre-fill form when editing
watch(
  () => props.modelValue,
  newOpen => {
    if (newOpen && props.editMaterial) {
      formData.name = props.editMaterial.name;
      formData.type = props.editMaterial.type;
      formData.description = props.editMaterial.description || '';

      // 编辑模式：显示已有文件
      uploadedFile.value = {
        fileName: props.editMaterial.name,
        url: props.editMaterial.fileUrl,
      };

      uploadingFile.value = null;
      uploadError.value = '';
      error.value = '';
      formRef.value?.resetValidation();
    } else if (newOpen) {
      // Reset for create mode
      resetForm();
      formRef.value?.resetValidation();
    }
  }
);

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  // 获取文件URL（编辑模式使用已有的，创建模式使用新上传的）
  const fileUrl = uploadedFile.value?.url || '';

  if (!fileUrl) {
    error.value = 'Please upload a file';
    return;
  }

  saving.value = true;
  error.value = '';

  try {
    const payload = {
      name: formData.name,
      type: formData.type,
      fileUrl,
      description: formData.description || undefined,
    };

    if (props.editMaterial) {
      // Edit mode
      await resourceStore.updateMaterial(props.editMaterial.id, payload);
      emit('material-updated');
    } else {
      // Create mode
      await resourceStore.createMaterial(props.libraryId, payload);
    }

    emit('save');
    handleClose();
  } catch (err) {
    error.value = `Failed to save material: ${String(err)}`;
  } finally {
    saving.value = false;
  }
};

const handleClose = () => {
  resetForm();
  emit('close');
  emit('update:modelValue', false);
};
</script>

<style scoped lang="scss">
.v-card {
  .v-card-text {
    max-height: 70vh;
    overflow-y: auto;
  }
}
</style>
