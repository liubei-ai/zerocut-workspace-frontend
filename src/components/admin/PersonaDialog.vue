<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type {
  CreatePersonaParams,
  PersonaItem,
  PersonaReference,
  UpdatePersonaParams,
} from '@/api/adminApi';

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
const formData = ref<{
  name: string;
  trigger: string;
  prompt: string;
  references: PersonaReference[];
}>({ name: '', trigger: '', prompt: '', references: [] });

const isEdit = computed(() => !!props.persona);
const dialogTitle = computed(() => (isEdit.value ? '编辑技能' : '新建技能'));

const rules = {
  name: [
    (v: string) => !!v || '名称不能为空',
    (v: string) => v.length <= 128 || '长度不能超过128字符',
  ],
  trigger: [(v: string) => !!v || '触发词不能为空'],
  prompt: [(v: string) => !!v || '提示词不能为空'],
  refName: [
    (v: string) => !!v || 'Reference 名称不能为空',
    (v: string) => v.length <= 128 || '长度不能超过128字符',
  ],
  refPrompt: [(v: string) => !!v || 'Reference 提示词不能为空'],
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
          references: JSON.parse(JSON.stringify(props.persona.references ?? [])),
        };
      }
    }
  }
);

const resetForm = () => {
  formData.value = { name: '', trigger: '', prompt: '', references: [] };
  form.value?.resetValidation();
};

const addReference = () => {
  formData.value.references.push({ name: '', prompt: '' });
};

const removeReference = (index: number) => {
  formData.value.references.splice(index, 1);
};

const closeDialog = () => {
  emit('update:modelValue', false);
};

const save = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;
  loading.value = true;
  try {
    const payload: CreatePersonaParams | UpdatePersonaParams = {
      name: formData.value.name,
      trigger: formData.value.trigger,
      prompt: formData.value.prompt,
      references: formData.value.references.map(r => ({ name: r.name, prompt: r.prompt })),
    };
    emit('save', payload);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    max-width="820"
    persistent
    scrollable
  >
    <v-card>
      <v-card-title class="text-h6 d-flex align-center">
        <v-icon class="mr-2">{{ isEdit ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
        {{ dialogTitle }}
      </v-card-title>
      <v-card-text style="max-height: 72vh">
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
              <v-textarea
                v-model="formData.trigger"
                label="触发词"
                variant="outlined"
                density="comfortable"
                auto-grow
                rows="4"
                max-rows="6"
                :rules="rules.trigger"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="formData.prompt"
                label="提示词"
                variant="outlined"
                density="comfortable"
                auto-grow
                rows="8"
                max-rows="12"
                :rules="rules.prompt"
              />
            </v-col>
            <v-col cols="12">
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="d-flex align-center">
                  <v-icon class="mr-2">mdi-book-multiple</v-icon>
                  <span class="text-subtitle-1">References</span>
                  <span class="text-caption text-medium-emphasis ml-2"
                    >共 {{ formData.references.length }} 项</span
                  >
                </div>
                <v-btn
                  size="small"
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-plus"
                  @click="addReference"
                  >添加 Reference</v-btn
                >
              </div>

              <div
                v-if="formData.references.length === 0"
                class="text-caption text-medium-emphasis pa-4 text-center"
                style="border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity))"
              >
                暂无 References，点击上方「添加 Reference」新增。
              </div>

              <v-card
                v-for="(ref, index) in formData.references"
                :key="index"
                variant="outlined"
                class="mb-3"
              >
                <v-card-text class="pa-3">
                  <div class="d-flex align-start">
                    <div class="flex-grow-1">
                      <v-text-field
                        v-model="ref.name"
                        label="名称"
                        variant="outlined"
                        density="comfortable"
                        :rules="rules.refName"
                        class="mb-2"
                      />
                      <v-textarea
                        v-model="ref.prompt"
                        label="提示词"
                        variant="outlined"
                        density="comfortable"
                        auto-grow
                        rows="4"
                        max-rows="10"
                        :rules="rules.refPrompt"
                        hide-details="auto"
                      />
                    </div>
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      color="error"
                      size="small"
                      class="ml-2"
                      @click="removeReference(index)"
                    />
                  </div>
                </v-card-text>
              </v-card>
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
