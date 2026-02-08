<template>
  <v-dialog v-model="dialogModel" max-width="800" persistent>
    <v-card>
      <v-card-title class="text-h5">
        {{ editScene ? $t('resource.editScene') : $t('resource.createScene') }}
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <!-- Name Field -->
          <v-text-field
            v-model="formData.name"
            :label="$t('resource.sceneName') + ' *'"
            :rules="[rules.required, rules.maxLength(255)]"
            variant="outlined"
            class="mb-4"
          />

          <!-- Scene Background Images -->
          <div class="mb-4">
            <h4 class="mb-2">{{ $t('resource.sceneBackground') }} *</h4>
            <p class="text-caption text-medium-emphasis mb-2">
              {{ $t('resource.sceneBackgroundHint') }}
            </p>

            <!-- 统一图片展示 -->
            <ImageGallery
              v-if="images.length > 0"
              :images="images"
              :show-new-badge="!!editScene"
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
              {{ $t('resource.sceneBackgroundRequired') }}
            </v-alert>
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
import type { Scene } from '@/types/resource';
import { nanoid } from 'nanoid';
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import FileUploadHandler from '../FileUploadHandler.vue';

const props = defineProps<{
  modelValue: boolean;
  editScene?: Scene | null;
  libraryId: number;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  save: [];
  close: [];
}>();

const resourceStore = useResourceStore();
const { t } = useI18n();
const formRef = ref();
const saving = ref(false);
const error = ref('');
const showImageWarning = ref(false);
const isMounted = ref(true);

// 单一图片数组
const images = ref<GalleryImage[]>([]);

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const formData = reactive({
  name: '',
  styles: [] as string[],
  description: '',
});

const aiLoading = reactive({
  styles: false,
  description: false,
});

const rules = {
  required: (v: string) => !!v || 'This field is required',
  maxLength: (max: number) => (v: string) => !v || v.length <= max || `Max ${max} characters`,
};

function resetForm() {
  formData.name = '';
  formData.styles = [];
  formData.description = '';
  images.value = [];
  error.value = '';
  showImageWarning.value = false;
}

// Cleanup on unmount
onBeforeUnmount(() => {
  isMounted.value = false;
});

// 初始化表单（编辑模式）
watch(
  () => props.editScene,
  scene => {
    if (scene) {
      // 加载现有图片，标记为existing状态
      images.value =
        scene.referenceImages?.map(img => ({
          id: nanoid(),
          url: img.fileUrl,
          status: 'existing' as const,
        })) || [];

      formData.name = scene.name;
      formData.styles = scene.styles || [];
      formData.description = scene.description || '';
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
  const img = images.value.find(i => i.id === imageId);
  if (img) {
    img.uploadProgress = progress;
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
  if (!formRef.value || !isMounted.value) return;

  const { valid } = await formRef.value.validate();
  if (!valid) return;

  // 过滤有效图片（排除uploading和error状态）
  const validImages = images.value
    .filter(img => ['existing', 'new'].includes(img.status))
    .map(img => img.url);

  if (validImages.length === 0) {
    showImageWarning.value = true;
    error.value = t('resource.sceneBackgroundRequired');
    return;
  }
  showImageWarning.value = false;

  saving.value = true;
  error.value = '';

  try {
    const payload = {
      name: formData.name,
      styles: formData.styles,
      description: formData.description || undefined,
      referenceImages: validImages,
    };

    if (props.editScene?.id) {
      await resourceStore.updateScene(props.editScene.id, payload);
    } else {
      await resourceStore.createScene(props.libraryId, payload);
    }

    if (isMounted.value) {
      handleClose();
      emit('save');
    }
  } catch (err) {
    if (isMounted.value) {
      error.value = `Failed to save scene: ${String(err)}`;
    }
  } finally {
    if (isMounted.value) {
      saving.value = false;
    }
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
  dialogModel.value = false;
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
