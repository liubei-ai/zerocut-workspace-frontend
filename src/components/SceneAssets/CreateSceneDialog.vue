<template>
  <v-dialog
    :model-value="modelValue"
    max-width="800"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
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

          <!-- File Upload -->
          <div class="mb-4">
            <h4 class="mb-2">{{ $t('resource.referenceImages') }} *</h4>
            <FileUploadHandler
              :max-images="4"
              category="reference-image"
              @update:urls="formData.referenceImages = $event"
            />
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
              <template #append>
                <v-btn
                  icon="mdi-robot"
                  variant="text"
                  :disabled="formData.referenceImages.length === 0 || aiLoading.styles"
                  @click="handleGenerateStyles"
                />
              </template>
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
              <template #append>
                <v-btn
                  icon="mdi-robot"
                  variant="text"
                  :disabled="formData.referenceImages.length === 0 || aiLoading.description"
                  @click="handleGenerateDescription"
                />
              </template>
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
import { ref, watch, reactive } from 'vue';
import { useResourceStore } from '@/stores/resourceStore';
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
const formRef = ref();
const saving = ref(false);
const error = ref('');

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

const rules = {
  required: (v: string) => !!v || 'This field is required',
  maxLength: (max: number) => (v: string) => !v || v.length <= max || `Max ${max} characters`,
};

// Initialize form when editing
watch(
  () => props.editScene,
  scene => {
    if (scene) {
      formData.name = scene.name;
      formData.styles = scene.styles || [];
      formData.description = scene.description || '';
      formData.referenceImages = scene.referenceImages.map((img: any) => img.fileUrl);
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

const resetForm = () => {
  formData.name = '';
  formData.styles = [];
  formData.description = '';
  formData.referenceImages = [];
  error.value = '';
};

const handleGenerateStyles = async () => {
  if (formData.referenceImages.length === 0) return;

  aiLoading.styles = true;
  error.value = '';

  try {
    const styles = await resourceStore.generateSceneStyles(formData.referenceImages);
    formData.styles = styles;
  } catch (err) {
    error.value = `Failed to generate styles: ${String(err)}`;
  } finally {
    aiLoading.styles = false;
  }
};

const handleGenerateDescription = async () => {
  if (formData.referenceImages.length === 0) return;

  aiLoading.description = true;
  error.value = '';

  try {
    const description = await resourceStore.generateSceneDescription(formData.referenceImages);
    formData.description = description;
  } catch (err) {
    error.value = `Failed to generate description: ${String(err)}`;
  } finally {
    aiLoading.description = false;
  }
};

const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  if (formData.referenceImages.length === 0) {
    error.value = 'Please upload at least one reference image';
    return;
  }

  saving.value = true;
  error.value = '';

  try {
    const payload = {
      name: formData.name,
      styles: formData.styles,
      description: formData.description || undefined,
      referenceImages: formData.referenceImages,
    };

    if (props.editScene?.id) {
      await resourceStore.updateScene(props.editScene.id, payload);
    } else {
      await resourceStore.createScene(props.libraryId, payload);
    }

    emit('save');
    handleClose();
  } catch (err) {
    error.value = `Failed to save scene: ${String(err)}`;
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
