<template>
  <v-dialog
    :model-value="modelValue"
    max-width="520"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>生成邀请码</v-card-title>
      <v-card-text>
        <v-form ref="formRef" @submit.prevent="onSubmit">
          <v-text-field
            v-model="form.remark"
            label="备注"
            placeholder="如：小红书私信版 / B 站置顶版"
            hint="便于在邀请码列表区分多个码"
            persistent-hint
          />
          <v-text-field
            v-model="form.expiresAt"
            label="过期时间"
            type="datetime-local"
            hint="留空表示长期有效"
            persistent-hint
          />
          <v-switch v-model="form.enabled" label="启用" color="primary" inset />
        </v-form>
        <v-alert v-if="createdCode" type="success" variant="tonal" class="mt-4">
          <div class="font-bold">邀请码已生成：{{ createdCode }}</div>
          <div class="mt-2 text-sm">复制下方推广链接发给二方：</div>
          <div class="mt-1 font-mono text-xs">https://zerocut.cn/?ref={{ createdCode }}</div>
          <div class="font-mono text-xs">https://workspace.zerocut.cn/?ref={{ createdCode }}</div>
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">{{ createdCode ? '完成' : '取消' }}</v-btn>
        <v-btn v-if="!createdCode" color="primary" :loading="submitting" @click="onSubmit">
          生成
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';

import { type CreateInviteCodePayload, createInviteCode } from '@/api/referralApi';

const props = defineProps<{
  modelValue: boolean;
  channelId: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'created'): void;
}>();

const submitting = ref(false);
const createdCode = ref<string | null>(null);
const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);

const form = reactive<CreateInviteCodePayload & { expiresAt?: string }>({
  remark: '',
  expiresAt: '',
  enabled: true,
});

watch(
  () => props.modelValue,
  open => {
    if (open) {
      form.remark = '';
      form.expiresAt = '';
      form.enabled = true;
      createdCode.value = null;
    }
  }
);

function close() {
  emit('update:modelValue', false);
}

async function onSubmit() {
  const valid = await formRef.value?.validate();
  if (valid && !valid.valid) return;
  submitting.value = true;
  try {
    const payload: CreateInviteCodePayload = {
      remark: form.remark,
      enabled: form.enabled,
      ...(form.expiresAt ? { expiresAt: new Date(form.expiresAt).toISOString() } : {}),
    };
    const created = await createInviteCode(props.channelId, payload);
    createdCode.value = created.code;
    emit('created');
  } finally {
    submitting.value = false;
  }
}
</script>
