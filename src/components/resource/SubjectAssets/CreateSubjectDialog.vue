<template>
  <v-dialog
    :model-value="modelValue"
    max-width="800"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="text-h5">
        {{ editSubject ? $t('resource.editSubject') : $t('resource.createSubject') }}
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <!-- Name Field -->
          <v-text-field
            v-model="formData.name"
            :label="$t('resource.subjectName') + ' *'"
            :rules="[rules.required, rules.maxLength(255)]"
            variant="outlined"
            class="mb-4"
          />

          <!-- Reference Images -->
          <div class="mb-4">
            <h4 class="mb-2">{{ $t('resource.referenceImages') }} *</h4>

            <!-- 统一图片展示 -->
            <ImageGallery
              v-if="images.length > 0"
              :images="images"
              :show-new-badge="!!editSubject"
              class="mb-4"
              @delete="handleDeleteImage"
            />

            <!-- 上传区域 -->
            <FileUploadHandler
              :max-images="4 - images.length"
              :disabled="images.length >= 4"
              category="reference-image"
              @upload-start="handleUploadStart"
              @upload-progress="handleUploadProgress"
              @upload-complete="handleUploadComplete"
              @upload-error="handleUploadError"
            />

            <!-- 提示信息 -->
            <v-alert v-if="images.length >= 4" type="info" density="compact" class="mt-2">
              {{ $t('resource.maxImagesReached') }}
            </v-alert>

            <v-alert
              v-if="images.length === 0 && showImageWarning"
              type="warning"
              density="compact"
              class="mt-2"
            >
              {{ $t('resource.referenceImagesRequired') }}
            </v-alert>
          </div>

          <!-- Voice Field -->
          <div class="mb-4">
            <v-text-field
              v-model="formData.voice"
              :label="$t('resource.voice')"
              variant="outlined"
              :loading="aiLoading.voice"
            />
          </div>

          <!-- Styles Field -->
          <div class="mb-4">
            <v-combobox
              v-model="formData.styles"
              :label="$t('resource.styles')"
              variant="outlined"
              chips
              multiple
              :loading="aiLoading.styles"
            />
          </div>

          <!-- Description Field -->
          <div class="mb-4">
            <v-textarea
              v-model="formData.description"
              :label="$t('resource.description')"
              variant="outlined"
              rows="3"
              :loading="aiLoading.description"
            />
          </div>

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
        <v-btn color="primary" :loading="saving" @click="handleSubmit">
          {{ $t('common.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import ImageGallery from '@/components/resource/ResourceLibrary/ImageGallery.vue';
import { useResourceStore } from '@/stores/resourceStore';
import type { GalleryImage } from '@/types/image';
import type { Subject } from '@/types/resource';
import { nanoid } from 'nanoid';
import { reactive, ref, watch } from 'vue';
import FileUploadHandler from '../FileUploadHandler.vue';

const props = defineProps<{
  modelValue: boolean;
  editSubject?: Subject | null;
  libraryId: number;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  save: [];
  close: [];
}>();

const resourceStore = useResourceStore();
const formRef = ref();
const saving = ref(false);
const error = ref('');
const showImageWarning = ref(false);

// 单一图片数组
const images = ref<GalleryImage[]>([]);

const formData = reactive({
  name: '',
  voice: '',
  styles: [] as string[],
  description: '',
});

const aiLoading = reactive({
  voice: false,
  styles: false,
  description: false,
});

const rules = {
  required: (v: string) => !!v || 'This field is required',
  maxLength: (max: number) => (v: string) => !v || v.length <= max || `Max ${max} characters`,
};

const resetForm = () => {
  formData.name = '';
  formData.voice = '';
  formData.styles = [];
  formData.description = '';
  images.value = [];
  error.value = '';
  showImageWarning.value = false;
};

// 初始化表单（编辑模式）
watch(
  () => props.editSubject,
  subject => {
    if (subject) {
      // 加载现有图片，标记为existing状态
      images.value =
        subject.referenceImages?.map(img => ({
          id: nanoid(),
          url: img.fileUrl,
          status: 'existing' as const,
        })) || [];

      formData.name = subject.name;
      formData.voice = subject.voice || '';
      formData.styles = subject.styles || [];
      formData.description = subject.description || '';
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

// 上传开始：添加到images数组
const handleUploadStart = (image: GalleryImage) => {
  images.value.push(image);
};

// 上传进度：更新进度值
const handleUploadProgress = (imageId: string, progress: number) => {
  console.log('[CreateSubjectDialog] Upload progress:', { imageId, progress });
  const img = images.value.find(i => i.id === imageId);
  if (img) {
    img.uploadProgress = progress;
    console.log('[CreateSubjectDialog] Progress updated for image:', img);
  } else {
    console.warn('[CreateSubjectDialog] Image not found for progress update:', imageId);
  }
};

// 上传完成：切换状态为new
const handleUploadComplete = (imageId: string, url: string) => {
  const img = images.value.find(i => i.id === imageId);
  if (img) {
    // 清理预览URL
    if (img.url.startsWith('blob:') || img.url.startsWith('data:')) {
      if (img.url.startsWith('blob:')) {
        URL.revokeObjectURL(img.url);
      }
    }

    // 更新状态
    img.status = 'new';
    img.url = url;
    img.uploadProgress = 100;
    delete img.file;
  }
};

// 上传失败：切换状态为error
const handleUploadError = (imageId: string, errorMsg: string) => {
  const img = images.value.find(i => i.id === imageId);
  if (img) {
    img.status = 'error';
    img.errorMessage = errorMsg;
  }
};

// 删除图片
const handleDeleteImage = (imageId: string) => {
  const index = images.value.findIndex(i => i.id === imageId);
  if (index === -1) return;

  const img = images.value[index];

  // 清理blob URL
  if (img.url.startsWith('blob:')) {
    URL.revokeObjectURL(img.url);
  }

  // 从数组中移除
  images.value.splice(index, 1);
};

// 提交表单
const handleSubmit = async () => {
  console.log('=== handleSubmit called ===');

  // 过滤有效图片（排除uploading和error状态）
  const validImages = images.value
    .filter(img => ['existing', 'new'].includes(img.status))
    .map(img => img.url);

  console.log('validImages.length:', validImages.length);
  console.log('validImages:', validImages);

  if (validImages.length === 0) {
    console.log('No valid reference images, blocking save');
    showImageWarning.value = true;
    error.value = 'Please upload at least one reference image';
    return;
  }
  showImageWarning.value = false;

  console.log('Validating form...');
  const { valid } = await formRef.value.validate();
  console.log('Form validation result:', valid);
  if (!valid) {
    console.log('Form validation failed, returning early');
    return;
  }

  console.log('All validations passed, calling API...');
  saving.value = true;
  error.value = '';

  try {
    const payload = {
      name: formData.name,
      voice: formData.voice || undefined,
      styles: formData.styles,
      description: formData.description || undefined,
      referenceImages: validImages,
    };

    console.log('Payload:', payload);

    if (props.editSubject?.id) {
      console.log('Updating existing subject:', props.editSubject.id);
      await resourceStore.updateSubject(props.editSubject.id, payload);
    } else {
      console.log('Creating new subject for library:', props.libraryId);
      await resourceStore.createSubject(props.libraryId, payload);
    }

    console.log('API call successful');
    emit('save');
    handleClose();
  } catch (err) {
    console.error('API call failed:', err);
    error.value = `Failed to save subject: ${String(err)}`;
  } finally {
    saving.value = false;
  }
};

const handleClose = () => {
  // 清理所有blob URL
  images.value.forEach(img => {
    if (img.url.startsWith('blob:')) {
      URL.revokeObjectURL(img.url);
    }
  });

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
