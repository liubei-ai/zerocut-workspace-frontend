<script setup lang="ts">
import ResponsivePageHeader from '@/components/common/ResponsivePageHeader.vue';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

type StaticSubscription = {
  planName: string;
  billingMode: 'auto_yearly' | 'auto_monthly';
  priceYuan: number;
  currency: 'CNY';
  status: 'active' | 'canceled';
  currentPeriodEndAt: string;
  nextBillingAt: string;
};

const snackbarStore = useSnackbarStore();
const { t } = useI18n();
const router = useRouter();

const cancelDialogOpen = ref(false);
const cancelling = ref(false);

const subscription = ref<StaticSubscription>({
  planName: t('zerocut.membership.tiers.standard'),
  billingMode: 'auto_monthly',
  priceYuan: 265,
  currency: 'CNY',
  status: 'active',
  currentPeriodEndAt: '2026-02-26 23:59',
  nextBillingAt: '2026-02-26 07:00',
});

const billingModeText = computed(() => {
  return subscription.value.billingMode === 'auto_yearly'
    ? t('zerocut.membership.priceList.headers.autoYearly')
    : t('zerocut.membership.priceList.headers.autoMonthly');
});

const statusChip = computed(() => {
  if (subscription.value.status === 'active') {
    return { color: 'success', text: t('zerocut.plansAndBilling.status.active') };
  }
  return { color: 'warning', text: t('zerocut.plansAndBilling.status.canceled') };
});

function openCancelDialog() {
  cancelDialogOpen.value = true;
}

async function confirmCancel() {
  try {
    cancelling.value = true;
    subscription.value = { ...subscription.value, status: 'canceled' };
    snackbarStore.showSuccessMessage(t('zerocut.plansAndBilling.messages.cancelSuccess'));
    cancelDialogOpen.value = false;
  } finally {
    cancelling.value = false;
  }
}
</script>

<template>
  <div>
    <ResponsivePageHeader
      :title="t('zerocut.plansAndBilling.title')"
      :subtitle="t('zerocut.plansAndBilling.subtitle')"
    />

    <v-row>
      <v-col cols="12" md="7">
        <v-card variant="outlined" class="mb-6">
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="text-h6 font-weight-bold">
              {{ t('zerocut.plansAndBilling.sections.current') }}
            </div>
            <v-chip size="small" variant="tonal" :color="statusChip.color">{{
              statusChip.text
            }}</v-chip>
          </v-card-title>
          <v-card-text>
            <v-list density="compact" class="pa-0">
              <v-list-item class="px-0">
                <v-list-item-title class="text-body-2">
                  {{ t('zerocut.plansAndBilling.fields.plan') }}：
                  <span class="font-weight-medium">{{ subscription.planName }}</span>
                </v-list-item-title>
              </v-list-item>
              <v-list-item class="px-0">
                <v-list-item-title class="text-body-2">
                  {{ t('zerocut.plansAndBilling.fields.billingMode') }}：
                  <span class="font-weight-medium">{{ billingModeText }}</span>
                </v-list-item-title>
              </v-list-item>
              <v-list-item class="px-0">
                <v-list-item-title class="text-body-2">
                  {{ t('zerocut.plansAndBilling.fields.price') }}：
                  <span class="font-weight-medium text-primary">
                    ¥{{ subscription.priceYuan }}
                  </span>
                </v-list-item-title>
              </v-list-item>
              <v-list-item class="px-0">
                <v-list-item-title class="text-body-2">
                  {{ t('zerocut.plansAndBilling.fields.nextBillingAt') }}：
                  <span class="font-weight-medium">{{ subscription.nextBillingAt }}</span>
                </v-list-item-title>
              </v-list-item>
              <v-list-item class="px-0">
                <v-list-item-title class="text-body-2">
                  {{ t('zerocut.plansAndBilling.fields.currentPeriodEndAt') }}：
                  <span class="font-weight-medium">{{ subscription.currentPeriodEndAt }}</span>
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card variant="outlined" class="mb-6">
          <v-card-title class="text-h6 font-weight-bold">
            {{ t('zerocut.plansAndBilling.sections.cancel') }}
          </v-card-title>
          <v-card-text>
            <div class="text-body-2 text-medium-emphasis mb-3">
              {{ t('zerocut.plansAndBilling.cancel.description') }}
            </div>
            <v-alert variant="tonal" type="info" class="mb-4">
              <div class="text-body-2">
                {{ t('zerocut.plansAndBilling.cancel.pathTitle') }}
              </div>
              <div class="text-body-2 mt-1">
                {{ t('zerocut.plansAndBilling.cancel.path') }}
              </div>
            </v-alert>
            <v-btn
              color="error"
              variant="outlined"
              :disabled="subscription.status !== 'active'"
              @click="openCancelDialog"
            >
              {{ t('zerocut.plansAndBilling.cancel.button') }}
            </v-btn>
            <v-btn class="ml-2" variant="text" @click="router.push('/membership')">
              {{ t('zerocut.plansAndBilling.cancel.viewPlans') }}
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="cancelDialogOpen" max-width="520">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">
          {{ t('zerocut.plansAndBilling.cancel.dialogTitle') }}
        </v-card-title>
        <v-card-text>
          <div class="text-body-2 text-medium-emphasis">
            {{ t('zerocut.plansAndBilling.cancel.dialogDesc') }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="cancelling" @click="cancelDialogOpen = false">
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn color="error" variant="elevated" :loading="cancelling" @click="confirmCancel">
            {{ t('zerocut.plansAndBilling.cancel.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
