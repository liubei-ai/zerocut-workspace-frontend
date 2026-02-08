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
            <FileUploadHandler
              :max-images="1"
              :category="formData.type"
              @update:urls="formData.fileUrl = $event[0] || ''"
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
        <v-btn color="primary" :loading="saving" @click="handleSubmit">
          {{ editMaterial ? $t('common.update') : $t('common.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useResourceStore } from '@/stores/resourceStore';
import type { OtherMaterial } from '@/types/resource';
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import FileUploadHandler from '../FileUploadHandler.vue';

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

const formData = reactive({
  name: '',
  type: 'image' as 'audio' | 'video' | 'image',
  fileUrl: '',
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

const rules = {
  required: (v: string) => !!v || 'This field is required',
  maxLength: (max: number) => (v: string) => !v || v.length <= max || `Max ${max} characters`,
};

const handleTypeChange = () => {
  // Reset file URL when type changes
  formData.fileUrl = '';
};

const resetForm = () => {
  formData.name = '';
  formData.type = 'image';
  formData.fileUrl = '';
  formData.description = '';
  error.value = '';
};

// Pre-fill form when editing
watch(
  () => props.modelValue,
  newOpen => {
    if (newOpen && props.editMaterial) {
      formData.name = props.editMaterial.name;
      formData.type = props.editMaterial.type;
      formData.fileUrl = props.editMaterial.fileUrl;
      formData.description = props.editMaterial.description || '';
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

  if (!formData.fileUrl) {
    error.value = 'Please upload a file';
    return;
  }

  saving.value = true;
  error.value = '';

  try {
    const payload = {
      name: formData.name,
      type: formData.type,
      fileUrl: formData.fileUrl,
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
