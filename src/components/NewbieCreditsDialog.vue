<template>
  <v-dialog v-model="dialog" max-width="500" persistent transition="dialog-bottom-transition">
    <v-card class="text-center pa-6">
      <!-- 庆祝图标 -->
      <div class="mb-4">
        <v-icon color="success" size="80" class="celebration-icon"> mdi-gift </v-icon>
      </div>

      <!-- 标题 -->
      <v-card-title class="text-h4 font-weight-bold text-center mb-2">
        {{ t('zerocut.newbieCredits.title') }}
      </v-card-title>

      <!-- 内容 -->
      <v-card-text class="text-h6 mb-4">
        <div class="mb-3">{{ t('zerocut.newbieCredits.congratulations') }}</div>
        <div class="credits-amount">
          <v-chip color="primary" size="large" variant="elevated" class="text-h5 pa-4">
            <v-icon start>mdi-star</v-icon>
            {{ creditsAmount }} {{ t('zerocut.newbieCredits.creditsUnit') }}
          </v-chip>
        </div>
        <div class="mt-3 text-body-1 text-medium-emphasis">
          {{ t('zerocut.newbieCredits.validityNotice') }}
        </div>
      </v-card-text>

      <!-- 操作按钮 -->
      <v-card-actions class="justify-center pt-4">
        <v-btn color="primary" variant="elevated" size="large" @click="handleClose" class="px-8">
          {{ t('zerocut.newbieCredits.startButton') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { RechargeRecord } from '@/types/api';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
  modelValue: boolean;
  rechargeRecord?: RechargeRecord | null;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const dialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const creditsAmount = computed(() => {
  return props.rechargeRecord?.creditsAmount || 200;
});

const handleClose = () => {
  emit('close');
  dialog.value = false;
};
</script>

<style scoped>
.celebration-icon {
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.credits-amount {
  margin: 16px 0;
}
</style>
