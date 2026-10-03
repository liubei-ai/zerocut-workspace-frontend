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
  <section v-if="visible" class="upgrade-admin">
    <h2>{{ t('membershipUpgrade.adminTitle') }}</h2>
    <label
      >{{ t('membershipUpgrade.stateFilter')
      }}<select v-model="state">
        <option value="">{{ t('membershipUpgrade.allStates') }}</option>
        <option v-for="s in states" :key="s" :value="s">
          {{ t(`membershipUpgrade.states.${s}`) }}
        </option>
      </select></label
    >
    <label
      ><input v-model="unresolvedOnly" type="checkbox" />{{
        t('membershipUpgrade.unresolvedOnly')
      }}</label
    >
    <button :disabled="busy" @click="load()">{{ t('membershipUpgrade.refresh') }}</button>
    <p v-if="error" role="alert">{{ error }}</p>
    <ul>
      <li v-for="item in items" :key="item.upgrade.id">
        <button @click="open(item.upgrade.id)">
          {{ item.accountId }} · {{ item.upgrade.targetPlan.code }} ·
          {{ t(`membershipUpgrade.states.${item.upgrade.state}`) }}
        </button>
        <span v-if="item.unresolvedOrderCount">
          · {{ t('membershipUpgrade.unresolvedOrders') }}: {{ item.unresolvedOrderCount }}</span
        >
        · {{ t('membershipUpgrade.owner') }}: {{ item.caseOwner?.displayName ?? '—' }} ·
        {{ date(item.upgrade.support.userUpdateDueAt) }}
      </li>
    </ul>
    <button v-if="cursor" :disabled="busy" @click="load(true)">
      {{ t('membershipUpgrade.more') }}
    </button>
    <article v-if="detail">
      <h3>{{ detail.upgrade.id }}</h3>
      <p>
        {{ t(`membershipUpgrade.states.${detail.upgrade.state}`) }} ·
        {{
          new Intl.NumberFormat(locale, { style: 'currency', currency: 'CNY' }).format(
            detail.upgrade.payment.amountCents / 100
          )
        }}
      </p>
      <dl>
        <dt>{{ t('membershipUpgrade.paymentStatus') }}</dt>
        <dd>{{ t(`membershipUpgrade.substates.${detail.upgrade.payment.state}`) }}</dd>
        <dt>{{ t('membershipUpgrade.newCredits') }}</dt>
        <dd>{{ t(`membershipUpgrade.substates.${detail.upgrade.fulfillment.state}`) }}</dd>
        <dt>{{ t('membershipUpgrade.renewal') }}</dt>
        <dd>{{ t(`membershipUpgrade.substates.${detail.upgrade.renewal.state}`) }}</dd>
        <dt>{{ t('membershipUpgrade.refundStatus') }}</dt>
        <dd>{{ t(`membershipUpgrade.substates.${detail.upgrade.refund.state}`) }}</dd>
        <dt>{{ t('membershipUpgrade.manualDeadline') }}</dt>
        <dd>{{ date(detail.upgrade.support.manualReviewAt) }}</dd>
        <dt>{{ t('membershipUpgrade.deadline') }}</dt>
        <dd>{{ date(detail.upgrade.support.userUpdateDueAt) }}</dd>
      </dl>
      <h4 v-if="detail.renewalIssues?.length">{{ t('membershipUpgrade.renewalIssues') }}</h4>
      <ul>
        <li v-for="issue in detail.renewalIssues ?? []" :key="issue.orderId">
          {{ issue.orderNo }} · {{ date(issue.periodStartAt) }} — {{ date(issue.periodEndAt) }} ·
          {{ issue.errorCode }} · {{ t(`membershipUpgrade.issueStates.${issue.state}`) }}
          <p>
            {{ t('membershipUpgrade.manualDeadline') }}: {{ date(issue.manualReviewAt) }} ·
            {{ t('membershipUpgrade.deadline') }}: {{ date(issue.userUpdateDueAt) }}
          </p>
        </li>
      </ul>
      <form v-if="user.hasPermission(Permission.WALLET_GRANT)" @submit.prevent>
        <label
          >{{ t('membershipUpgrade.reason')
          }}<textarea v-model="reason" required maxlength="500" /></label
        ><label
          >{{ t('membershipUpgrade.progress') }}<textarea v-model="progress" maxlength="2000" />
        </label>
        <label v-if="detail.renewalIssues?.length"
          >{{ t('membershipUpgrade.relatedOrder') }}
          <select v-model="selectedOrder">
            <option value="">—</option>
            <option
              v-for="issue in detail.renewalIssues"
              :key="issue.orderId"
              :value="issue.orderId"
            >
              {{ issue.orderNo }}
            </option>
          </select>
        </label>
        <label v-if="selectedOrder"
          >{{ t('membershipUpgrade.offlineResolution')
          }}<select v-model="offlineResolution">
            <option :value="undefined">—</option>
            <option value="compensated_offline">
              {{ t('membershipUpgrade.compensatedOffline') }}
            </option>
            <option value="refunded_offline">{{ t('membershipUpgrade.refundedOffline') }}</option>
          </select></label
        >
        <label v-if="selectedOrder && offlineResolution"
          >{{ t('membershipUpgrade.resolutionEvidence')
          }}<input v-model="resolutionEvidence" maxlength="500"
        /></label>
        <p>{{ t('membershipUpgrade.notificationHint') }}</p>
        <label>{{ t('membershipUpgrade.channel') }}<input v-model="channel" maxlength="80" /></label
        ><label
          >{{ t('membershipUpgrade.evidence') }}<input v-model="evidence" maxlength="500"
        /></label>
        <p>{{ t('membershipUpgrade.refundHint') }}</p>
        <button
          v-for="action in detail.allowedAdminActions"
          :key="action"
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
      </form>
      <h4>{{ t('membershipUpgrade.audit') }}</h4>
      <ol>
        <li v-for="e in detail.auditEvents" :key="e.id">
          {{ date(e.occurredAt) }} · {{ e.eventType }} ·
          {{ e.actor.displayName ?? e.actor.userId ?? e.actor.kind }}
          <p>{{ e.reason }} {{ e.resolution }} {{ e.evidenceSummary }}</p>
          <p>{{ e.userVisibleProgress }}</p>
          <p v-if="e.notification">
            {{ e.notification.channel }} · {{ date(e.notification.deliveredAt) }} ·
            {{ e.notification.evidenceSummary }}
          </p>
        </li>
      </ol>
      <button v-if="detail.auditNextCursor" :disabled="busy" @click="moreAudit">
        {{ t('membershipUpgrade.more') }}
      </button>
    </article>
  </section>
</template>
<style scoped>
.upgrade-admin {
  padding: 1rem;
  border: 1px solid #7776;
  border-radius: 8px;
  margin: 1rem 0;
}
.upgrade-admin label {
  display: block;
  margin: 0.5rem 0;
}
.upgrade-admin input,
.upgrade-admin textarea {
  display: block;
  border: 1px solid #777;
  border-radius: 4px;
  padding: 0.5rem;
  max-width: 100%;
  width: 32rem;
}
.upgrade-admin button {
  border: 1px solid #888;
  border-radius: 4px;
  padding: 0.4rem 0.8rem;
  margin: 0.3rem;
}
.upgrade-admin button:disabled {
  opacity: 0.5;
}
.upgrade-admin dd {
  margin-bottom: 0.5rem;
}
</style>
