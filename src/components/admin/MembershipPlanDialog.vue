<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type {
  CreateMembershipPlanParams,
  IMembershipPlanFeature,
  MembershipPlanItem,
  MembershipTier,
  PurchaseMode,
  UpdateMembershipPlanParams,
} from '@/api/adminApi';

import MembershipPlanFeaturesEditor from '@/components/admin/MembershipPlanFeaturesEditor.vue';

interface Props {
  modelValue: boolean;
  plan?: MembershipPlanItem | null;
}

const props = withDefaults(defineProps<Props>(), { plan: null });

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', data: CreateMembershipPlanParams | UpdateMembershipPlanParams): void;
}

const emit = defineEmits<Emits>();

const form = ref<any>(null);
const loading = ref(false);

const tierOptions: Array<{ title: string; value: MembershipTier }> = [
  { title: '基础（basic）', value: 'basic' },
  { title: '标准（standard）', value: 'standard' },
  { title: '高级（premium）', value: 'premium' },
];

const purchaseModeOptions: Array<{ title: string; value: PurchaseMode }> = [
  { title: '月一次性（one_time_month）', value: 'one_time_month' },
  { title: '月自动续费（auto_monthly）', value: 'auto_monthly' },
  { title: '年一次性（one_time_year）', value: 'one_time_year' },
  { title: '年自动续费（auto_yearly）', value: 'auto_yearly' },
];

const formData = ref({
  code: '',
  name: '',
  tier: 'basic' as MembershipTier,
  purchaseMode: 'one_time_month' as PurchaseMode,
  priceYuan: '',
  currency: 'CNY',
  monthlyCredits: '',
  billingIntervalMonths: '',
  isActive: true,
  wechatPapayPlanId: '',
  features: [] as IMembershipPlanFeature[],
});

const isEdit = computed(() => !!props.plan);
const dialogTitle = computed(() => (isEdit.value ? '编辑会员商品' : '新建会员商品'));

const rules = {
  code: [
    (v: string) => !!v || 'code 不能为空',
    (v: string) => v.length <= 50 || 'code 最长 50 字符',
  ],
  name: [
    (v: string) => !!v || '名称不能为空',
    (v: string) => v.length <= 100 || '名称最长 100 字符',
  ],
  tier: [(v: string) => !!v || 'Tier 不能为空'],
  purchaseMode: [(v: string) => !!v || 'PurchaseMode 不能为空'],
  priceYuan: [
    (v: string) => !!v || '价格不能为空',
    (v: string) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? true : '价格必须是大于 0 的数字';
    },
  ],
  currency: [
    (v: string) => !!v || '币种不能为空',
    (v: string) => (v?.length === 3 ? true : '币种必须为 3 位代码'),
  ],
  monthlyCredits: [
    (v: string) => !!v || '每月积分不能为空',
    (v: string) => {
      const n = Number(v);
      return Number.isInteger(n) && n > 0 ? true : '每月积分必须是大于 0 的整数';
    },
  ],
  billingIntervalMonths: [
    (v: string) => !!v || '计费周期（月）不能为空',
    (v: string) => {
      const n = Number(v);
      return Number.isInteger(n) && n > 0 ? true : '计费周期（月）必须是大于 0 的整数';
    },
  ],
};

watch(
  () => props.modelValue,
  val => {
    if (!val) return;

    formData.value = {
      code: '',
      name: '',
      tier: 'basic',
      purchaseMode: 'one_time_month',
      priceYuan: '',
      currency: 'CNY',
      monthlyCredits: '',
      billingIntervalMonths: '',
      isActive: true,
      wechatPapayPlanId: '',
      features: [],
    };
    form.value?.resetValidation();

    if (!props.plan) return;

    formData.value.code = props.plan.code;
    formData.value.name = props.plan.name;
    formData.value.tier = props.plan.tier;
    formData.value.purchaseMode = props.plan.purchaseMode;
    formData.value.priceYuan = (props.plan.priceCents / 100).toFixed(2);
    formData.value.currency = props.plan.currency || 'CNY';
    formData.value.monthlyCredits = String(props.plan.monthlyCredits);
    formData.value.billingIntervalMonths = String(props.plan.billingIntervalMonths);
    formData.value.isActive = props.plan.isActive;
    formData.value.wechatPapayPlanId = props.plan.wechatPapayPlanId || '';
    formData.value.features = [...(props.plan.features || [])];
  }
);

const closeDialog = () => {
  emit('update:modelValue', false);
};

const save = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    const priceYuanNum = Number(formData.value.priceYuan);
    const priceCents = Math.round(priceYuanNum * 100);
    const monthlyCredits = Number(formData.value.monthlyCredits);
    const billingIntervalMonths = Number(formData.value.billingIntervalMonths);

    const basePayload = {
      code: formData.value.code.trim(),
      name: formData.value.name.trim(),
      tier: formData.value.tier,
      purchaseMode: formData.value.purchaseMode,
      priceCents,
      currency: formData.value.currency.trim(),
      monthlyCredits,
      billingIntervalMonths,
      isActive: formData.value.isActive,
      wechatPapayPlanId: formData.value.wechatPapayPlanId.trim() || undefined,
      features: formData.value.features,
    };

    if (isEdit.value) {
      const payload: UpdateMembershipPlanParams = basePayload;
      emit('save', payload);
      return;
    }

    const payload: CreateMembershipPlanParams = basePayload;
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
    max-width="900"
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
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.code"
                label="code"
                variant="outlined"
                density="comfortable"
                :rules="rules.code"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.name"
                label="名称"
                variant="outlined"
                density="comfortable"
                :rules="rules.name"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="formData.tier"
                :items="tierOptions"
                label="Tier"
                variant="outlined"
                density="comfortable"
                :rules="rules.tier"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.purchaseMode"
                :items="purchaseModeOptions"
                label="PurchaseMode"
                variant="outlined"
                density="comfortable"
                :rules="rules.purchaseMode"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="formData.priceYuan"
                label="价格（元）"
                variant="outlined"
                density="comfortable"
                type="number"
                :rules="rules.priceYuan"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="formData.currency"
                label="币种"
                variant="outlined"
                density="comfortable"
                :rules="rules.currency"
              />
            </v-col>
            <v-col cols="12" md="4" class="d-flex align-center">
              <v-switch v-model="formData.isActive" label="启用" inset />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.monthlyCredits"
                label="每月积分"
                variant="outlined"
                density="comfortable"
                type="number"
                :rules="rules.monthlyCredits"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.billingIntervalMonths"
                label="计费周期（月）"
                variant="outlined"
                density="comfortable"
                type="number"
                :rules="rules.billingIntervalMonths"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="formData.wechatPapayPlanId"
                label="微信 Papay plan_id（可选）"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col cols="12">
              <MembershipPlanFeaturesEditor v-model="formData.features" />
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
