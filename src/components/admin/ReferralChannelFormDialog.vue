<template>
  <v-dialog
    :model-value="modelValue"
    max-width="540"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>
        <v-form ref="formRef" @submit.prevent="onSubmit">
          <v-text-field
            v-model="form.name"
            label="渠道名 *"
            placeholder="如：B 站 @科技小明"
            :rules="[v => !!v || '请填写渠道名']"
            required
          />
          <v-select
            v-model="form.platform"
            label="平台 *"
            :items="platformOptions"
            item-title="label"
            item-value="value"
            :rules="[v => !!v || '请选择平台']"
            required
          />
          <v-text-field v-model="form.contact" label="联系人" placeholder="（选填）" />
          <v-textarea v-model="form.note" label="备注" rows="2" placeholder="（选填）" />
          <v-text-field
            v-model.number="form.attributionWindowDays"
            label="归因窗口期（天） *"
            type="number"
            min="1"
            max="365"
            hint="用户点击邀请链接后多少天内注册仍算本渠道带来；不同 KOL 可单独设置"
            persistent-hint
            :rules="[
              v => (v !== null && v !== undefined && v !== '') || '请填写窗口期',
              v => (v >= 1 && v <= 365) || '范围 1-365 天',
            ]"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">取消</v-btn>
        <v-btn color="primary" :loading="submitting" @click="onSubmit">确定</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';

import { type CreateChannelPayload, type ReferralChannelPlatform } from '@/api/referralApi';

const props = defineProps<{
  modelValue: boolean;
  title?: string;
  initial?: Partial<CreateChannelPayload>;
  submitHandler: (payload: CreateChannelPayload) => Promise<void>;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'submitted'): void;
}>();

const submitting = ref(false);
const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);

const platformOptions: Array<{ label: string; value: ReferralChannelPlatform }> = [
  { label: '微信公众号', value: 'wechat' },
  { label: '小红书', value: 'xhs' },
  { label: 'B 站', value: 'bilibili' },
  { label: '抖音', value: 'douyin' },
  { label: '其他', value: 'other' },
];

const form = reactive<CreateChannelPayload>({
  name: '',
  platform: 'other',
  contact: '',
  note: '',
  attributionWindowDays: 30,
});

watch(
  () => props.modelValue,
  open => {
    if (open) {
      form.name = props.initial?.name ?? '';
      form.platform = props.initial?.platform ?? 'other';
      form.contact = props.initial?.contact ?? '';
      form.note = props.initial?.note ?? '';
      form.attributionWindowDays = props.initial?.attributionWindowDays ?? 30;
    }
  }
);

function close() {
  emit('update:modelValue', false);
}

async function onSubmit() {
  const valid = await formRef.value?.validate();
  if (!valid || !valid.valid) return;
  submitting.value = true;
  try {
    await props.submitHandler({ ...form });
    emit('submitted');
    close();
  } finally {
    submitting.value = false;
  }
}
</script>
