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

          <!-- Scene Background Upload -->
          <div class="mb-4">
            <h4 class="mb-2">{{ $t('resource.sceneBackground') }} *</h4>
            <p class="text-caption text-medium-emphasis mb-2">
              {{ $t('resource.sceneBackgroundHint') }}
            </p>

            <!-- 现有上传的图片 -->
            <div v-if="editScene && existingImages.length > 0" class="mb-4">
              <div class="text-subtitle-2 mb-2">{{ $t('resource.existingImages') }}</div>
              <ImageGallery :images="existingImages" @delete="handleDeleteExistingImage" />
            </div>

            <!-- 新上传的图片 -->
            <div v-if="formData.referenceImages.length > 0" class="mb-4">
              <div class="text-subtitle-2 mb-2">
                {{ editScene ? $t('resource.newImages') : $t('resource.sceneBackground') }}
              </div>
              <ImageGallery :images="formData.referenceImages" @delete="handleDeleteNewImage" />
            </div>

            <!-- 上传按钮 -->
            <div v-if="canUploadMore" class="mb-4">
              <FileUploadHandler
                :max-images="remainingSlots"
                category="reference-image"
                @update:urls="formData.referenceImages = [...formData.referenceImages, ...$event]"
              />
            </div>

            <v-alert v-if="totalImages >= 4" type="info" density="compact">
              {{ $t('resource.maxImagesReached') }}
            </v-alert>
          </div>

          <!-- Styles Field with AI Generation -->
          <div class="mb-4">
            <v-combobox
              v-model="formData.styles"
              :label="$t('resource.styles')"
              variant="outlined"
              chips
              multiple
              :loading="aiLoading.styles"
            >
            </v-combobox>
          </div>

          <!-- Description Field with AI Generation -->
          <div class="mb-4">
            <v-textarea
              v-model="formData.description"
              :label="$t('resource.description')"
              variant="outlined"
              rows="3"
              :loading="aiLoading.description"
            >
            </v-textarea>
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
import { useResourceStore } from '@/stores/resourceStore';
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ImageGallery from '@/components/ResourceLibrary/ImageGallery.vue';
import FileUploadHandler from '../SubjectAssets/FileUploadHandler.vue';

interface Scene {
  id?: string;
  name: string;
  styles: string[];
  description?: string;
  referenceImages: any[];
}

const props = defineProps<{
  modelValue: boolean;
  editScene?: Scene | null;
  libraryId: string;
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
const isMounted = ref(true);
const existingImages = ref<string[]>([]);

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const formData = reactive({
  name: '',
  styles: [] as string[],
  description: '',
  referenceImages: [] as string[],
});

const aiLoading = reactive({
  styles: false,
  description: false,
});

const totalImages = computed(() => existingImages.value.length + formData.referenceImages.length);
const remainingSlots = computed(() => Math.max(0, 4 - totalImages.value));
const canUploadMore = computed(() => totalImages.value < 4);

const rules = {
  required: (v: string) => !!v || 'This field is required',
  maxLength: (max: number) => (v: string) => !v || v.length <= max || `Max ${max} characters`,
};

function resetForm() {
  formData.name = '';
  formData.styles = [];
  formData.description = '';
  formData.referenceImages = [];
  existingImages.value = [];
  error.value = '';
}

// Cleanup on unmount
onBeforeUnmount(() => {
  isMounted.value = false;
});

// Initialize form when editing
watch(
  () => props.editScene,
  scene => {
    if (scene) {
      // 编辑模式：分离现有图片和新图片
      existingImages.value = scene.referenceImages?.map((img: any) => img.fileUrl) || [];
      formData.name = scene.name;
      formData.styles = scene.styles || [];
      formData.description = scene.description || '';
      formData.referenceImages = []; // 新上传的图片
    } else {
      // 创建模式
      resetForm();
    }
  },
  { immediate: true }
);

// const handleGenerateStyles = async () => {
//   if (formData.referenceImages.length === 0) return;

//   aiLoading.styles = true;
//   error.value = '';

//   try {
//     const styles = await resourceStore.generateSceneStyles(formData.referenceImages);
//     if (isMounted.value) {
//       formData.styles = styles;
//     }
//   } catch (err) {
//     if (isMounted.value) {
//       error.value = `Failed to generate styles: ${String(err)}`;
//     }
//   } finally {
//     if (isMounted.value) {
//       aiLoading.styles = false;
//     }
//   }
// };

// const handleGenerateDescription = async () => {
//   if (formData.referenceImages.length === 0) return;

//   aiLoading.description = true;
//   error.value = '';

//   try {
//     // const description = await resourceStore.generateSceneDescription(formData.referenceImages);
//     // if (isMounted.value) {
//     //   formData.description = description;
//     // }
//   } catch (err) {
//     if (isMounted.value) {
//       error.value = `Failed to generate description: ${String(err)}`;
//     }
//   } finally {
//     if (isMounted.value) {
//       aiLoading.description = false;
//     }
//   }
// };

const handleDeleteExistingImage = (index: number) => {
  existingImages.value.splice(index, 1);
};

const handleDeleteNewImage = (index: number) => {
  formData.referenceImages.splice(index, 1);
};

const handleSubmit = async () => {
  if (!formRef.value || !isMounted.value) return;

  const { valid } = await formRef.value.validate();
  if (!valid) return;

  // 合并现有和新图片
  const allImages = [...existingImages.value, ...formData.referenceImages];

  if (allImages.length === 0) {
    error.value = t('resource.sceneBackgroundRequired');
    return;
  }

  saving.value = true;
  error.value = '';

  try {
    const payload = {
      name: formData.name,
      styles: formData.styles,
      description: formData.description || undefined,
      referenceImages: allImages,
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
