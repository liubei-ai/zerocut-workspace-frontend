<template>
  <v-dialog v-model="isOpen" max-width="500px" persistent>
    <v-card>
      <v-card-title>{{ $t('resource.editLibrary') }}</v-card-title>

      <v-card-text>
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="form.name"
            :label="$t('resource.libraryName')"
            :rules="[rules.required, rules.nameLength]"
            outlined
            class="mb-4"
            counter="255"
            maxlength="255"
            @input="form.name = form.name"
          />

          <v-textarea
            v-model="form.description"
            :label="$t('resource.libraryDescription')"
            :rules="[rules.descriptionLength]"
            outlined
            rows="3"
            class="mb-4"
            counter="1000"
            maxlength="1000"
            @input="form.description = form.description"
          />

          <div v-if="error" class="error-message mb-4">
            <v-icon icon="mdi-alert-circle" size="small" />
            {{ error }}
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="handleClose" variant="text">
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn
          @click="handleSubmit"
          color="primary"
          variant="elevated"
          :loading="isLoading"
          :disabled="!formRef?.isValid"
        >
          {{ $t('common.update') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useResourceStore, type ResourceLibrary } from '@/stores/resourceStore';
import type { UpdateLibraryDto } from '@/api/resourceApi';

const props = defineProps<{
  open: boolean;
  library: ResourceLibrary | null;
}>();

const emit = defineEmits<{
  'update:open': [boolean];
  'library-updated': [];
}>();

const resourceStore = useResourceStore();

const formRef = ref();
const isLoading = ref(false);
const error = ref('');

const form = ref<UpdateLibraryDto>({
  name: '',
  description: '',
});

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const rules = {
  required: (v: string) => !!v?.trim() || 'This field is required',
  nameLength: (v: string) => !v || v.length <= 255 || 'Name must not exceed 255 characters',
  descriptionLength: (v: string) =>
    !v || v.length <= 1000 || 'Description must not exceed 1000 characters',
};

// Pre-fill form when dialog opens
watch(
  () => props.open,
  newOpen => {
    if (newOpen && props.library) {
      form.value = {
        name: props.library.name,
        description: props.library.description || '',
      };
      error.value = '';
      // Reset validation state when opening
      formRef.value?.resetValidation();
    }
  }
);

const handleSubmit = async () => {
  if (!formRef.value?.validate() || !props.library) {
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    await resourceStore.updateLibrary(props.library.id, {
      name: form.value.name?.trim(),
      description: form.value.description?.trim(),
    });

    handleClose();
    emit('library-updated');
  } catch (err: any) {
    error.value = err.message || 'Failed to update library';
  } finally {
    isLoading.value = false;
  }
};

const handleClose = () => {
  form.value = { name: '', description: '' };
  error.value = '';
  formRef.value?.resetValidation();
  isOpen.value = false;
};
</script>

<style scoped lang="scss">
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background-color: rgba(var(--v-theme-error), 0.1);
  color: rgba(var(--v-theme-error));
  border-radius: 4px;
  font-size: 14px;
}
</style>
