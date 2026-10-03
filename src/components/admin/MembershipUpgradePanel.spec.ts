// @vitest-environment happy-dom
import { mount, flushPromises } from '@vue/test-utils';
import { beforeEach, describe, it, expect, vi } from 'vite-plus/test';
import { createI18n } from 'vue-i18n';

import zhHans from '@/locales/zhHans';

import MembershipUpgradePanel from './MembershipUpgradePanel.vue';
const mocks = vi.hoisted(() => ({
  permissions: new Set<string>(),
  list: vi.fn(),
  detail: vi.fn(),
  action: vi.fn(),
}));
vi.mock('@/stores/userStore', () => ({
  useUserStore: () => ({ hasPermission: (p: string) => mocks.permissions.has(p) }),
}));
vi.mock('@/api/membershipUpgradeAdminApi', () => ({ membershipUpgradeAdminApi: mocks }));
const detail = {
  upgrade: {
    id: 'op',
    state: 'MANUAL_REVIEW',
    targetPlan: { code: 'premium' },
    payment: { amountCents: 10000, state: 'confirmed' },
    fulfillment: { state: 'pending' },
    renewal: { state: 'pending' },
    refund: { state: 'none' },
    support: { userUpdateDueAt: null },
  },
  accountId: '1',
  workspaceId: '1',
  caseOwner: null,
  allowedAdminActions: ['record_progress'],
  auditEvents: [],
  auditNextCursor: null,
};
const create = () =>
  mount(MembershipUpgradePanel, {
    global: { plugins: [createI18n({ legacy: false, locale: 'zhHans', messages: { zhHans } })] },
  });
describe('administrative recovery panel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mocks.permissions = new Set();
    mocks.list.mockResolvedValue({ items: [detail], nextCursor: null });
    mocks.detail.mockResolvedValue(detail);
    mocks.action.mockResolvedValue(detail);
  });
  it('does not load without read permissions or expose write controls to read-only administrators', async () => {
    let w = create();
    await flushPromises();
    expect(mocks.list).not.toHaveBeenCalled();
    w.unmount();
    mocks.permissions = new Set(['admin.access', 'order.read']);
    w = create();
    await flushPromises();
    await w.get('li button').trigger('click');
    await flushPromises();
    expect(w.find('form').exists()).toBe(false);
    expect(mocks.action).not.toHaveBeenCalled();
    w.unmount();
  });
  it('filters the queue using authoritative states', async () => {
    mocks.permissions = new Set(['admin.access', 'order.read']);
    const w = create();
    await flushPromises();
    await w.get('select').setValue('MANUAL_REVIEW');
    await flushPromises();
    expect(mocks.list).toHaveBeenLastCalledWith({ state: 'MANUAL_REVIEW' });
    w.unmount();
  });
  it('requires notification evidence and retains the action key after a failed response', async () => {
    mocks.permissions = new Set(['admin.access', 'order.read', 'wallet.grant']);
    const w = create();
    await flushPromises();
    await w.get('li button').trigger('click');
    await flushPromises();
    const fields = w.findAll('textarea'),
      inputs = w.findAll('form input');
    await fields[0].setValue('Checking');
    await fields[1].setValue('Payment check pending');
    await inputs[0].setValue('test-channel');
    expect(w.get('form button').attributes('disabled')).toBeDefined();
    await inputs[1].setValue('Synthetic evidence');
    mocks.action.mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce(detail);
    await w.get('form button').trigger('click');
    await flushPromises();
    await w.get('form button').trigger('click');
    await flushPromises();
    expect(mocks.action).toHaveBeenCalledTimes(2);
    expect(mocks.action.mock.calls[0][2]).toBe(mocks.action.mock.calls[1][2]);
    expect(mocks.action.mock.calls[1][1]).toMatchObject({
      notificationChannel: 'test-channel',
      notificationEvidence: 'Synthetic evidence',
    });
    w.unmount();
  });
});
