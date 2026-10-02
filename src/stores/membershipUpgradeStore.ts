import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import {
  membershipUpgradeApi,
  type UpgradeOptions,
  type UpgradeQuote,
  type UpgradeUpgrade,
  type UpgradeContinueRequest,
} from '@/api/membershipUpgradeApi';
import { isWeiXin } from '@/utils/wechat';

import { useMembershipStore } from './membershipStore';

export const useMembershipUpgradeStore = defineStore('membershipUpgrade', () => {
  const workspaceId = ref(''),
    options = ref<UpgradeOptions | null>(null),
    quote = ref<UpgradeQuote | null>(null),
    operation = ref<UpgradeUpgrade | null>(null),
    busy = ref(false),
    error = ref('');
  const terminal = computed(() => !!operation.value?.closedAt);
  let generation = 0,
    timer: ReturnType<typeof setTimeout> | undefined,
    refreshMarker = '';
  function stop() {
    if (timer) clearTimeout(timer);
    timer = undefined;
  }
  function switchWorkspace(id: string) {
    if (workspaceId.value === id) return;
    generation++;
    stop();
    workspaceId.value = id;
    quote.value = null;
    operation.value = null;
    options.value = null;
    error.value = '';
    refreshMarker = '';
    busy.value = false;
  }
  function requestKey(action: string, body: unknown) {
    const name = `membership-upgrade:${workspaceId.value}:${action}:${JSON.stringify(body)}`;
    const key = sessionStorage.getItem(name) ?? crypto.randomUUID();
    sessionStorage.setItem(name, key);
    return { name, key };
  }
  async function accept(value: UpgradeUpgrade | null, version: number) {
    if (version !== generation) return;
    if (value && operation.value?.id === value.id && value.version < operation.value.version)
      return;
    operation.value = value;
    if (value) {
      sessionStorage.setItem(`membership-upgrade:last:${workspaceId.value}`, value.id);
      const marker = `${value.id}:${value.fulfillment.state}:${value.renewal.state}`;
      if (value.fulfillment.state === 'committed' && marker !== refreshMarker) {
        refreshMarker = marker;
        await useMembershipStore().refresh();
      }
    }
    if (version !== generation) return;
    stop();
    if (value && !value.closedAt)
      timer = setTimeout(
        () => {
          void poll();
        },
        (value.nextAction.pollAfterSeconds ?? 3) * 1000
      );
  }
  async function action<T>(
    work: (id: string, version: number) => Promise<T>
  ): Promise<T | undefined> {
    if (busy.value) return;
    const version = generation,
      id = workspaceId.value;
    busy.value = true;
    error.value = '';
    try {
      return await work(id, version);
    } catch (e) {
      if (version === generation)
        error.value =
          e instanceof Error
            ? e.message
            : String((e as { message?: string })?.message ?? 'Request failed');
    } finally {
      if (version === generation) busy.value = false;
    }
  }
  async function load(id: string) {
    switchWorkspace(id);
    return action(async (ws, v) => {
      const [opts, active] = await Promise.all([
        membershipUpgradeApi.options(ws),
        membershipUpgradeApi.active(ws),
      ]);
      if (v !== generation) return;
      options.value = opts;
      const previous = sessionStorage.getItem(`membership-upgrade:last:${ws}`);
      let restored = active;
      if (!restored && previous) {
        try {
          restored = await membershipUpgradeApi.detail(ws, previous);
        } catch {
          sessionStorage.removeItem(`membership-upgrade:last:${ws}`);
        }
      }
      await accept(restored, v);
    });
  }
  async function getQuote(targetPlanCode: string) {
    return action(async (ws, v) => {
      const body = {
        targetPlanCode,
        ...(operation.value && !operation.value.closedAt ? { upgradeId: operation.value.id } : {}),
      };
      const request = requestKey('quote', body);
      const result = await membershipUpgradeApi.quote(ws, body, request.key);
      if (v === generation) {
        quote.value = result;
        if (operation.value?.closedAt) operation.value = null;
        sessionStorage.removeItem(request.name);
      }
    });
  }
  async function confirm() {
    const quoteId = quote.value?.id;
    if (!quoteId) return;
    return action(async (ws, v) => {
      const body = {
        quoteId,
        acknowledgeCancellationConsequences: true as const,
        paymentPresentation: isWeiXin() ? ('jsapi' as const) : ('native' as const),
      };
      const request = requestKey('create', body);
      const result = await membershipUpgradeApi.create(ws, body, request.key);
      if (v === generation) sessionStorage.removeItem(request.name);
      await accept(result, v);
    });
  }
  async function continueUpgrade(body: UpgradeContinueRequest) {
    if (!operation.value) return;
    const id = operation.value.id;
    return action(async (ws, v) => {
      const request = requestKey(`continue:${id}`, body);
      const result = await membershipUpgradeApi.continue(ws, id, body, request.key);
      if (v === generation) sessionStorage.removeItem(request.name);
      await accept(result, v);
    });
  }
  async function abandon() {
    const id = operation.value?.id;
    if (!id) return;
    return action(async (ws, v) => {
      const body = {};
      const request = requestKey(`abandon:${id}`, body);
      const result = await membershipUpgradeApi.abandon(ws, id, body, request.key);
      if (v === generation) sessionStorage.removeItem(request.name);
      await accept(result, v);
    });
  }
  async function poll() {
    const v = generation,
      ws = workspaceId.value,
      id = operation.value?.id;
    if (!id) return;
    try {
      await accept(await membershipUpgradeApi.detail(ws, id), v);
    } catch {
      if (v === generation) {
        stop();
        timer = setTimeout(() => {
          void poll();
        }, 5000);
      }
    }
  }
  function closeView() {
    quote.value = null; /* In-flight operation continues and remains recoverable. */
  }
  return {
    workspaceId,
    options,
    quote,
    operation,
    busy,
    error,
    terminal,
    load,
    getQuote,
    confirm,
    continueUpgrade,
    abandon,
    poll,
    stop,
    switchWorkspace,
    closeView,
  };
});
