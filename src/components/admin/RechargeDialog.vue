<template>
  <v-dialog v-model="isOpen" max-width="500px" persistent>
    <v-card>
      <v-card-title class="text-h5 px-6 pt-6"> 为工作空间充值 </v-card-title>

      <v-card-subtitle class="px-6 pb-4">
        为 {{ workspace?.name }} ({{ workspace?.workspaceId }}) 充值积分
      </v-card-subtitle>

      <v-card-text class="px-6">
        <v-form ref="form" v-model="formValid">
          <v-text-field
            v-model="amount"
            label="充值金额 (元)"
            type="number"
            min="1"
            step="1"
            placeholder="请输入充值金额（整数）"
            :disabled="loading"
            :rules="amountRules"
            required
            variant="outlined"
            density="comfortable"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-6">
        <v-spacer />
        <v-btn variant="text" @click="handleCancel" :disabled="loading" class="mr-2"> 取消 </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          @click="handleConfirm"
          :disabled="!isValid || loading"
          :loading="loading"
        >
          确认充值
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { WorkspaceListItem } from '@/api/adminApi';
import { computed, ref, watch } from 'vue';

interface Props {
  open: boolean;
  workspace: WorkspaceListItem | null;
  loading?: boolean;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'confirm', data: { amount: number; thirdPartyOrderNo?: string }): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();

const form = ref();
const formValid = ref(false);
const amount = ref<string>('');

// 金额验证规则
const amountRules = [
  (v: string) => !!v || '请输入充值金额',
  (v: string) => {
    const num = parseInt(v);
    return (
      (!isNaN(num) && num >= 1 && Number.isInteger(parseFloat(v))) ||
      '充值金额必须是大于等于1的整数'
    );
  },
];

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
});

const isValid = computed(() => {
  const amountNum = parseInt(amount.value);
  return (
    !isNaN(amountNum) &&
    amountNum >= 1 &&
    Number.isInteger(parseFloat(amount.value)) &&
    formValid.value
  );
});

const handleCancel = () => {
  emit('update:open', false);
};

const handleConfirm = () => {
  if (!isValid.value) return;

  const data = { amount: parseInt(amount.value) };

  emit('confirm', data);
};

// 重置表单
watch(
  () => props.open,
  newOpen => {
    if (newOpen) {
      amount.value = '';
      formValid.value = false;
      if (form.value) {
        form.value.resetValidation();
      }
    }
  }
);
</script>
