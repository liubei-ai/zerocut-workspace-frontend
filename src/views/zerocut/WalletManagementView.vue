<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// 对话框状态
const rechargeDialog = ref(false);
const withdrawDialog = ref(false);

// 充值表单
const rechargeForm = ref({
  amount: null as number | null,
  paymentMethod: 'alipay',
});

// 提现表单
const withdrawForm = ref({
  amount: null as number | null,
  bankAccount: '',
});

// 支付方式选项
const paymentMethods = [
  { value: 'alipay', title: '支付宝', icon: 'mdi-wallet' },
  { value: 'wechat', title: '微信支付', icon: 'mdi-wechat' },
  { value: 'bank', title: '银行卡', icon: 'mdi-credit-card' },
  { value: 'paypal', title: 'PayPal', icon: 'mdi-paypal' },
];

// 钱包信息
const walletInfo = ref({
  balance: 1250.75,
  frozenAmount: 50.0,
  totalRecharge: 2000.0,
  totalConsumption: 749.25,
  currency: 'USD',
});

// 交易记录
const transactions = ref([
  {
    id: 1,
    type: 'recharge',
    amount: 500.0,
    description: '账户充值',
    timestamp: '2024-01-20 15:30:25',
    status: 'completed',
    paymentMethod: 'alipay',
    orderId: 'RC202401200001',
  },
  {
    id: 2,
    type: 'consumption',
    amount: -12.5,
    description: '视频生成服务',
    timestamp: '2024-01-20 14:30:25',
    status: 'completed',
    paymentMethod: null,
    orderId: 'CS202401200001',
  },
  {
    id: 3,
    type: 'consumption',
    amount: -8.0,
    description: '图片生成服务',
    timestamp: '2024-01-20 14:25:10',
    status: 'completed',
    paymentMethod: null,
    orderId: 'CS202401200002',
  },
  {
    id: 4,
    type: 'recharge',
    amount: 1000.0,
    description: '账户充值',
    timestamp: '2024-01-15 10:20:15',
    status: 'completed',
    paymentMethod: 'wechat',
    orderId: 'RC202401150001',
  },
  {
    id: 5,
    type: 'refund',
    amount: 25.0,
    description: '服务退款',
    timestamp: '2024-01-14 16:45:30',
    status: 'completed',
    paymentMethod: null,
    orderId: 'RF202401140001',
  },
  {
    id: 6,
    type: 'withdraw',
    amount: -200.0,
    description: '提现到银行卡',
    timestamp: '2024-01-10 09:15:20',
    status: 'processing',
    paymentMethod: 'bank',
    orderId: 'WD202401100001',
  },
]);

// 筛选选项
const filters = ref({
  type: 'all',
  status: 'all',
  dateRange: ['2024-01-01', '2024-01-31'],
});

// 交易类型选项
const transactionTypes = [
  { value: 'all', title: '全部类型' },
  { value: 'recharge', title: '充值' },
  { value: 'consumption', title: '消费' },
  { value: 'refund', title: '退款' },
  { value: 'withdraw', title: '提现' },
];

// 状态选项
const statusOptions = [
  { value: 'all', title: '全部状态' },
  { value: 'completed', title: '已完成' },
  { value: 'processing', title: '处理中' },
  { value: 'failed', title: '失败' },
  { value: 'cancelled', title: '已取消' },
];

// 筛选后的交易记录
const filteredTransactions = computed(() => {
  return transactions.value.filter(transaction => {
    // 类型筛选
    if (filters.value.type !== 'all' && transaction.type !== filters.value.type) {
      return false;
    }

    // 状态筛选
    if (filters.value.status !== 'all' && transaction.status !== filters.value.status) {
      return false;
    }

    return true;
  });
});

// 统计数据
const stats = computed(() => {
  const filtered = filteredTransactions.value;
  return {
    totalTransactions: filtered.length,
    totalRecharge: filtered
      .filter(t => t.type === 'recharge')
      .reduce((sum, t) => sum + t.amount, 0),
    totalConsumption: Math.abs(
      filtered.filter(t => t.type === 'consumption').reduce((sum, t) => sum + t.amount, 0)
    ),
    pendingTransactions: filtered.filter(t => t.status === 'processing').length,
  };
});

// 获取交易类型图标
const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'recharge':
      return 'mdi-plus-circle';
    case 'consumption':
      return 'mdi-minus-circle';
    case 'refund':
      return 'mdi-undo';
    case 'withdraw':
      return 'mdi-bank-transfer-out';
    default:
      return 'mdi-swap-horizontal';
  }
};

// 获取交易类型颜色
const getTransactionColor = (type: string) => {
  switch (type) {
    case 'recharge':
    case 'refund':
      return 'success';
    case 'consumption':
    case 'withdraw':
      return 'error';
    default:
      return 'info';
  }
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'processing':
      return 'warning';
    case 'failed':
      return 'error';
    case 'cancelled':
      return 'grey';
    default:
      return 'info';
  }
};

// 获取状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return '已完成';
    case 'processing':
      return '处理中';
    case 'failed':
      return '失败';
    case 'cancelled':
      return '已取消';
    default:
      return '未知';
  }
};

// 获取交易类型文本
const getTransactionTypeText = (type: string) => {
  switch (type) {
    case 'recharge':
      return '充值';
    case 'consumption':
      return '消费';
    case 'refund':
      return '退款';
    case 'withdraw':
      return '提现';
    default:
      return '其他';
  }
};

// 充值
const recharge = () => {
  if (rechargeForm.value.amount && rechargeForm.value.amount > 0) {
    // 模拟充值
    const newTransaction = {
      id: Date.now(),
      type: 'recharge',
      amount: rechargeForm.value.amount,
      description: '账户充值',
      timestamp: new Date().toLocaleString('zh-CN'),
      status: 'processing',
      paymentMethod: rechargeForm.value.paymentMethod,
      orderId: `RC${Date.now()}`,
    };

    transactions.value.unshift(newTransaction);
    rechargeDialog.value = false;
    resetRechargeForm();
  }
};

// 提现
const withdraw = () => {
  if (withdrawForm.value.amount && withdrawForm.value.amount > 0) {
    // 模拟提现
    const newTransaction = {
      id: Date.now(),
      type: 'withdraw',
      amount: -withdrawForm.value.amount,
      description: '提现到银行卡',
      timestamp: new Date().toLocaleString('zh-CN'),
      status: 'processing',
      paymentMethod: 'bank',
      orderId: `WD${Date.now()}`,
    };

    transactions.value.unshift(newTransaction);
    withdrawDialog.value = false;
    resetWithdrawForm();
  }
};

// 重置充值表单
const resetRechargeForm = () => {
  rechargeForm.value = {
    amount: null,
    paymentMethod: 'alipay',
  };
};

// 重置提现表单
const resetWithdrawForm = () => {
  withdrawForm.value = {
    amount: null,
    bankAccount: '',
  };
};

// 导出账单
const exportBill = () => {
  console.log('导出账单');
};

onMounted(() => {
  console.log('WalletManagement mounted');
});
</script>

<template>
  <div class="pa-6">
    <!-- 页面标题 -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">钱包管理</h1>
        <p class="text-subtitle-1 text-medium-emphasis">管理您的账户余额、充值记录和消费明细</p>
      </div>
      <div class="d-flex ga-2">
        <v-btn color="success" prepend-icon="mdi-plus" @click="rechargeDialog = true"> 充值 </v-btn>
        <v-btn color="primary" prepend-icon="mdi-bank-transfer-out" @click="withdrawDialog = true">
          提现
        </v-btn>
      </div>
    </div>

    <!-- 钱包概览 -->
    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <v-card class="pa-6" elevation="2">
          <div class="d-flex align-center mb-4">
            <v-icon size="48" color="primary" class="mr-4"> mdi-wallet </v-icon>
            <div>
              <div class="text-h4 font-weight-bold">${{ walletInfo.balance.toFixed(2) }}</div>
              <div class="text-subtitle-1 text-medium-emphasis">可用余额</div>
            </div>
          </div>

          <v-divider class="mb-4"></v-divider>

          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2">冻结金额:</span>
            <span class="text-body-2 font-weight-medium">
              ${{ walletInfo.frozenAmount.toFixed(2) }}
            </span>
          </div>

          <div class="d-flex justify-space-between">
            <span class="text-body-2">总余额:</span>
            <span class="text-body-2 font-weight-medium">
              ${{ (walletInfo.balance + walletInfo.frozenAmount).toFixed(2) }}
            </span>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-row>
          <v-col cols="6">
            <v-card class="pa-4 text-center" elevation="2">
              <v-icon size="32" color="success" class="mb-2"> mdi-trending-up </v-icon>
              <div class="text-h6 font-weight-bold mb-1">
                ${{ walletInfo.totalRecharge.toFixed(2) }}
              </div>
              <div class="text-caption text-medium-emphasis">累计充值</div>
            </v-card>
          </v-col>

          <v-col cols="6">
            <v-card class="pa-4 text-center" elevation="2">
              <v-icon size="32" color="error" class="mb-2"> mdi-trending-down </v-icon>
              <div class="text-h6 font-weight-bold mb-1">
                ${{ walletInfo.totalConsumption.toFixed(2) }}
              </div>
              <div class="text-caption text-medium-emphasis">累计消费</div>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- 筛选器 -->
    <v-card class="mb-6" elevation="2">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-filter</v-icon>
          筛选条件
        </div>
        <v-btn variant="text" prepend-icon="mdi-download" @click="exportBill"> 导出账单 </v-btn>
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-select
              v-model="filters.type"
              :items="transactionTypes"
              item-title="title"
              item-value="value"
              label="交易类型"
              prepend-inner-icon="mdi-swap-horizontal"
            ></v-select>
          </v-col>

          <v-col cols="12" md="4">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              item-title="title"
              item-value="value"
              label="状态"
              prepend-inner-icon="mdi-check-circle"
            ></v-select>
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              label="日期范围"
              prepend-inner-icon="mdi-calendar"
              readonly
              value="2024-01-01 至 2024-01-31"
              hint="点击选择日期范围"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 统计卡片 -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="32" color="primary" class="mb-2"> mdi-format-list-numbered </v-icon>
          <div class="text-h6 font-weight-bold mb-1">
            {{ stats.totalTransactions }}
          </div>
          <div class="text-caption text-medium-emphasis">总交易数</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="32" color="success" class="mb-2"> mdi-plus-circle </v-icon>
          <div class="text-h6 font-weight-bold mb-1">${{ stats.totalRecharge.toFixed(2) }}</div>
          <div class="text-caption text-medium-emphasis">充值金额</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="32" color="error" class="mb-2"> mdi-minus-circle </v-icon>
          <div class="text-h6 font-weight-bold mb-1">${{ stats.totalConsumption.toFixed(2) }}</div>
          <div class="text-caption text-medium-emphasis">消费金额</div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="32" color="warning" class="mb-2"> mdi-clock </v-icon>
          <div class="text-h6 font-weight-bold mb-1">
            {{ stats.pendingTransactions }}
          </div>
          <div class="text-caption text-medium-emphasis">处理中</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 交易记录表格 -->
    <v-card elevation="2">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
        交易记录
      </v-card-title>

      <v-data-table
        :headers="[
          { title: '时间', key: 'timestamp', sortable: true },
          { title: '类型', key: 'type', sortable: true },
          { title: '描述', key: 'description', sortable: false },
          { title: '金额', key: 'amount', sortable: true },
          { title: '状态', key: 'status', sortable: true },
          { title: '支付方式', key: 'paymentMethod', sortable: false },
          { title: '订单号', key: 'orderId', sortable: false },
        ]"
        :items="filteredTransactions"
        item-value="id"
        class="elevation-0"
        :items-per-page="10"
      >
        <template #item.type="{ item }">
          <div class="d-flex align-center">
            <v-icon
              :icon="getTransactionIcon(item.type)"
              :color="getTransactionColor(item.type)"
              size="20"
              class="mr-2"
            ></v-icon>
            {{ getTransactionTypeText(item.type) }}
          </div>
        </template>

        <template #item.amount="{ item }">
          <span
            :class="{
              'text-success': item.amount > 0,
              'text-error': item.amount < 0,
            }"
            class="font-weight-medium"
          >
            {{ item.amount > 0 ? '+' : '' }}${{ Math.abs(item.amount).toFixed(2) }}
          </span>
        </template>

        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>

        <template #item.paymentMethod="{ item }">
          <div v-if="item.paymentMethod" class="d-flex align-center">
            <v-icon
              :icon="
                paymentMethods.find(p => p.value === item.paymentMethod)?.icon || 'mdi-credit-card'
              "
              size="16"
              class="mr-1"
            ></v-icon>
            {{
              paymentMethods.find(p => p.value === item.paymentMethod)?.title || item.paymentMethod
            }}
          </div>
          <span v-else class="text-medium-emphasis">-</span>
        </template>

        <template #item.orderId="{ item }">
          <code class="text-caption">{{ item.orderId }}</code>
        </template>
      </v-data-table>
    </v-card>

    <!-- 充值对话框 -->
    <v-dialog v-model="rechargeDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="success">mdi-plus</v-icon>
          账户充值
        </v-card-title>

        <v-card-text>
          <v-form>
            <v-text-field
              v-model.number="rechargeForm.amount"
              label="充值金额"
              type="number"
              prefix="$"
              min="1"
              step="0.01"
              required
              class="mb-4"
            ></v-text-field>

            <v-select
              v-model="rechargeForm.paymentMethod"
              :items="paymentMethods"
              item-title="title"
              item-value="value"
              label="支付方式"
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #prepend>
                    <v-icon :icon="item.raw.icon"></v-icon>
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="
              rechargeDialog = false;
              resetRechargeForm();
            "
          >
            取消
          </v-btn>
          <v-btn
            color="success"
            variant="flat"
            @click="recharge"
            :disabled="!rechargeForm.amount || rechargeForm.amount <= 0"
          >
            确认充值
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 提现对话框 -->
    <v-dialog v-model="withdrawDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="primary">mdi-bank-transfer-out</v-icon>
          账户提现
        </v-card-title>

        <v-card-text>
          <v-form>
            <v-text-field
              v-model.number="withdrawForm.amount"
              label="提现金额"
              type="number"
              prefix="$"
              min="1"
              :max="walletInfo.balance"
              step="0.01"
              required
              :hint="`可提现余额: $${walletInfo.balance.toFixed(2)}`"
              persistent-hint
              class="mb-4"
            ></v-text-field>

            <v-text-field
              v-model="withdrawForm.bankAccount"
              label="银行账户"
              placeholder="请输入银行账户信息"
              required
            ></v-text-field>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="
              withdrawDialog = false;
              resetWithdrawForm();
            "
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="withdraw"
            :disabled="
              !withdrawForm.amount ||
              withdrawForm.amount <= 0 ||
              withdrawForm.amount > walletInfo.balance ||
              !withdrawForm.bankAccount
            "
          >
            确认提现
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
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
