<script setup lang="ts">
import { ExpiredCreditItem, ExpiredCreditsResponse, getExpiredCredits } from '@/api/walletApi';
import { Pagination } from '@/types/api';
import { formatDate } from '@/utils/date';
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  // 与全局及 API 保持一致：workspaceId 为 string 类型
  workspaceId: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

// 加载与数据状态
const expiredLoading = ref(false);
const expiredData = ref<ExpiredCreditItem[]>([]);
const expiredSummary = ref<{
  totalExpiredCredits: number;
  byPaymentMethod: Record<string, number>;
}>({
  totalExpiredCredits: 0,
  byPaymentMethod: { wechat: 0, alipay: 0, manual: 0, give: 0, bot: 0 },
});
const expiredPagination = ref<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
const expiredFilter = ref<{ paymentMethod: string | null }>({ paymentMethod: null });

// 支付方式相关展示
const getPaymentMethodIcon = (paymentMethod: string) => {
  switch (paymentMethod) {
  case 'alipay':
    return 'mdi-alipay';
  case 'wechat':
    return 'mdi-wechat';
  case 'bank_card':
    return 'mdi-credit-card';
  case 'credit_card':
    return 'mdi-credit-card-outline';
  case 'manual':
    return 'mdi-account-cash';
  case 'bot':
    return 'mdi-robot';
  case 'give':
    return 'mdi-gift';
  default:
    return 'mdi-cash';
  }
};

const getPaymentMethodText = (paymentMethod: string) => {
  switch (paymentMethod) {
  case 'alipay':
    return '支付宝';
  case 'wechat':
    return '微信支付';
  case 'bank_card':
    return '银行卡';
  case 'credit_card':
    return '信用卡';
  case 'manual':
    return '手动充值';
  case 'bot':
    return '机器人充值';
  case 'give':
    return '积分赠送';
  default:
    return '其他';
  }
};

const getPaymentMethodColor = (paymentMethod: string) => {
  switch (paymentMethod) {
  case 'alipay':
    return 'blue';
  case 'wechat':
    return 'green';
  case 'bank_card':
    return 'purple';
  case 'credit_card':
    return 'orange';
  case 'manual':
    return 'grey';
  case 'bot':
    return 'primary';
  default:
    return 'grey';
  }
};

// 打开时加载数据
watch(
  () => props.modelValue,
  open => {
    if (open) fetchExpiredCredits();
  }
);

// 过滤变化时刷新
watch(
  () => expiredFilter.value.paymentMethod,
  () => {
    expiredPagination.value.page = 1;
    fetchExpiredCredits();
  }
);

const fetchExpiredCredits = async () => {
  try {
    expiredLoading.value = true;
    const res: ExpiredCreditsResponse = await getExpiredCredits({
      workspaceId: props.workspaceId,
      page: expiredPagination.value.page,
      limit: expiredPagination.value.limit,
      paymentMethod: expiredFilter.value.paymentMethod || undefined,
    });
    expiredData.value = res.list;
    expiredSummary.value = res.summary;
    expiredPagination.value = res.pagination;
  } catch (err) {
    console.error('获取过期积分失败:', err);
  } finally {
    expiredLoading.value = false;
  }
};

const handleExpiredPageChange = (page: number) => {
  expiredPagination.value.page = page;
  fetchExpiredCredits();
};

const handleExpiredItemsPerPageChange = (itemsPerPage: number) => {
  expiredPagination.value.limit = itemsPerPage;
  expiredPagination.value.page = 1;
  fetchExpiredCredits();
};

const close = () => emit('update:modelValue', false);
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    @update:modelValue="val => emit('update:modelValue', val)"
    max-width="900"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-alert</v-icon>
        已过期积分
      </v-card-title>
      <v-card-text>
        <v-row class="mb-4">
          <v-col cols="12" sm="6">
            <div class="d-flex align-center ga-2">
              <span class="text-medium-emphasis">总过期积分：</span>
              <span class="text-error font-weight-bold">{{
                expiredSummary.totalExpiredCredits
              }}</span>
            </div>
          </v-col>
          <v-col cols="12" sm="6" class="d-flex justify-end">
            <v-select
              label="充值类型过滤"
              :items="[
                { title: '全部', value: null },
                { title: '微信支付', value: 'wechat' },
                { title: '支付宝', value: 'alipay' },
                { title: '手动充值', value: 'manual' },
                { title: '积分赠送', value: 'give' },
                { title: '机器人充值', value: 'bot' },
              ]"
              v-model="expiredFilter.paymentMethod"
              density="compact"
              style="max-width: 260px"
            ></v-select>
          </v-col>
        </v-row>

        <div class="d-flex flex-wrap ga-2 mb-4">
          <v-chip color="green" variant="flat" size="small">
            微信：{{ expiredSummary.byPaymentMethod.wechat || 0 }}
          </v-chip>
          <v-chip color="blue" variant="flat" size="small">
            支付宝：{{ expiredSummary.byPaymentMethod.alipay || 0 }}
          </v-chip>
          <v-chip color="grey" variant="flat" size="small">
            手动：{{ expiredSummary.byPaymentMethod.manual || 0 }}
          </v-chip>
          <v-chip color="orange" variant="flat" size="small">
            赠送：{{ expiredSummary.byPaymentMethod.give || 0 }}
          </v-chip>
        </div>

        <v-data-table-server
          :headers="[
            { title: '过期时间', key: 'expiredAt', sortable: true },
            { title: '过期积分', key: 'expiredCredits', sortable: true },
            { title: '支付方式', key: 'paymentMethod', sortable: false },
            { title: '订单号', key: 'orderNo', sortable: false },
          ]"
          :items="expiredData"
          item-value="id"
          class="elevation-0"
          :loading="expiredLoading"
          :items-per-page="expiredPagination.limit"
          :items-length="expiredPagination.total"
          :page="expiredPagination.page"
          @update:items-per-page="handleExpiredItemsPerPageChange"
          @update:page="handleExpiredPageChange"
        >
          <template #item.expiredAt="{ item }">
            {{ formatDate(item.expiredAt) }}
          </template>

          <template #item.expiredCredits="{ item }">
            <span v-if="(item.expiredCredits || 0) > 0" class="font-weight-medium text-error">
              {{ (item.expiredCredits || 0).toLocaleString() }}
            </span>
            <span v-else class="text-medium-emphasis">-</span>
          </template>

          <template #item.paymentMethod="{ item }">
            <div class="d-flex align-center">
              <v-icon
                :icon="getPaymentMethodIcon(item.recharge.paymentMethod)"
                :color="getPaymentMethodColor(item.recharge.paymentMethod)"
                size="20"
                class="mr-2"
              ></v-icon>
              {{ getPaymentMethodText(item.recharge.paymentMethod) }}
            </div>
          </template>

          <template #item.orderNo="{ item }">
            <code class="text-caption">{{ item.recharge.orderNo }}</code>
          </template>
        </v-data-table-server>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text="关闭" @click="close" variant="tonal"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* 保留轻微动效以一致于项目其他弹窗 */
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
}

code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
}
</style>
