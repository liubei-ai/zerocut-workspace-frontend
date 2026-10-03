<script setup lang="ts">
import QRCode from 'qrcode';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import type { UpgradePlan, UpgradeQuote, UpgradeUpgrade } from '@/api/membershipUpgradeApi';

import { invokeWeixinBridgePay } from '@/utils/wechat';
const props = defineProps<{
  open: boolean;
  quote?: UpgradeQuote | null;
  operation?: UpgradeUpgrade | null;
  busy?: boolean;
  error?: string;
  benefitsState?: 'idle' | 'syncing' | 'failed' | 'synced';
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
  syncBenefits: [];
}>();
const { t, locale } = useI18n();
const consent = ref(false),
  now = ref(Date.now()),
  panel = ref<HTMLElement | null>(null),
  qr = ref('');
const expired = computed(
  () => !!props.quote && new Date(props.quote.expiresAt).getTime() <= now.value
);
const completed = computed(() => props.operation?.state === 'COMPLETED');
const attention = computed(() =>
  ['MANUAL_REVIEW', 'PAYMENT_UNKNOWN', 'FAILED', 'REFUND_PENDING'].includes(
    props.operation?.state ?? ''
  )
);
const planName = (plan?: Partial<UpgradePlan>) =>
  plan?.tier ? t(`zerocut.membership.tiers.${plan.tier}`) : (plan?.code ?? '—');
const planMode = (plan?: Partial<UpgradePlan>) =>
  plan?.purchaseMode
    ? t(
        `zerocut.membership.cycles.${plan.purchaseMode === 'auto_monthly' ? 'monthly' : plan.purchaseMode}`
      )
    : '';
const credits = (value?: string) =>
  value && /^\d+$/.test(value)
    ? new Intl.NumberFormat(locale.value).format(BigInt(value))
    : (value ?? '—');
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
      'button:not([disabled]),a[href],input:not([disabled]),summary'
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
      :class="{ 'is-completed': completed }"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-title"
      tabindex="-1"
      @keydown="keydown"
    >
      <header class="upgrade-header">
        <div class="upgrade-heading">
          <span class="upgrade-mark" aria-hidden="true"
            ><svg viewBox="0 0 24 24" fill="none">
              <path
                d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linejoin="round"
              /></svg
          ></span>
          <h2 id="upgrade-title">{{ t('membershipUpgrade.title') }}</h2>
        </div>
        <button
          data-test="close"
          class="upgrade-close"
          type="button"
          :aria-label="t('membershipUpgrade.close')"
          @click="emit('close')"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="m6 6 12 12M18 6 6 18"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </header>
      <div class="upgrade-body">
        <div
          v-if="
            operation?.fulfillment.state === 'committed' &&
            ['syncing', 'failed'].includes(benefitsState ?? '')
          "
          class="upgrade-alert"
          role="status"
          data-test="benefits-sync"
        >
          <p>{{ t(`membershipUpgrade.benefitsSync.${benefitsState}`) }}</p>
          <button v-if="benefitsState === 'failed'" type="button" @click="emit('syncBenefits')">
            {{ t('membershipUpgrade.benefitsSync.retry') }}
          </button>
        </div>
        <p v-if="error" class="upgrade-alert is-error" role="alert">{{ error }}</p>
        <div v-if="!quote && !operation" class="upgrade-empty">
          <p v-if="targetPlanCode" class="upgrade-eyebrow">
            {{ t('membershipUpgrade.targetPlan') }}: {{ targetPlanCode }}
          </p>
          <p v-if="notice" class="upgrade-alert" role="status">{{ notice }}</p>
        </div>
        <form
          v-if="quote && (!operation || operation.state === 'RECONFIRM_REQUIRED')"
          @submit.prevent="confirm"
        >
          <div class="upgrade-plan-switch">
            <div class="upgrade-plan">
              <span class="upgrade-eyebrow">{{ t('membershipUpgrade.sourcePlan') }}</span
              ><strong>{{ planName(quote.source?.plan) }}</strong
              ><span>{{ planMode(quote.source?.plan) }}</span>
            </div>
            <span class="upgrade-arrow" aria-hidden="true">→</span>
            <div class="upgrade-plan is-target">
              <span class="upgrade-eyebrow">{{ t('membershipUpgrade.targetPlan') }}</span
              ><strong>{{ planName(quote.target) }}</strong
              ><span>{{ planMode(quote.target) }}</span>
            </div>
          </div>
          <div class="upgrade-amount">
            <span>{{ t('membershipUpgrade.amountDue') }}</span
            ><strong>{{ money(quote.amountCents) }}</strong>
          </div>
          <dl class="upgrade-credit-grid">
            <div>
              <dt>{{ t('membershipUpgrade.oldCredits') }}</dt>
              <dd>{{ credits(quote.credits.oldAvailableCredits) }}</dd>
            </div>
            <div>
              <dt>{{ t('membershipUpgrade.newCredits') }}</dt>
              <dd class="upgrade-accent">+{{ credits(quote.credits.newCredits) }}</dd>
            </div>
            <div class="is-total">
              <dt>{{ t('membershipUpgrade.totalCredits') }}</dt>
              <dd>{{ credits(quote.credits.totalAvailableCredits) }}</dd>
            </div>
          </dl>
          <dl class="upgrade-detail-list">
            <div>
              <dt>{{ t('membershipUpgrade.period') }}</dt>
              <dd>{{ date(quote.estimatedStartAt) }} — {{ date(quote.estimatedEndAt) }}</dd>
            </div>
            <template v-if="quote.renewal.applicable"
              ><div>
                <dt>{{ t('membershipUpgrade.renewal') }}</dt>
                <dd>{{ money(quote.renewal.amountCents!) }}</dd>
              </div>
              <div>
                <dt>{{ t('membershipUpgrade.charge') }}</dt>
                <dd>{{ date(quote.renewal.estimatedChargeAt) }}</dd>
              </div></template
            >
            <div v-else>
              <dt>{{ t('membershipUpgrade.noRenewal') }}</dt>
              <dd>—</dd>
            </div>
          </dl>
          <details v-if="quote.credits.oldBatches.length" class="upgrade-batches">
            <summary>{{ t('membershipUpgrade.creditExpiryDetails') }}</summary>
            <ul>
              <li v-for="batch in quote.credits.oldBatches" :key="batch.transactionId">
                <strong>{{ credits(batch.remainingCredits) }}</strong
                ><span>{{ t('membershipUpgrade.oldExpiry') }}: {{ date(batch.expiresAt) }}</span>
              </li>
            </ul>
          </details>
          <p
            v-if="quote.source?.plan.purchaseMode !== quote.target.purchaseMode"
            class="upgrade-note"
          >
            {{ t('membershipUpgrade.samePrice') }}
          </p>
          <label class="upgrade-consent"
            ><input v-model="consent" type="checkbox" /><span>{{
              t('membershipUpgrade.consent')
            }}</span></label
          >
          <p v-if="expired" class="upgrade-alert is-warning" role="alert">
            {{ t('membershipUpgrade.expired') }}
          </p>
          <div class="upgrade-actions">
            <button
              v-if="expired"
              class="upgrade-button is-secondary"
              type="button"
              @click="emit('requote')"
            >
              {{ t('membershipUpgrade.prepareAgain') }}</button
            ><button
              data-test="confirm"
              class="upgrade-button is-primary"
              type="submit"
              :disabled="!consent || busy || expired"
            >
              {{ t('membershipUpgrade.confirm') }}
            </button>
          </div>
        </form>
        <div v-else-if="operation" aria-live="polite">
          <div
            class="upgrade-status"
            :class="{ 'is-success': completed, 'is-attention': attention }"
          >
            <span class="upgrade-status-icon" aria-hidden="true"
              ><svg v-if="completed" viewBox="0 0 24 24" fill="none">
                <path
                  d="m5 12 4 4L19 6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /></svg
              ><span v-else-if="attention">!</span><span v-else class="upgrade-spinner"
            /></span>
            <h3 v-if="completed" data-test="completed">{{ t('membershipUpgrade.completed') }}</h3>
            <h3 v-else>{{ t(`membershipUpgrade.states.${operation.state}`) }}</h3>
            <p>
              {{ planName(operation.targetPlan)
              }}<template v-if="planMode(operation.targetPlan)">
                · {{ planMode(operation.targetPlan) }}</template
              >
            </p>
          </div>
          <div class="upgrade-amount">
            <span>{{
              t(
                ['confirmed', 'zero_settled'].includes(operation.payment.state)
                  ? 'membershipUpgrade.price'
                  : 'membershipUpgrade.amountDue'
              )
            }}</span
            ><strong>{{ money(operation.payment.amountCents) }}</strong>
          </div>
          <dl v-if="operation.fulfillment.credits" class="upgrade-credit-grid">
            <div>
              <dt>{{ t('membershipUpgrade.oldCredits') }}</dt>
              <dd>{{ credits(operation.fulfillment.credits.oldAvailableCredits) }}</dd>
            </div>
            <div>
              <dt>{{ t('membershipUpgrade.newCredits') }}</dt>
              <dd class="upgrade-accent">
                +{{ credits(operation.fulfillment.credits.newCredits) }}
              </dd>
            </div>
            <div class="is-total">
              <dt>{{ t('membershipUpgrade.totalCredits') }}</dt>
              <dd>{{ credits(operation.fulfillment.credits.totalAvailableCredits) }}</dd>
            </div>
          </dl>
          <div v-if="operation.fulfillment.endsAt" class="upgrade-period">
            <span>{{ t('membershipUpgrade.activePeriod') }}</span
            ><strong
              >{{ date(operation.fulfillment.startedAt) }} —
              {{ date(operation.fulfillment.endsAt) }}</strong
            >
          </div>
          <p v-if="!completed && operation.fulfillment.state === 'committed'" class="upgrade-alert">
            {{ t('membershipUpgrade.delivered') }}
          </p>
          <p
            v-else-if="
              !completed && ['confirmed', 'zero_settled'].includes(operation.payment.state)
            "
            class="upgrade-alert"
          >
            {{ t('membershipUpgrade.paid') }}
          </p>
          <p v-if="operation.cancellationState === 'confirmed'" class="upgrade-note">
            {{ t('membershipUpgrade.oldRenewalStopped') }}
          </p>
          <div v-if="operation.nextAction.type === 'PAY_NATIVE'" class="upgrade-qr-section">
            <div class="upgrade-qr-frame">
              <img
                v-if="qr"
                :src="qr"
                :alt="t('membershipUpgrade.scanPay')"
                width="240"
                height="240"
              />
            </div>
            <p>{{ t('membershipUpgrade.scanPay') }}</p>
          </div>
          <div
            v-if="safeAuthorization && operation.nextAction.signingUrl"
            class="upgrade-qr-section"
          >
            <div class="upgrade-qr-frame">
              <img
                v-if="qr"
                :src="qr"
                :alt="t('membershipUpgrade.scan')"
                width="240"
                height="240"
              />
            </div>
            <p>{{ t('membershipUpgrade.scan') }}</p>
          </div>
          <p v-if="operation.support.required" class="upgrade-alert is-warning">
            {{ t('membershipUpgrade.support') }}
          </p>
          <p v-if="operation.support.userVisibleProgress" class="upgrade-note">
            {{ operation.support.userVisibleProgress }}
          </p>
          <p v-if="operation.renewal.state === 'ready'" class="upgrade-note">
            {{ t('membershipUpgrade.renewalReady') }} ·
            {{ money(operation.renewal.amountCents!) }} ·
            {{ date(operation.renewal.estimatedChargeAt) }}
          </p>
          <p v-if="operation.allowedActions.includes('abandon')" class="upgrade-note">
            {{ t('membershipUpgrade.abandonHint') }}
          </p>
          <div class="upgrade-actions">
            <button
              v-if="operation.nextAction.type === 'PAY_JSAPI'"
              class="upgrade-button is-primary"
              type="button"
              :disabled="busy"
              @click="pay"
            >
              {{ t('membershipUpgrade.pay') }}
            </button>
            <button
              v-if="!safeAuthorization && operation.allowedActions.includes('prepare')"
              class="upgrade-button is-primary"
              type="button"
              :disabled="busy"
              @click="emit('prepare')"
            >
              {{ t('membershipUpgrade.pay') }}
            </button>
            <button
              v-if="
                safeAuthorization &&
                !operation.nextAction.signingUrl &&
                operation.allowedActions.includes('prepare')
              "
              data-test="prepare"
              class="upgrade-button is-primary"
              type="button"
              :disabled="busy"
              @click="emit('prepare')"
            >
              {{ t('membershipUpgrade.prepare') }}
            </button>
            <a
              v-if="safeAuthorization && operation.nextAction.signingUrl"
              data-test="authorize"
              class="upgrade-button is-primary"
              :href="operation.nextAction.signingUrl"
              target="_blank"
              rel="noopener noreferrer"
              >{{ t('membershipUpgrade.authorize') }}</a
            >
            <button
              v-if="operation.nextAction.type === 'RECONFIRM'"
              class="upgrade-button is-primary"
              type="button"
              :disabled="busy"
              @click="emit('requote')"
            >
              {{ t('membershipUpgrade.prepareAgain') }}
            </button>
            <button
              v-if="operation.allowedActions.includes('retry')"
              class="upgrade-button is-secondary"
              type="button"
              :disabled="busy"
              @click="emit('retry')"
            >
              {{ t('membershipUpgrade.retry') }}
            </button>
            <button
              v-if="operation.allowedActions.includes('abandon')"
              class="upgrade-button is-danger"
              type="button"
              :disabled="busy"
              @click="emit('abandon')"
            >
              {{ t('membershipUpgrade.abandon') }}
            </button>
            <button
              v-if="completed"
              class="upgrade-button is-primary"
              type="button"
              @click="emit('close')"
            >
              {{ t('membershipUpgrade.done') }}
            </button>
          </div>
        </div>
      </div>
      <footer class="upgrade-footer">
        <span class="upgrade-timezone">{{ t('membershipUpgrade.timezone') }}</span>
      </footer>
    </section>
  </div>
</template>
<style scoped>
.upgrade-overlay {
  position: fixed;
  inset: 0;
  z-index: 2500;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 18, 30, 0.55);
  backdrop-filter: blur(5px);
}
.upgrade-panel {
  --upgrade-primary: rgb(var(--v-theme-primary, 112, 92, 246));
  --upgrade-muted: rgba(var(--v-theme-on-surface, 20, 20, 20), 0.58);
  --upgrade-border: rgba(var(--v-theme-on-surface, 20, 20, 20), 0.09);
  width: min(100%, 680px);
  max-height: min(92vh, 960px);
  overflow: auto;
  background: rgb(var(--v-theme-surface, 255, 255, 255));
  color: rgb(var(--v-theme-on-surface, 20, 20, 20));
  border: 1px solid var(--upgrade-border);
  border-radius: 24px;
  outline: none;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.22);
  font-size: 14px;
  line-height: 1.6;
}
.upgrade-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px;
  border-bottom: 1px solid var(--upgrade-border);
}
.upgrade-heading {
  display: flex;
  align-items: center;
  gap: 12px;
}
.upgrade-mark {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  color: var(--upgrade-primary);
  background: rgba(var(--v-theme-primary, 112, 92, 246), 0.09);
}
.upgrade-mark svg,
.upgrade-close svg {
  width: 22px;
  height: 22px;
}
.upgrade-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 650;
}
.upgrade-close {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 10px;
  color: var(--upgrade-muted);
  background: transparent;
  cursor: pointer;
}
.upgrade-close:hover {
  background: rgba(var(--v-theme-on-surface, 20, 20, 20), 0.06);
}
.upgrade-body {
  padding: 28px;
}
.upgrade-body p {
  margin: 0;
}
.upgrade-eyebrow {
  font-size: 12px;
  color: var(--upgrade-muted);
}
.upgrade-plan-switch {
  display: grid;
  grid-template-columns: 1fr 24px 1fr;
  gap: 12px;
  align-items: center;
}
.upgrade-plan {
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
  border: 1px solid var(--upgrade-border);
  border-radius: 14px;
}
.upgrade-plan strong {
  font-size: 18px;
  margin: 4px 0;
}
.upgrade-plan > span:last-child {
  font-size: 12px;
  color: var(--upgrade-muted);
}
.upgrade-plan.is-target {
  background: rgba(var(--v-theme-primary, 112, 92, 246), 0.04);
  border-color: rgba(var(--v-theme-primary, 112, 92, 246), 0.25);
}
.upgrade-arrow {
  color: var(--upgrade-muted);
  font-size: 22px;
  text-align: center;
}
.upgrade-amount {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 0;
}
.upgrade-amount > span {
  color: var(--upgrade-muted);
}
.upgrade-amount > strong {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
}
.upgrade-credit-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 0 0 22px;
}
.upgrade-credit-grid > div {
  padding: 16px;
  border: 1px solid var(--upgrade-border);
  border-radius: 12px;
}
.upgrade-credit-grid dt {
  font-size: 12px;
  color: var(--upgrade-muted);
}
.upgrade-credit-grid dd {
  margin: 6px 0 0;
  font-size: 24px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.upgrade-credit-grid .is-total {
  background: rgba(var(--v-theme-primary, 112, 92, 246), 0.06);
  border-color: transparent;
}
.upgrade-accent {
  color: var(--upgrade-primary);
}
.upgrade-detail-list {
  margin: 0;
  padding: 16px 20px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface, 20, 20, 20), 0.035);
}
.upgrade-detail-list > div {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 6px 0;
}
.upgrade-detail-list dt {
  flex-shrink: 0;
  color: var(--upgrade-muted);
  font-size: 12px;
}
.upgrade-detail-list dd {
  margin: 0;
  text-align: right;
  font-size: 13px;
  font-weight: 500;
}
.upgrade-batches {
  margin: 18px 0;
  font-size: 12px;
  color: var(--upgrade-muted);
}
.upgrade-batches summary {
  cursor: pointer;
}
.upgrade-batches ul {
  list-style: none;
  padding: 8px 0 0;
  margin: 0;
}
.upgrade-batches li {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 0;
}
.upgrade-body .upgrade-note {
  font-size: 12px;
  color: var(--upgrade-muted);
  margin: 16px 0;
}
.upgrade-consent {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 20px 0;
  padding: 14px 16px;
  border: 1px solid var(--upgrade-border);
  border-radius: 12px;
  font-size: 12px;
  color: var(--upgrade-muted);
  cursor: pointer;
}
.upgrade-consent input {
  margin-top: 3px;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  accent-color: var(--upgrade-primary);
}
.upgrade-body .upgrade-alert {
  padding: 12px 16px;
  margin: 0 0 16px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary, 112, 92, 246), 0.06);
  font-size: 13px;
}
.upgrade-alert.is-error {
  background: rgba(var(--v-theme-error, 252, 60, 86), 0.08);
  color: rgb(var(--v-theme-error, 252, 60, 86));
}
.upgrade-alert.is-warning {
  background: rgba(var(--v-theme-warning, 251, 140, 0), 0.08);
}
.upgrade-status {
  text-align: center;
  padding: 4px 0 12px;
}
.upgrade-status-icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 50%;
  color: var(--upgrade-primary);
  background: rgba(var(--v-theme-primary, 112, 92, 246), 0.08);
}
.upgrade-status-icon svg {
  width: 32px;
  height: 32px;
}
.upgrade-status.is-success .upgrade-status-icon {
  color: rgb(var(--v-theme-success, 46, 155, 102));
  background: rgba(var(--v-theme-success, 46, 155, 102), 0.1);
}
.upgrade-status.is-attention .upgrade-status-icon {
  color: rgb(var(--v-theme-warning, 251, 140, 0));
  background: rgba(var(--v-theme-warning, 251, 140, 0), 0.08);
  font-size: 30px;
  font-weight: 600;
}
.upgrade-status h3 {
  font-size: 22px;
  font-weight: 650;
  margin: 0 0 4px;
}
.upgrade-status p {
  color: var(--upgrade-muted);
  font-size: 13px;
}
.upgrade-spinner {
  width: 26px;
  height: 26px;
  border: 2px solid rgba(var(--v-theme-primary, 112, 92, 246), 0.18);
  border-top-color: var(--upgrade-primary);
  border-radius: 50%;
  animation: upgrade-spin 1s linear infinite;
}
.upgrade-period {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 20px;
  margin-bottom: 22px;
  border: 1px solid var(--upgrade-border);
  border-radius: 12px;
}
.upgrade-period span {
  color: var(--upgrade-muted);
  font-size: 12px;
}
.upgrade-period strong {
  font-size: 13px;
  font-weight: 500;
}
.upgrade-qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 24px;
  margin: 0 0 20px;
  border-radius: 16px;
  background: rgba(var(--v-theme-on-surface, 20, 20, 20), 0.035);
}
.upgrade-qr-frame {
  display: grid;
  place-items: center;
  width: 256px;
  height: 256px;
  padding: 8px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #ededed;
}
.upgrade-qr-frame img {
  display: block;
  width: 240px;
  height: 240px;
}
.upgrade-qr-section p {
  font-size: 13px;
}
.upgrade-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}
.upgrade-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 20px;
  border: 1px solid transparent;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition:
    background 0.15s,
    box-shadow 0.15s;
}
.upgrade-button.is-primary {
  background: var(--upgrade-primary);
  color: rgb(var(--v-theme-on-primary, 255, 255, 255));
  box-shadow: 0 3px 8px rgba(var(--v-theme-primary, 112, 92, 246), 0.16);
}
.upgrade-button.is-primary:hover {
  filter: brightness(1.06);
}
.upgrade-button.is-secondary {
  background: transparent;
  color: inherit;
  border-color: var(--upgrade-border);
}
.upgrade-button.is-secondary:hover {
  background: rgba(var(--v-theme-on-surface, 20, 20, 20), 0.04);
}
.upgrade-button.is-danger {
  background: transparent;
  color: rgb(var(--v-theme-error, 252, 60, 86));
}
.upgrade-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}
.upgrade-panel :focus-visible {
  outline: 3px solid var(--upgrade-primary);
  outline-offset: 3px;
}
.upgrade-footer {
  border-top: 1px solid var(--upgrade-border);
  padding: 14px 28px;
}
.upgrade-timezone {
  font-size: 11px;
  color: var(--upgrade-muted);
}
.is-completed .upgrade-actions .is-primary {
  flex: 1;
}
@keyframes upgrade-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .upgrade-spinner {
    animation: none;
  }
  .upgrade-button {
    transition: none;
  }
}
@media (max-width: 600px) {
  .upgrade-overlay {
    padding: 12px;
  }
  .upgrade-panel {
    border-radius: 18px;
    max-height: 94dvh;
  }
  .upgrade-header {
    padding: 18px 20px;
  }
  .upgrade-body {
    padding: 20px;
  }
  .upgrade-footer {
    padding: 12px 20px;
  }
  .upgrade-plan {
    padding: 12px;
  }
  .upgrade-plan-switch {
    gap: 6px;
    grid-template-columns: 1fr 20px 1fr;
  }
  .upgrade-plan strong {
    font-size: 16px;
  }
  .upgrade-credit-grid {
    gap: 6px;
  }
  .upgrade-credit-grid > div {
    padding: 12px 8px;
  }
  .upgrade-credit-grid dt {
    font-size: 11px;
  }
  .upgrade-credit-grid dd {
    font-size: 20px;
  }
  .upgrade-detail-list > div {
    flex-direction: column;
    gap: 3px;
  }
  .upgrade-detail-list dd {
    text-align: left;
  }
  .upgrade-actions .upgrade-button {
    flex: 1;
  }
}
</style>
