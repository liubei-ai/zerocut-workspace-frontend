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

          <!-- File Upload -->
          <div class="mb-4">
            <h4 class="mb-2">{{ $t('resource.referenceImages') }} *</h4>
            <FileUploadHandler
              :max-images="4"
              category="reference-image"
              @update:urls="formData.referenceImages = $event"
            />
            <v-alert
              v-if="formData.referenceImages.length === 0 && showImageWarning"
              type="warning"
              density="compact"
              class="mt-2"
            >
              {{ $t('resource.referenceImagesRequired') }}
            </v-alert>
          </div>

          <!-- Voice Field with AI Generation -->
          <div class="mb-4">
            <v-text-field
              v-model="formData.voice"
              :label="$t('resource.voice')"
              variant="outlined"
              :loading="aiLoading.voice"
            >
              <template #append>
                <v-btn
                  icon="mdi-robot"
                  variant="text"
                  :disabled="formData.referenceImages.length === 0 || aiLoading.voice"
                  @click="handleGenerateVoice"
                />
              </template>
            </v-text-field>
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
import { useResourceStore } from '@/stores/resourceStore';
import { reactive, ref, watch } from 'vue';
import FileUploadHandler from './FileUploadHandler.vue';

interface Subject {
  id?: string;
  name: string;
  voice?: string;
  styles: string[];
  description?: string;
  referenceImages: any[];
}

const props = defineProps<{
  modelValue: boolean;
  editSubject?: Subject | null;
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
const showImageWarning = ref(false);

const formData = reactive({
  name: '',
  voice: '',
  styles: [] as string[],
  description: '',
  referenceImages: [] as string[],
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
  formData.referenceImages = [];
  error.value = '';
};

// Initialize form when editing
watch(
  () => props.editSubject,
  subject => {
    if (subject) {
      formData.name = subject.name;
      formData.voice = subject.voice || '';
      formData.styles = subject.styles || [];
      formData.description = subject.description || '';
      formData.referenceImages = subject.referenceImages.map((img: any) => img.fileUrl);
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

const handleGenerateVoice = async () => {
  if (formData.referenceImages.length === 0) return;

  aiLoading.voice = true;
  error.value = '';

  try {
    const voice = await resourceStore.generateSubjectVoice(formData.referenceImages);
    formData.voice = voice;
  } catch (err) {
    error.value = `Failed to generate voice: ${String(err)}`;
  } finally {
    aiLoading.voice = false;
  }
};

const handleGenerateStyles = async () => {
  if (formData.referenceImages.length === 0) return;

  aiLoading.styles = true;
  error.value = '';

  try {
    const styles = await resourceStore.generateSubjectStyles(formData.referenceImages);
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
    const description = await resourceStore.generateSubjectDescription(formData.referenceImages);
    formData.description = description;
  } catch (err) {
    error.value = `Failed to generate description: ${String(err)}`;
  } finally {
    aiLoading.description = false;
  }
};

const handleSubmit = async () => {
  console.log('=== handleSubmit called ===');
  console.log('formData.name:', formData.name);
  console.log('formData.referenceImages.length:', formData.referenceImages.length);
  console.log('formData.referenceImages:', formData.referenceImages);

  console.log('Checking reference images...');
  if (formData.referenceImages.length === 0) {
    console.log('No reference images, blocking save');
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
      referenceImages: formData.referenceImages,
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
