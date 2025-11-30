<script setup lang="ts">
import type { CreatePersonaParams, PersonaItem, UpdatePersonaParams } from '@/api/adminApi';
import { computed, ref, watch } from 'vue';

interface Props {
  modelValue: boolean;
  persona?: PersonaItem | null;
}

const props = withDefaults(defineProps<Props>(), { persona: null });

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', data: CreatePersonaParams | UpdatePersonaParams): void;
}

const emit = defineEmits<Emits>();

const form = ref<any>(null);
const loading = ref(false);
const formData = ref({ name: '', trigger: '', prompt: '' });

const isEdit = computed(() => !!props.persona);
const dialogTitle = computed(() => (isEdit.value ? '编辑 Persona' : '新建 Persona'));

const rules = {
  name: [
    (v: string) => !!v || '名称不能为空',
    (v: string) => v.length <= 128 || '长度不能超过128字符',
  ],
  trigger: [(v: string) => !!v || '触发词不能为空'],
  prompt: [(v: string) => !!v || '提示词不能为空'],
};

watch(
  () => props.modelValue,
  val => {
    if (val) {
      resetForm();
      if (props.persona) {
        formData.value = {
          name: props.persona.name,
          trigger: props.persona.trigger,
          prompt: props.persona.prompt,
        };
      }
    }
  }
);

const resetForm = () => {
  formData.value = { name: '', trigger: '', prompt: '' };
  form.value?.resetValidation();
};

const closeDialog = () => {
  emit('update:modelValue', false);
};

const save = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;
  loading.value = true;
  try {
    if (isEdit.value) {
      const payload: UpdatePersonaParams = {
        name: formData.value.name,
        trigger: formData.value.trigger,
        prompt: formData.value.prompt,
      };
      emit('save', payload);
    } else {
      const payload: CreatePersonaParams = {
        name: formData.value.name,
        trigger: formData.value.trigger,
        prompt: formData.value.prompt,
      };
      emit('save', payload);
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    max-width="640"
    persistent
  >
    <v-card>
      <v-card-title class="text-h6 d-flex align-center">
        <v-icon class="mr-2">{{ isEdit ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
        {{ dialogTitle }}
      </v-card-title>
      <v-card-text>
        <v-form ref="form" @submit.prevent="save">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="formData.name"
                label="名称"
                variant="outlined"
                density="comfortable"
                :rules="rules.name"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="formData.trigger"
                label="触发词"
                variant="outlined"
                density="comfortable"
                :rules="rules.trigger"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="formData.prompt"
                label="提示词"
                variant="outlined"
                density="comfortable"
                rows="8"
                auto-grow
                :rules="rules.prompt"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="closeDialog">取消</v-btn>
        <v-btn color="primary" :loading="loading" @click="save">保存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
