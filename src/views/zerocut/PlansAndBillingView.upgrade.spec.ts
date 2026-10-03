// @vitest-environment happy-dom
import { shallowMount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vite-plus/test';
import { createI18n } from 'vue-i18n';

import zhHans from '@/locales/zhHans';

import PlansAndBillingView from './PlansAndBillingView.vue';
const mocks = vi.hoisted(() => ({
  subscription: {},
  refresh: vi.fn().mockResolvedValue(undefined),
  workspace: { currentWorkspaceId: 'workspace', currentWorkspaceName: 'Example' },
  stop: vi.fn(),
  switchWorkspace: vi.fn(),
  push: vi.fn(),
  cancel: vi.fn(),
  load: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/api/membershipApi', () => ({
  getMembershipPlans: async () => [],
  getCurrentSubscription: async () => ({ subscription: mocks.subscription }),
  cancelSubscription: mocks.cancel,
}));
vi.mock('@/stores/membershipUpgradeStore', () => ({
  useMembershipUpgradeStore: () => ({
    load: mocks.load,
    operation: null,
    stop: mocks.stop,
    switchWorkspace: mocks.switchWorkspace,
  }),
}));
vi.mock('@/stores/membershipStore', () => ({
  useMembershipStore: () => ({ refresh: mocks.refresh }),
}));
vi.mock('@/stores/workspaceStore', async () => {
  const { reactive } = await import('vue');
  mocks.workspace = reactive(mocks.workspace);
  return { useWorkspaceStore: () => mocks.workspace };
});
vi.mock('@/stores/snackbarStore', () => ({
  useSnackbarStore: () => ({ showSuccessMessage: vi.fn(), showErrorMessage: vi.fn() }),
}));
describe('billing membership upgrade entry semantics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.workspace.currentWorkspaceId = 'workspace';
  });
  for (const [status, autoRenew, end, disabled] of [
    ['active', true, '2099-01-01', false],
    ['past_due', true, '2020-01-01', false],
    ['canceled', false, '2099-01-01', true],
    ['expired', false, '2020-01-01', true],
    ['active', false, '2099-01-01', true],
  ] as const)
    it(`${status}, autoRenew=${autoRenew}: only real renewal can be canceled`, async () => {
      mocks.subscription = {
        subscriptionId: 1,
        planCode: 'basic',
        tier: 'basic',
        purchaseMode: 'auto_monthly',
        status,
        autoRenew,
        currentPeriodEndAt: end,
        remainingInCurrentPeriod: 100,
        monthlyQuota: 1000,
      };
      const w = shallowMount(PlansAndBillingView, {
        global: {
          plugins: [createI18n({ legacy: false, locale: 'zhHans', messages: { zhHans } })],
          renderStubDefaultSlot: true,
          stubs: {
            VBtn: {
              props: ['disabled'],
              template: '<button :disabled="disabled"><slot/></button>',
            },
            VDialog: true,
            ResponsivePageHeader: true,
          },
        },
      });
      await flushPromises();
      const button = w
        .findAll('button')
        .find(b => b.text() === zhHans.zerocut.plansAndBilling.cancel.button);
      expect(button).toBeDefined();
      expect(button!.attributes('disabled') !== undefined).toBe(disabled);
      const plans = w
        .findAll('button')
        .find(b => b.text() === zhHans.zerocut.plansAndBilling.cancel.viewPlans);
      await plans?.trigger('click');
      expect(mocks.push).toHaveBeenCalledWith('/membership');
      expect(mocks.cancel).not.toHaveBeenCalled();
      w.unmount();
      expect(mocks.stop).toHaveBeenCalledTimes(1);
    });
  function mountBilling() {
    return shallowMount(PlansAndBillingView, {
      global: {
        plugins: [createI18n({ legacy: false, locale: 'zhHans', messages: { zhHans } })],
        renderStubDefaultSlot: true,
        stubs: { VDialog: true, ResponsivePageHeader: true },
      },
    });
  }
  it('keeps annual benefits active across the monthly credit boundary and displays the annual end', async () => {
    mocks.subscription = {
      subscriptionId: 1,
      purchaseMode: 'one_time_year',
      tier: 'basic',
      status: 'active',
      autoRenew: false,
      currentPeriodEndAt: '2020-01-01',
      termEndAt: '2099-01-01',
      entitlementActive: true,
      entitlementEndsAt: '2099-01-01',
    };
    const w = mountBilling();
    await flushPromises();
    expect(w.text()).toContain('按年支付');
    expect(w.text()).toContain('生效中');
    expect(w.text()).toContain('会员权益结束时间');
    expect(w.text()).toContain('2099');
    w.unmount();
  });
  it('does not publish a cancellation response into another workspace', async () => {
    mocks.subscription = {
      subscriptionId: 1,
      purchaseMode: 'auto_monthly',
      tier: 'basic',
      status: 'past_due',
      autoRenew: true,
    };
    let resolveCancel!: (value: object) => void;
    mocks.cancel.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveCancel = resolve;
        })
    );
    const w = mountBilling();
    await flushPromises();
    const vm = w.vm as unknown as {
      confirmCancel: () => Promise<void>;
      subscription: { subscriptionId: number };
    };
    const canceled = vm.confirmCancel();
    mocks.subscription = {
      subscriptionId: 2,
      purchaseMode: 'one_time_month',
      tier: 'standard',
      status: 'active',
      autoRenew: false,
    };
    mocks.workspace.currentWorkspaceId = 'another';
    await flushPromises();
    resolveCancel({ subscriptionId: 1, status: 'canceled', autoRenew: false });
    await canceled;
    await flushPromises();
    expect(vm.subscription.subscriptionId).toBe(2);
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(mocks.cancel).toHaveBeenCalledTimes(1);
    w.unmount();
  });
  it('handles membership refresh failure after cancellation without treating cancellation as failed', async () => {
    mocks.subscription = {
      subscriptionId: 1,
      purchaseMode: 'auto_monthly',
      tier: 'basic',
      status: 'past_due',
      autoRenew: true,
    };
    mocks.cancel.mockResolvedValueOnce({ subscriptionId: 1, status: 'canceled', autoRenew: false });
    mocks.refresh.mockRejectedValueOnce(new Error('Refresh unavailable'));
    const w = mountBilling();
    await flushPromises();
    await (w.vm as unknown as { confirmCancel: () => Promise<void> }).confirmCancel();
    await flushPromises();
    expect(mocks.cancel).toHaveBeenCalledTimes(1);
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect((w.vm as unknown as { subscription: { status: string } }).subscription.status).toBe(
      'canceled'
    );
    w.unmount();
  });
});
