// @vitest-environment happy-dom
import { shallowMount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vite-plus/test';
import { createI18n } from 'vue-i18n';

import zhHans from '@/locales/zhHans';

import PlansAndBillingView from './PlansAndBillingView.vue';
const mocks = vi.hoisted(() => ({
  subscription: {},
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
  useMembershipStore: () => ({ refresh: async () => undefined }),
}));
vi.mock('@/stores/workspaceStore', () => ({
  useWorkspaceStore: () => ({ currentWorkspaceId: 'workspace', currentWorkspaceName: 'Example' }),
}));
vi.mock('@/stores/snackbarStore', () => ({
  useSnackbarStore: () => ({ showSuccessMessage: vi.fn(), showErrorMessage: vi.fn() }),
}));
describe('billing membership upgrade entry semantics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  for (const [status, autoRenew, end, disabled] of [
    ['active', true, '2099-01-01', false],
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
});
