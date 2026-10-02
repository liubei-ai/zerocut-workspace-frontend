<script setup lang="ts">
import QRCode from 'qrcode';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import type { UpgradeQuote, UpgradeUpgrade } from '@/api/membershipUpgradeApi';

import { invokeWeixinBridgePay } from '@/utils/wechat';
const props = defineProps<{
  open: boolean;
  quote?: UpgradeQuote | null;
  operation?: UpgradeUpgrade | null;
  busy?: boolean;
  error?: string;
  notice?: string;
  targetPlanCode?: string;
}>();
const emit = defineEmits<{
  close: [];
  confirm: [];
  prepare: [];
  retry: [];
  requote: [];
  abandon: [];
  paidReturn: [];
}>();
const { t, locale } = useI18n();
const consent = ref(false),
  now = ref(Date.now()),
  panel = ref<HTMLElement | null>(null),
  qr = ref('');
const expired = computed(
  () => !!props.quote && new Date(props.quote.expiresAt).getTime() <= now.value
);
const safeAuthorization = computed(
  () =>
    props.operation?.state === 'AUTHORIZING' &&
    ['confirmed', 'not_required'].includes(props.operation.cancellationState) &&
    props.operation.nextAction.type === 'AUTHORIZE'
);
const money = (cents: number) =>
  new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'CNY' }).format(cents / 100);
const date = (value: string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat(locale.value, {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value))
    : t('membershipUpgrade.permanent');
function confirm() {
  if (consent.value && !props.busy && !expired.value) emit('confirm');
}
async function pay() {
  const params = props.operation?.nextAction.jsapiParams;
  if (!params || props.operation?.nextAction.type !== 'PAY_JSAPI') return;
  await invokeWeixinBridgePay(params);
  emit('paidReturn');
}
let previousFocus: HTMLElement | null = null;
const clock = setInterval(() => {
  now.value = Date.now();
}, 1000);
watch(
  () => [props.open, props.quote?.id],
  async () => {
    consent.value = false;
    if (props.open) {
      previousFocus = document.activeElement as HTMLElement;
      await nextTick();
      panel.value?.focus();
    } else previousFocus?.focus();
  },
  { immediate: true }
);
watch(
  () =>
    safeAuthorization.value
      ? props.operation?.nextAction.signingUrl
      : props.operation?.nextAction.type === 'PAY_NATIVE'
        ? props.operation.nextAction.codeUrl
        : null,
  async url => {
    qr.value = '';
    if (url) {
      try {
        const image = await QRCode.toDataURL(url, { width: 240, margin: 2 });
        if (
          [props.operation?.nextAction.signingUrl, props.operation?.nextAction.codeUrl].includes(
            url
          )
        )
          qr.value = image;
      } catch {
        qr.value = '';
      }
    }
  },
  { immediate: true }
);
onBeforeUnmount(() => {
  clearInterval(clock);
  previousFocus?.focus();
});
function keydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close');
    return;
  }
  if (event.key !== 'Tab') return;
  const list = Array.from(
    panel.value?.querySelectorAll<HTMLElement>(
      'button:not([disabled]),a[href],input:not([disabled])'
    ) ?? []
  );
  if (!list.length) return;
  const first = list[0],
    last = list[list.length - 1];
  if (
    event.shiftKey &&
    (document.activeElement === first || document.activeElement === panel.value)
  ) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
</script>
<template>
  <div v-if="open" class="upgrade-overlay">
    <section
      ref="panel"
      class="upgrade-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-title"
      tabindex="-1"
      @keydown="keydown"
    >
      <header>
        <h2 id="upgrade-title">{{ t('membershipUpgrade.title') }}</h2>
        <button data-test="close" type="button" @click="emit('close')">
          {{ t('membershipUpgrade.close') }}
        </button>
      </header>
      <p v-if="error" role="alert">{{ error }}</p>
      <template v-if="!quote && !operation">
        <p v-if="targetPlanCode">{{ t('membershipUpgrade.targetPlan') }}: {{ targetPlanCode }}</p>
        <p v-if="notice" role="status">{{ notice }}</p>
      </template>
      <form
        v-if="quote && (!operation || operation.state === 'RECONFIRM_REQUIRED')"
        @submit.prevent="confirm"
      >
        <dl>
          <dt>{{ t('membershipUpgrade.sourcePlan') }}</dt>
          <dd>{{ quote.source?.plan.code }}</dd>
          <dt>{{ t('membershipUpgrade.targetPlan') }}</dt>
          <dd>{{ quote.target.code }}</dd>
          <dt>{{ t('membershipUpgrade.price') }}</dt>
          <dd>{{ money(quote.amountCents) }}</dd>
          <dt>{{ t('membershipUpgrade.oldCredits') }}</dt>
          <dd>{{ quote.credits.oldAvailableCredits }}</dd>
          <dt>{{ t('membershipUpgrade.newCredits') }}</dt>
          <dd>{{ quote.credits.newCredits }}</dd>
          <dt>{{ t('membershipUpgrade.totalCredits') }}</dt>
          <dd>{{ quote.credits.totalAvailableCredits }}</dd>
          <dt>{{ t('membershipUpgrade.period') }}</dt>
          <dd>{{ date(quote.estimatedStartAt) }} — {{ date(quote.estimatedEndAt) }}</dd>
          <template v-if="quote.renewal.applicable"
            ><dt>{{ t('membershipUpgrade.renewal') }}</dt>
            <dd>{{ money(quote.renewal.amountCents!) }}</dd>
            <dt>{{ t('membershipUpgrade.charge') }}</dt>
            <dd>{{ date(quote.renewal.estimatedChargeAt) }}</dd></template
          >
          <template v-else
            ><dt>{{ t('membershipUpgrade.noRenewal') }}</dt>
            <dd>—</dd></template
          >
        </dl>
        <ul>
          <li v-for="batch in quote.credits.oldBatches" :key="batch.transactionId">
            {{ batch.remainingCredits }} · {{ t('membershipUpgrade.oldExpiry') }}:
            {{ date(batch.expiresAt) }}
          </li>
        </ul>
        <p v-if="quote.source?.plan.purchaseMode !== quote.target.purchaseMode">
          {{ t('membershipUpgrade.samePrice') }}
        </p>
        <label class="upgrade-consent"
          ><input v-model="consent" type="checkbox" />{{ t('membershipUpgrade.consent') }}</label
        >
        <p v-if="expired" role="alert">{{ t('membershipUpgrade.expired') }}</p>
        <button v-if="expired" type="button" @click="emit('requote')">
          {{ t('membershipUpgrade.prepareAgain') }}
        </button>
        <button data-test="confirm" type="submit" :disabled="!consent || busy || expired">
          {{ t('membershipUpgrade.confirm') }}
        </button>
      </form>
      <div v-else-if="operation" aria-live="polite">
        <p>
          {{ t('membershipUpgrade.stateLabel') }}:
          {{ t(`membershipUpgrade.states.${operation.state}`) }}
        </p>
        <p>{{ t('membershipUpgrade.price') }}: {{ money(operation.payment.amountCents) }}</p>
        <dl v-if="operation.fulfillment.credits">
          <dt>{{ t('membershipUpgrade.oldCredits') }}</dt>
          <dd>{{ operation.fulfillment.credits.oldAvailableCredits }}</dd>
          <dt>{{ t('membershipUpgrade.newCredits') }}</dt>
          <dd>{{ operation.fulfillment.credits.newCredits }}</dd>
          <dt>{{ t('membershipUpgrade.totalCredits') }}</dt>
          <dd>{{ operation.fulfillment.credits.totalAvailableCredits }}</dd>
        </dl>
        <p v-if="operation.state === 'COMPLETED'" data-test="completed">
          {{ t('membershipUpgrade.completed') }}
        </p>
        <p v-else-if="operation.fulfillment.state === 'committed'">
          {{ t('membershipUpgrade.delivered') }}
        </p>
        <p v-else-if="['confirmed', 'zero_settled'].includes(operation.payment.state)">
          {{ t('membershipUpgrade.paid') }}
        </p>
        <p v-if="operation.cancellationState === 'confirmed'">
          {{ t('membershipUpgrade.oldRenewalStopped') }}
        </p>
        <template v-if="operation.nextAction.type === 'PAY_NATIVE'"
          ><img
            v-if="qr"
            :src="qr"
            :alt="t('membershipUpgrade.scanPay')"
            width="240"
            height="240"
          />
          <p>{{ t('membershipUpgrade.scanPay') }}</p></template
        >
        <button
          v-if="operation.nextAction.type === 'PAY_JSAPI'"
          type="button"
          :disabled="busy"
          @click="pay"
        >
          {{ t('membershipUpgrade.pay') }}
        </button>
        <button
          v-if="!safeAuthorization && operation.allowedActions.includes('prepare')"
          type="button"
          :disabled="busy"
          @click="emit('prepare')"
        >
          {{ t('membershipUpgrade.pay') }}
        </button>
        <template v-if="safeAuthorization">
          <button
            v-if="!operation.nextAction.signingUrl && operation.allowedActions.includes('prepare')"
            data-test="prepare"
            type="button"
            :disabled="busy"
            @click="emit('prepare')"
          >
            {{ t('membershipUpgrade.prepare') }}
          </button>
          <template v-if="operation.nextAction.signingUrl"
            ><img v-if="qr" :src="qr" :alt="t('membershipUpgrade.scan')" width="240" height="240" />
            <p>{{ t('membershipUpgrade.scan') }}</p>
            <a
              data-test="authorize"
              :href="operation.nextAction.signingUrl"
              target="_blank"
              rel="noopener noreferrer"
              >{{ t('membershipUpgrade.authorize') }}</a
            ></template
          >
        </template>
        <button
          v-if="operation.nextAction.type === 'RECONFIRM'"
          type="button"
          :disabled="busy"
          @click="emit('requote')"
        >
          {{ t('membershipUpgrade.prepareAgain') }}
        </button>
        <button
          v-if="operation.allowedActions.includes('retry')"
          type="button"
          :disabled="busy"
          @click="emit('retry')"
        >
          {{ t('membershipUpgrade.retry') }}
        </button>
        <template v-if="operation.allowedActions.includes('abandon')"
          ><p>{{ t('membershipUpgrade.abandonHint') }}</p>
          <button type="button" :disabled="busy" @click="emit('abandon')">
            {{ t('membershipUpgrade.abandon') }}
          </button></template
        >
        <p v-if="operation.support.required">{{ t('membershipUpgrade.support') }}</p>
        <p v-if="operation.support.userVisibleProgress">
          {{ operation.support.userVisibleProgress }}
        </p>
        <p v-if="operation.fulfillment.endsAt">
          {{ date(operation.fulfillment.startedAt) }} — {{ date(operation.fulfillment.endsAt) }}
        </p>
        <p v-if="operation.renewal.state === 'ready'">
          {{ t('membershipUpgrade.renewalReady') }} · {{ money(operation.renewal.amountCents!) }} ·
          {{ date(operation.renewal.estimatedChargeAt) }}
        </p>
      </div>
      <p class="upgrade-timezone">{{ t('membershipUpgrade.timezone') }}</p>
    </section>
  </div>
</template>
<style scoped>
.upgrade-overlay {
  position: fixed;
  inset: 0;
  z-index: 2500;
  background: #0008;
  display: grid;
  place-items: center;
  padding: 20px;
}
.upgrade-panel {
  width: min(100%, 640px);
  max-height: 90vh;
  overflow: auto;
  background: rgb(var(--v-theme-surface, 255 255 255));
  color: rgb(var(--v-theme-on-surface, 20 20 20));
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 16px 64px #0004;
}
.upgrade-panel header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
.upgrade-panel h2 {
  font-size: 1.35rem;
}
.upgrade-panel dl {
  display: grid;
  grid-template-columns: minmax(100px, 1fr) 2fr;
  gap: 12px;
}
.upgrade-panel dd {
  margin: 0;
  font-weight: 600;
}
.upgrade-panel ul {
  padding: 16px 20px;
}
.upgrade-consent {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 20px 0;
}
.upgrade-consent input {
  margin-top: 5px;
  flex-shrink: 0;
}
.upgrade-panel button,
.upgrade-panel a {
  display: inline-block;
  border: 1px solid currentColor;
  border-radius: 8px;
  padding: 8px 16px;
  margin: 8px 8px 8px 0;
}
.upgrade-panel button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.upgrade-panel :focus-visible {
  outline: 3px solid #627aff;
  outline-offset: 3px;
}
.upgrade-timezone {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-top: 20px;
}
</style>
