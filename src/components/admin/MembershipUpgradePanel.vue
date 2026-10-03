<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import type {
  UpgradeAdminUpgradeSummary,
  UpgradeAdminUpgradeDetail,
  UpgradeAdminAction,
  UpgradeUpgrade,
} from '@/api/membershipUpgradeApi';

import { membershipUpgradeAdminApi as api } from '@/api/membershipUpgradeAdminApi';
import { Permission } from '@/constants/permissions';
import { useUserStore } from '@/stores/userStore';
const props = defineProps<{ accountId?: string }>();
const user = useUserStore(),
  { t, locale } = useI18n();
const visible = computed(
  () => user.hasPermission(Permission.ADMIN_ACCESS) && user.hasPermission(Permission.ORDER_READ)
);
const items = ref<UpgradeAdminUpgradeSummary[]>([]),
  detail = ref<UpgradeAdminUpgradeDetail | null>(null),
  cursor = ref<string | null>(null),
  busy = ref(false),
  error = ref('');
const unresolvedOnly = ref(false);
const selectedOrder = ref('');
const offlineResolution = ref<UpgradeAdminAction['resolution']>();
const resolutionEvidence = ref('');
const state = ref<UpgradeUpgrade['state'] | ''>('');
const states: UpgradeUpgrade['state'][] = [
  'WAITING_SOURCE_PAYMENT',
  'CANCELING',
  'RECONFIRM_REQUIRED',
  'AUTHORIZING',
  'PAYMENT_PENDING',
  'PAYMENT_UNKNOWN',
  'FULFILLING',
  'RENEWAL_PENDING',
  'COMPLETED',
  'MANUAL_REVIEW',
  'REFUND_PENDING',
  'REFUNDED',
  'ABANDONED',
  'FAILED',
];
const filters = () => ({
  ...(props.accountId ? { accountId: props.accountId } : {}),
  ...(unresolvedOnly.value ? { hasUnresolvedIssue: 'true' } : {}),
  ...(state.value ? { state: state.value } : {}),
});
const reason = ref(''),
  progress = ref(''),
  channel = ref(''),
  evidence = ref('');
let generation = 0;
const date = (v: string | null) =>
  v
    ? new Intl.DateTimeFormat(locale.value, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Shanghai',
      }).format(new Date(v))
    : '—';
const money = (cents: number) =>
  new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'CNY' }).format(cents / 100);
const planName = (plan: UpgradeUpgrade['targetPlan']) =>
  plan.tier ? t(`zerocut.membership.tiers.${plan.tier}`) : plan.code;
const planMode = (plan: UpgradeUpgrade['targetPlan']) =>
  plan.purchaseMode
    ? t(
        `zerocut.membership.cycles.${plan.purchaseMode === 'auto_monthly' ? 'monthly' : plan.purchaseMode}`
      )
    : '';
function tone(value: string) {
  if (['COMPLETED', 'confirmed', 'zero_settled', 'committed', 'ready', 'resolved'].includes(value))
    return 'is-success';
  if (['FAILED', 'failed'].includes(value)) return 'is-danger';
  if (
    ['MANUAL_REVIEW', 'PAYMENT_UNKNOWN', 'REFUND_PENDING', 'unknown', 'frozen', 'review'].includes(
      value
    )
  )
    return 'is-warning';
  if (['ABANDONED', 'REFUNDED', 'none', 'terminated', 'not_applicable'].includes(value))
    return 'is-neutral';
  return 'is-info';
}
async function run(work: () => Promise<void>) {
  if (busy.value) return;
  const v = generation;
  busy.value = true;
  error.value = '';
  try {
    await work();
  } catch (e) {
    if (v === generation)
      error.value = e instanceof Error ? e.message : t('membershipUpgrade.error');
  } finally {
    if (v === generation) busy.value = false;
  }
}
async function load(more = false) {
  const v = generation;
  await run(async () => {
    const r = await api.list({
      ...(more && cursor.value ? { cursor: cursor.value } : {}),
      ...filters(),
    });
    if (v !== generation) return;
    items.value = more ? [...items.value, ...r.items] : r.items;
    cursor.value = r.nextCursor;
  });
}
async function open(id: string) {
  const v = generation;
  await run(async () => {
    const r = await api.detail(id);
    if (v === generation) {
      detail.value = r;
      selectedOrder.value = '';
      offlineResolution.value = undefined;
      resolutionEvidence.value = '';
    }
  });
}
async function moreAudit() {
  if (!detail.value?.auditNextCursor) return;
  const v = generation;
  const d = detail.value;
  const auditCursor = d.auditNextCursor;
  if (!auditCursor) return;
  await run(async () => {
    const r = await api.detail(d.upgrade.id, auditCursor);
    if (v === generation && detail.value?.upgrade.id === d.upgrade.id)
      detail.value = { ...r, auditEvents: [...d.auditEvents, ...r.auditEvents] };
  });
}
async function act(action: UpgradeAdminAction['action']) {
  const id = detail.value?.upgrade.id;
  if (!id || !reason.value.trim()) return;
  const v = generation;
  await run(async () => {
    const body: UpgradeAdminAction = {
      action,
      reason: reason.value,
      ...(selectedOrder.value ? { orderId: selectedOrder.value } : {}),
      ...(action === 'record_progress' && offlineResolution.value
        ? { resolution: offlineResolution.value, resolutionEvidence: resolutionEvidence.value }
        : {}),
      ...(progress.value ? { userVisibleProgress: progress.value } : {}),
      ...(channel.value ? { notificationChannel: channel.value } : {}),
      ...(evidence.value ? { notificationEvidence: evidence.value } : {}),
    };
    const name = `upgrade-admin:${id}:${JSON.stringify(body)}`,
      key = sessionStorage.getItem(name) ?? window.crypto.randomUUID();
    sessionStorage.setItem(name, key);
    await api.action(id, body, key);
    const updated = await api.detail(id);
    if (v !== generation) return;
    detail.value = updated;
    sessionStorage.removeItem(name);
    const r = await api.list(filters());
    if (v !== generation) return;
    items.value = r.items;
    cursor.value = r.nextCursor;
  });
}
watch(
  () => [visible.value, props.accountId, state.value, unresolvedOnly.value],
  () => {
    generation++;
    busy.value = false;
    items.value = [];
    detail.value = null;
    selectedOrder.value = '';
    offlineResolution.value = undefined;
    resolutionEvidence.value = '';
    if (visible.value) void load();
  },
  { immediate: true }
);
</script>
<template>
  <section v-if="visible" class="upgrade-admin" :aria-label="t('membershipUpgrade.adminTitle')">
    <header class="queue-header">
      <div class="queue-heading">
        <span class="queue-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
            <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
            <path d="m4 7.5 8 4.5 8-4.5M12 12v9m-3-5 3-3 3 3" />
          </svg>
        </span>
        <div>
          <h2>{{ t('membershipUpgrade.adminTitle') }}</h2>
          <p>{{ t('membershipUpgrade.queueDescription') }}</p>
        </div>
      </div>
      <button class="queue-button" :disabled="busy" @click="load()">
        <svg
          class="refresh-icon"
          :class="{ 'is-loading': busy }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          aria-hidden="true"
        >
          <path d="M20 11a8 8 0 1 0-2 6M20 4v7h-7" />
        </svg>
        {{ t('membershipUpgrade.refresh') }}
      </button>
    </header>

    <div class="queue-toolbar">
      <label class="queue-filter">
        <span>{{ t('membershipUpgrade.stateFilter') }}</span>
        <select v-model="state" :aria-label="t('membershipUpgrade.stateFilter')">
          <option value="">{{ t('membershipUpgrade.allStates') }}</option>
          <option v-for="s in states" :key="s" :value="s">
            {{ t(`membershipUpgrade.states.${s}`) }}
          </option>
        </select>
      </label>
      <label class="queue-toggle">
        <input v-model="unresolvedOnly" type="checkbox" />
        <span>{{ t('membershipUpgrade.unresolvedOnly') }}</span>
      </label>
    </div>
    <p v-if="error" class="queue-message is-error" role="alert">{{ error }}</p>

    <div class="queue-layout" :aria-busy="busy">
      <aside class="queue-list-pane">
        <div class="section-heading">
          <h3>{{ t('membershipUpgrade.queueRecords') }}</h3>
          <span class="record-count">{{ items.length }}</span>
        </div>
        <p v-if="!items.length" class="queue-empty" role="status">
          {{ t(busy ? 'membershipUpgrade.queueLoading' : 'membershipUpgrade.queueEmpty') }}
        </p>
        <ul v-else class="queue-list">
          <li v-for="item in items" :key="item.upgrade.id">
            <button
              class="queue-record"
              :class="{ 'is-selected': detail?.upgrade.id === item.upgrade.id }"
              :aria-pressed="detail?.upgrade.id === item.upgrade.id"
              :disabled="busy"
              @click="open(item.upgrade.id)"
            >
              <div class="record-topline">
                <strong>{{ planName(item.upgrade.targetPlan) }}</strong>
                <span class="status-badge" :class="tone(item.upgrade.state)">{{
                  t(`membershipUpgrade.states.${item.upgrade.state}`)
                }}</span>
              </div>
              <div class="record-plan">
                {{ planMode(item.upgrade.targetPlan)
                }}<span>{{ money(item.upgrade.payment.amountCents) }}</span>
              </div>
              <dl class="record-meta">
                <div>
                  <dt>{{ t('membershipUpgrade.account') }}</dt>
                  <dd>#{{ item.accountId }}</dd>
                </div>
                <div>
                  <dt>{{ t('membershipUpgrade.owner') }}</dt>
                  <dd>{{ item.caseOwner?.displayName ?? '—' }}</dd>
                </div>
                <div class="record-deadline">
                  <dt>{{ t('membershipUpgrade.deadline') }}</dt>
                  <dd>{{ date(item.upgrade.support.userUpdateDueAt) }}</dd>
                </div>
              </dl>
              <span v-if="item.unresolvedOrderCount" class="record-issue"
                >{{ t('membershipUpgrade.unresolvedOrders') }} ·
                {{ item.unresolvedOrderCount }}</span
              >
            </button>
          </li>
        </ul>
        <button
          v-if="cursor"
          class="queue-button queue-load-more"
          :disabled="busy"
          @click="load(true)"
        >
          {{ t('membershipUpgrade.more') }}
        </button>
      </aside>

      <article v-if="detail" class="queue-detail">
        <header class="detail-header">
          <div>
            <div class="detail-title">
              <h3>{{ planName(detail.upgrade.targetPlan) }}</h3>
              <span class="status-badge" :class="tone(detail.upgrade.state)">{{
                t(`membershipUpgrade.states.${detail.upgrade.state}`)
              }}</span>
            </div>
            <p class="detail-plan">
              {{ planMode(detail.upgrade.targetPlan) }} · {{ t('membershipUpgrade.account') }} #{{
                detail.accountId
              }}
              · {{ t('membershipUpgrade.owner') }}: {{ detail.caseOwner?.displayName ?? '—' }}
            </p>
          </div>
          <div class="detail-price">
            <span>{{ t('membershipUpgrade.price') }}</span
            ><strong>{{ money(detail.upgrade.payment.amountCents) }}</strong>
          </div>
        </header>
        <div class="detail-reference">
          <span>{{ t('membershipUpgrade.operationId') }}</span
          ><code>{{ detail.upgrade.id }}</code>
        </div>

        <dl class="detail-status-grid">
          <div>
            <dt>{{ t('membershipUpgrade.paymentStatus') }}</dt>
            <dd>
              <span class="status-dot" :class="tone(detail.upgrade.payment.state)" />{{
                t(`membershipUpgrade.substates.${detail.upgrade.payment.state}`)
              }}
            </dd>
          </div>
          <div>
            <dt>{{ t('membershipUpgrade.deliveryStatus') }}</dt>
            <dd>
              <span class="status-dot" :class="tone(detail.upgrade.fulfillment.state)" />{{
                t(`membershipUpgrade.substates.${detail.upgrade.fulfillment.state}`)
              }}
            </dd>
          </div>
          <div>
            <dt>{{ t('membershipUpgrade.renewalStatus') }}</dt>
            <dd>{{ t(`membershipUpgrade.substates.${detail.upgrade.renewal.state}`) }}</dd>
          </div>
          <div>
            <dt>{{ t('membershipUpgrade.refundStatus') }}</dt>
            <dd>{{ t(`membershipUpgrade.substates.${detail.upgrade.refund.state}`) }}</dd>
          </div>
          <div>
            <dt>{{ t('membershipUpgrade.manualDeadline') }}</dt>
            <dd>{{ date(detail.upgrade.support.manualReviewAt) }}</dd>
          </div>
          <div>
            <dt>{{ t('membershipUpgrade.deadline') }}</dt>
            <dd>{{ date(detail.upgrade.support.userUpdateDueAt) }}</dd>
          </div>
        </dl>

        <section v-if="detail.renewalIssues?.length" class="detail-section">
          <div class="section-heading">
            <h4>{{ t('membershipUpgrade.renewalIssues') }}</h4>
            <span class="record-count">{{ detail.renewalIssues.length }}</span>
          </div>
          <ul class="issue-list">
            <li v-for="issue in detail.renewalIssues" :key="issue.orderId" class="issue-card">
              <div class="issue-header">
                <code>{{ issue.orderNo }}</code
                ><span class="status-badge" :class="tone(issue.state)">{{
                  t(`membershipUpgrade.issueStates.${issue.state}`)
                }}</span>
              </div>
              <p class="issue-period">
                {{ date(issue.periodStartAt) }} — {{ date(issue.periodEndAt) }}
              </p>
              <p v-if="issue.errorCode" class="issue-code">{{ issue.errorCode }}</p>
              <dl class="issue-deadlines">
                <div>
                  <dt>{{ t('membershipUpgrade.manualDeadline') }}</dt>
                  <dd>{{ date(issue.manualReviewAt) }}</dd>
                </div>
                <div>
                  <dt>{{ t('membershipUpgrade.deadline') }}</dt>
                  <dd>{{ date(issue.userUpdateDueAt) }}</dd>
                </div>
              </dl>
            </li>
          </ul>
        </section>

        <form
          v-if="user.hasPermission(Permission.WALLET_GRANT)"
          class="detail-section processing-form"
          @submit.prevent
        >
          <div class="section-heading">
            <h4>{{ t('membershipUpgrade.processingDetails') }}</h4>
          </div>
          <div class="form-grid">
            <label class="form-field"
              ><span
                >{{ t('membershipUpgrade.reason') }}
                <span class="required-mark" aria-hidden="true">*</span></span
              ><textarea v-model="reason" required maxlength="500" rows="3" />
            </label>
            <label class="form-field"
              ><span>{{ t('membershipUpgrade.progress') }}</span
              ><textarea v-model="progress" maxlength="2000" rows="3" />
            </label>
          </div>
          <fieldset v-if="detail.renewalIssues?.length" class="form-group">
            <legend>{{ t('membershipUpgrade.orderHandling') }}</legend>
            <div class="form-grid">
              <label class="form-field"
                ><span>{{ t('membershipUpgrade.relatedOrder') }}</span
                ><select v-model="selectedOrder" :aria-label="t('membershipUpgrade.relatedOrder')">
                  <option value="">{{ t('membershipUpgrade.chooseOrder') }}</option>
                  <option
                    v-for="issue in detail.renewalIssues"
                    :key="issue.orderId"
                    :value="issue.orderId"
                  >
                    {{ issue.orderNo }}
                  </option>
                </select></label
              >
              <label v-if="selectedOrder" class="form-field"
                ><span>{{ t('membershipUpgrade.offlineResolution') }}</span
                ><select
                  v-model="offlineResolution"
                  :aria-label="t('membershipUpgrade.offlineResolution')"
                >
                  <option :value="undefined">—</option>
                  <option value="compensated_offline">
                    {{ t('membershipUpgrade.compensatedOffline') }}
                  </option>
                  <option value="refunded_offline">
                    {{ t('membershipUpgrade.refundedOffline') }}
                  </option>
                </select></label
              >
              <label v-if="selectedOrder && offlineResolution" class="form-field full-width"
                ><span>{{ t('membershipUpgrade.resolutionEvidence') }}</span
                ><input v-model="resolutionEvidence" maxlength="500"
              /></label>
            </div>
          </fieldset>
          <fieldset class="form-group">
            <legend>{{ t('membershipUpgrade.notificationRecord') }}</legend>
            <p class="field-hint">{{ t('membershipUpgrade.notificationHint') }}</p>
            <div class="form-grid">
              <label class="form-field"
                ><span>{{ t('membershipUpgrade.channel') }}</span
                ><input v-model="channel" maxlength="80"
              /></label>
              <label class="form-field"
                ><span>{{ t('membershipUpgrade.evidence') }}</span
                ><input v-model="evidence" maxlength="500"
              /></label>
            </div>
          </fieldset>
          <p
            v-if="detail.allowedAdminActions.includes('refund_undelivered')"
            class="queue-message is-warning"
          >
            {{ t('membershipUpgrade.refundHint') }}
          </p>
          <div class="form-actions">
            <button
              v-for="action in detail.allowedAdminActions"
              :key="action"
              class="queue-button"
              :class="{
                'is-primary': action === 'record_progress',
                'is-danger': action === 'refund_undelivered',
              }"
              :disabled="
                busy ||
                (action === 'reconcile_order' && !selectedOrder) ||
                (action === 'record_progress' &&
                  Boolean(offlineResolution) &&
                  (!selectedOrder || !resolutionEvidence.trim())) ||
                !reason.trim() ||
                Boolean(channel) !== Boolean(evidence) ||
                (Boolean(channel) && !progress)
              "
              @click="act(action)"
            >
              {{ t(`membershipUpgrade.${action}`) }}
            </button>
          </div>
        </form>

        <section class="detail-section">
          <div class="section-heading">
            <h4>{{ t('membershipUpgrade.audit') }}</h4>
            <span class="record-count">{{ detail.auditEvents.length }}</span>
          </div>
          <p v-if="!detail.auditEvents.length" class="field-hint audit-empty">
            {{ t('membershipUpgrade.auditEmpty') }}
          </p>
          <ol v-else class="audit-timeline">
            <li v-for="e in detail.auditEvents" :key="e.id">
              <div class="audit-heading">
                <strong>{{ e.actor.displayName ?? e.actor.userId ?? e.actor.kind }}</strong
                ><time :datetime="e.occurredAt">{{ date(e.occurredAt) }}</time>
              </div>
              <code class="audit-event">{{ e.eventType }}</code>
              <p v-if="e.reason">{{ e.reason }}</p>
              <p v-if="e.resolution || e.evidenceSummary" class="audit-evidence">
                {{ e.resolution }} {{ e.evidenceSummary }}
              </p>
              <p v-if="e.userVisibleProgress" class="audit-progress">{{ e.userVisibleProgress }}</p>
              <div v-if="e.notification" class="audit-notification">
                <span
                  >{{ t('membershipUpgrade.notificationRecord') }} · {{ e.notification.channel }} ·
                  {{ date(e.notification.deliveredAt) }}</span
                >
                <p>{{ e.notification.evidenceSummary }}</p>
              </div>
            </li>
          </ol>
          <button
            v-if="detail.auditNextCursor"
            class="queue-button queue-load-more"
            :disabled="busy"
            @click="moreAudit"
          >
            {{ t('membershipUpgrade.more') }}
          </button>
        </section>
        <footer class="detail-footer">{{ t('membershipUpgrade.timezone') }}</footer>
      </article>
      <div v-else class="detail-placeholder" role="status">
        <span class="placeholder-icon" aria-hidden="true">↗</span>
        <h3>{{ t('membershipUpgrade.selectRecord') }}</h3>
        <p>{{ t('membershipUpgrade.selectRecordHint') }}</p>
      </div>
    </div>
  </section>
</template>
<style scoped>
.upgrade-admin {
  --queue-primary: rgb(var(--v-theme-primary, 112, 92, 246));
  --queue-ink: rgb(var(--v-theme-on-surface, 31, 41, 55));
  --queue-muted: rgba(var(--v-theme-on-surface, 31, 41, 55), 0.62);
  --queue-border: rgba(var(--v-theme-on-surface, 31, 41, 55), 0.12);
  --queue-soft: rgba(var(--v-theme-on-surface, 31, 41, 55), 0.025);
  container: membershipQueue / inline-size;
  color: var(--queue-ink);
  background: rgb(var(--v-theme-surface, 255, 255, 255));
  border: 1px solid var(--queue-border);
  border-radius: 16px;
  margin: 24px 0;
  overflow: hidden;
  font-size: 14px;
  line-height: 1.5;
}
.upgrade-admin *,
.upgrade-admin *::before,
.upgrade-admin *::after {
  box-sizing: border-box;
}
.upgrade-admin h2,
.upgrade-admin h3,
.upgrade-admin h4,
.upgrade-admin p,
.upgrade-admin dl,
.upgrade-admin dd,
.upgrade-admin ul,
.upgrade-admin ol {
  margin: 0;
}
.upgrade-admin ul,
.upgrade-admin ol {
  padding: 0;
  list-style: none;
}
.upgrade-admin button,
.upgrade-admin input,
.upgrade-admin select,
.upgrade-admin textarea {
  font: inherit;
}
.upgrade-admin button {
  cursor: pointer;
}
.upgrade-admin button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.upgrade-admin :is(button, input, select, textarea):focus-visible {
  outline: 3px solid rgba(var(--v-theme-primary, 112, 92, 246), 0.35);
  outline-offset: 3px;
}
.queue-header {
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.queue-heading {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}
.queue-heading h2 {
  font-size: 19px;
  font-weight: 650;
}
.queue-heading p {
  margin-top: 4px;
  color: var(--queue-muted);
  font-size: 13px;
}
.queue-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 12px;
  color: var(--queue-primary);
  background: rgba(var(--v-theme-primary, 112, 92, 246), 0.09);
}
.queue-icon svg {
  width: 25px;
  height: 25px;
}
.queue-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 9px 15px;
  border: 1px solid var(--queue-border);
  border-radius: 9px;
  color: var(--queue-ink);
  background: rgb(var(--v-theme-surface, 255, 255, 255));
  font-size: 13px;
  font-weight: 550;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.queue-button:not(:disabled):hover {
  background: var(--queue-soft);
  border-color: var(--queue-primary);
}
.queue-button.is-primary {
  color: rgb(var(--v-theme-on-primary, 255, 255, 255));
  background: var(--queue-primary);
  border-color: var(--queue-primary);
}
.queue-button.is-primary:not(:disabled):hover {
  filter: brightness(0.94);
  background: var(--queue-primary);
}
.queue-button.is-danger {
  color: rgb(var(--v-theme-error, 190, 48, 59));
  border-color: rgba(var(--v-theme-error, 190, 48, 59), 0.3);
}
.refresh-icon {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
}
.is-loading {
  animation: queue-spin 1.1s linear infinite;
}
@keyframes queue-spin {
  to {
    transform: rotate(360deg);
  }
}
.queue-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  padding: 16px 24px;
  background: var(--queue-soft);
  border-top: 1px solid var(--queue-border);
  border-bottom: 1px solid var(--queue-border);
}
.queue-filter {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: var(--queue-muted);
}
.queue-filter select {
  min-width: 210px;
}
.queue-toggle {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
}
.queue-toggle input {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  accent-color: var(--queue-primary);
}
.upgrade-admin select,
.form-field input,
.form-field textarea {
  padding: 10px 12px;
  min-height: 42px;
  border: 1px solid var(--queue-border);
  border-radius: 8px;
  background: rgb(var(--v-theme-surface, 255, 255, 255));
  color: var(--queue-ink);
}
.upgrade-admin select {
  appearance: auto;
  padding-right: 30px;
  cursor: pointer;
}
.upgrade-admin select option {
  background: rgb(var(--v-theme-surface, 255, 255, 255));
  color: var(--queue-ink);
}
.queue-layout {
  display: grid;
  grid-template-columns: minmax(270px, 0.9fr) minmax(0, 2fr);
}
.queue-list-pane {
  padding: 20px 16px;
  background: var(--queue-soft);
  border-right: 1px solid var(--queue-border);
  min-width: 0;
}
.section-heading {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 16px;
}
.section-heading :is(h3, h4) {
  font-size: 14px;
  font-weight: 650;
}
.record-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface, 31, 41, 55), 0.07);
  color: var(--queue-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.queue-list {
  display: grid;
  gap: 10px;
}
.queue-record {
  display: block;
  width: 100%;
  padding: 16px;
  text-align: left;
  color: var(--queue-ink);
  border: 1px solid var(--queue-border);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface, 255, 255, 255));
  transition:
    border-color 0.15s,
    background 0.15s;
}
.queue-record:not(:disabled):hover {
  border-color: rgba(var(--v-theme-primary, 112, 92, 246), 0.45);
}
.queue-record.is-selected {
  border-color: var(--queue-primary);
  background: rgba(var(--v-theme-primary, 112, 92, 246), 0.05);
  box-shadow: inset 3px 0 var(--queue-primary);
}
.record-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.record-topline strong {
  font-size: 15px;
}
.record-plan {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 7px;
  font-size: 12px;
  color: var(--queue-muted);
}
.record-plan > span {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.record-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding-top: 14px;
  margin-top: 14px !important;
  border-top: 1px solid var(--queue-border);
}
.record-meta dt {
  color: var(--queue-muted);
  font-size: 11px;
}
.record-meta dd {
  margin-top: 3px;
  font-size: 12px;
  overflow-wrap: anywhere;
}
.record-deadline {
  grid-column: 1 / -1;
}
.record-issue {
  display: inline-block;
  margin-top: 12px;
  color: rgb(var(--v-theme-warning, 147, 94, 9));
  font-size: 12px;
  font-weight: 550;
}
.status-badge {
  --status-color: var(--queue-primary);
  --status-bg: rgba(var(--v-theme-primary, 112, 92, 246), 0.09);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  border-radius: 6px;
  padding: 4px 8px;
  color: var(--status-color);
  background: var(--status-bg);
  font-size: 11px;
  font-weight: 550;
  overflow-wrap: anywhere;
}
.status-badge.is-success,
.status-dot.is-success {
  --status-color: rgb(var(--v-theme-success, 31, 136, 89));
  --status-bg: rgba(var(--v-theme-success, 31, 136, 89), 0.1);
}
.status-badge.is-warning,
.status-dot.is-warning {
  --status-color: color-mix(in srgb, rgb(var(--v-theme-warning, 147, 94, 9)) 80%, var(--queue-ink));
  --status-bg: rgba(var(--v-theme-warning, 147, 94, 9), 0.12);
}
.status-badge.is-danger,
.status-dot.is-danger {
  --status-color: rgb(var(--v-theme-error, 190, 48, 59));
  --status-bg: rgba(var(--v-theme-error, 190, 48, 59), 0.1);
}
.status-badge.is-neutral,
.status-dot.is-neutral {
  --status-color: var(--queue-muted);
  --status-bg: rgba(var(--v-theme-on-surface, 31, 41, 55), 0.06);
}
.status-dot {
  width: 7px;
  height: 7px;
  display: inline-block;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--status-color, var(--queue-primary));
}
.queue-load-more {
  width: 100%;
  margin-top: 16px;
}
.queue-empty {
  padding: 32px 8px;
  text-align: center;
  color: var(--queue-muted);
  font-size: 13px;
}
.queue-detail {
  min-width: 0;
  padding: 24px;
}
.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}
.detail-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.detail-title h3 {
  font-size: 20px;
  font-weight: 650;
}
.detail-plan {
  color: var(--queue-muted);
  font-size: 12px;
  margin-top: 7px !important;
}
.detail-price {
  flex-shrink: 0;
  text-align: right;
}
.detail-price span {
  display: block;
  font-size: 12px;
  color: var(--queue-muted);
}
.detail-price strong {
  display: block;
  margin-top: 3px;
  font-size: 25px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}
.detail-reference {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  padding: 9px 12px;
  background: var(--queue-soft);
  border-radius: 8px;
  font-size: 11px;
  color: var(--queue-muted);
}
.detail-reference > span {
  flex-shrink: 0;
}
.upgrade-admin code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  overflow-wrap: anywhere;
}
.detail-status-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  margin-top: 20px !important;
  border: 1px solid var(--queue-border);
  border-radius: 10px;
  overflow: hidden;
  background: var(--queue-border);
}
.detail-status-grid > div {
  min-width: 0;
  padding: 14px;
  background: rgb(var(--v-theme-surface, 255, 255, 255));
}
.detail-status-grid dt,
.issue-deadlines dt {
  font-size: 11px;
  color: var(--queue-muted);
}
.detail-status-grid dd {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 6px;
  font-size: 12px;
  font-weight: 550;
  overflow-wrap: anywhere;
}
.detail-section {
  padding-top: 24px;
  margin-top: 24px;
  border-top: 1px solid var(--queue-border);
}
.issue-list {
  display: grid;
  gap: 10px;
}
.issue-card {
  padding: 14px;
  border: 1px solid var(--queue-border);
  border-radius: 10px;
}
.issue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.issue-period {
  margin-top: 8px !important;
  font-size: 12px;
  color: var(--queue-muted);
}
.issue-code {
  display: inline-block;
  margin-top: 9px !important;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--queue-muted);
  background: var(--queue-soft);
  border-radius: 4px;
  padding: 3px 6px;
  overflow-wrap: anywhere;
}
.issue-deadlines {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 12px !important;
}
.issue-deadlines dd {
  margin-top: 4px;
  font-size: 12px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.form-field {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 8px;
  font-size: 12px;
  font-weight: 550;
}
.form-field :is(input, textarea, select) {
  width: 100%;
  min-width: 0;
  font-weight: 400;
  font-size: 13px;
  transition: border-color 0.15s;
}
.form-field textarea {
  resize: vertical;
  min-height: 96px;
}
.form-field :is(input, textarea, select):focus {
  border-color: var(--queue-primary);
}
.required-mark {
  color: rgb(var(--v-theme-error, 190, 48, 59));
}
.form-group {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--queue-border);
  border-radius: 10px;
  margin-top: 22px;
}
.form-group legend {
  padding: 0 6px;
  font-size: 12px;
  font-weight: 600;
}
.field-hint {
  color: var(--queue-muted);
  font-size: 12px;
  line-height: 1.7;
}
.form-group .field-hint {
  margin-bottom: 12px;
}
.full-width {
  grid-column: 1 / -1;
}
.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}
.queue-message {
  padding: 12px 16px;
  margin: 16px 24px !important;
  border-radius: 9px;
  font-size: 12px;
  line-height: 1.7;
}
.queue-message.is-error {
  color: rgb(var(--v-theme-error, 190, 48, 59));
  background: rgba(var(--v-theme-error, 190, 48, 59), 0.08);
}
.queue-message.is-warning {
  color: var(--queue-muted);
  background: rgba(var(--v-theme-warning, 147, 94, 9), 0.08);
}
.processing-form .queue-message {
  margin: 16px 0 0 !important;
}
.audit-empty {
  padding: 8px 0;
}
.audit-timeline {
  margin-left: 5px !important;
}
.audit-timeline li {
  position: relative;
  padding: 0 0 22px 22px;
  border-left: 1px solid var(--queue-border);
}
.audit-timeline li::before {
  content: '';
  position: absolute;
  top: 5px;
  left: -4px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--queue-primary);
  box-shadow: 0 0 0 4px rgb(var(--v-theme-surface, 255, 255, 255));
}
.audit-timeline li:last-child {
  border-color: transparent;
  padding-bottom: 0;
}
.audit-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
}
.audit-heading time {
  color: var(--queue-muted);
  font-size: 11px;
}
.audit-event {
  display: inline-block;
  color: var(--queue-muted);
  margin-top: 5px;
}
.audit-timeline p {
  margin-top: 7px;
  font-size: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.audit-evidence {
  color: var(--queue-muted);
}
.audit-progress {
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--queue-soft);
}
.audit-notification {
  margin-top: 10px;
  font-size: 11px;
  color: var(--queue-muted);
}
.detail-footer {
  padding-top: 20px;
  margin-top: 24px;
  border-top: 1px solid var(--queue-border);
  color: var(--queue-muted);
  font-size: 11px;
}
.detail-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 10px;
  min-height: 340px;
  padding: 32px;
}
.placeholder-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  color: var(--queue-primary);
  background: rgba(var(--v-theme-primary, 112, 92, 246), 0.07);
  font-size: 27px;
}
.detail-placeholder h3 {
  font-size: 15px;
  font-weight: 600;
}
.detail-placeholder p {
  color: var(--queue-muted);
  font-size: 13px;
}
@container membershipQueue (max-width: 980px) {
  .queue-layout {
    grid-template-columns: 1fr;
  }
  .queue-list-pane {
    border-right: 0;
    border-bottom: 1px solid var(--queue-border);
  }
  .queue-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@container membershipQueue (max-width: 600px) {
  .queue-header {
    align-items: flex-start;
    padding: 18px 16px;
    gap: 12px;
  }
  .queue-icon {
    display: none;
  }
  .queue-heading h2 {
    font-size: 17px;
  }
  .queue-header .queue-button {
    padding: 9px 11px;
    flex-shrink: 0;
  }
  .queue-toolbar {
    padding: 14px 16px;
    gap: 14px;
  }
  .queue-filter {
    width: 100%;
    justify-content: space-between;
  }
  .queue-filter select {
    min-width: 0;
    width: 65%;
  }
  .queue-list {
    grid-template-columns: 1fr;
  }
  .queue-detail {
    padding: 20px 16px;
  }
  .detail-header {
    flex-wrap: wrap;
    gap: 14px;
  }
  .detail-price {
    text-align: left;
  }
  .detail-price strong {
    font-size: 23px;
  }
  .detail-title h3 {
    font-size: 18px;
  }
  .detail-reference {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
  .detail-status-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .detail-status-grid > div {
    padding: 12px;
  }
  .form-grid,
  .issue-deadlines {
    grid-template-columns: 1fr;
  }
  .form-group {
    padding: 12px;
  }
  .form-actions {
    flex-direction: column;
  }
  .form-actions .queue-button {
    width: 100%;
  }
  .issue-header {
    align-items: flex-start;
  }
  .queue-message {
    margin: 16px !important;
  }
}
@media (prefers-reduced-motion: reduce) {
  .is-loading {
    animation: none;
  }
}
</style>
