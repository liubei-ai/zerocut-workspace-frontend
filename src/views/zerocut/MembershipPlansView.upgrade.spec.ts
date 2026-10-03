// @vitest-environment happy-dom
import { shallowMount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vite-plus/test';
import { createI18n } from 'vue-i18n';

import zhHans from '@/locales/zhHans';

import MembershipPlansView from './MembershipPlansView.vue';
const mocks = vi.hoisted(() => ({
  plans: [] as unknown[],
  member: {
    subscription: null as unknown,
    availableCredits: 0,
    refresh: vi.fn().mockResolvedValue(undefined),
    isMembershipEffectiveStatus: (s: string) => s !== 'expired',
  },
  upgrade: {
    options: { options: [] as unknown[] },
    operation: null,
    load: vi.fn().mockResolvedValue(undefined),
    getQuote: vi.fn().mockResolvedValue(undefined),
    closeView: vi.fn(),
    stop: vi.fn(),
    switchWorkspace: vi.fn(),
  },
  warn: vi.fn(),
  info: vi.fn(),
}));
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/api/membershipApi', () => ({ getMembershipPlans: async () => mocks.plans }));
vi.mock('@/stores/membershipUpgradeStore', () => ({
  useMembershipUpgradeStore: () => mocks.upgrade,
}));
vi.mock('@/stores/membershipStore', () => ({ useMembershipStore: () => mocks.member }));
vi.mock('@/stores/workspaceStore', () => ({
  useWorkspaceStore: () => ({ currentWorkspaceId: 'workspace' }),
}));
vi.mock('@/stores/snackbarStore', () => ({
  useSnackbarStore: () => ({
    showWarningMessage: mocks.warn,
    showInfoMessage: mocks.info,
    showErrorMessage: vi.fn(),
  }),
}));
const mountPage = () =>
  shallowMount(MembershipPlansView, {
    global: {
      plugins: [createI18n({ legacy: false, locale: 'zhHans', messages: { zhHans } })],
      renderStubDefaultSlot: true,
      stubs: {
        SubscribePricing: { name: 'SubscribePricing', props: ['plans'], template: '<div/>' },
        VBtnToggle: { name: 'VBtnToggle', props: ['modelValue'], template: '<div><slot/></div>' },
        MembershipPaymentDialog: {
          name: 'MembershipPaymentDialog',
          props: ['open'],
          template: '<div/>',
        },
        MembershipPureSigningDialog: {
          name: 'MembershipPureSigningDialog',
          props: ['open'],
          template: '<div/>',
        },
        MembershipUpgradeDialog: {
          name: 'MembershipUpgradeDialog',
          props: ['open', 'notice', 'targetPlanCode', 'error'],
          template: '<div />',
        },
        SubscriptionSuccessDialog: true,
      },
    },
  });
describe('membership plan entries use server upgrade eligibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.member.subscription = { status: 'active', planCode: 'source', tier: 'basic' };
    mocks.upgrade.operation = null;
    mocks.plans = [
      {
        code: 'target',
        tier: 'standard',
        name: 'Standard',
        purchaseMode: 'one_time_month',
        monthlyCredits: 1000,
        priceCents: 10000,
        priceYuan: '100',
        currency: 'CNY',
        features: [],
        billingIntervalMonths: 1,
      },
    ];
  });
  for (const [classification, available] of [
    ['allowed', true],
    ['forbidden', false],
    ['not_upgrade', false],
  ] as const)
    it(`${classification} target is handled through the correct flow`, async () => {
      mocks.upgrade.options.options = [
        {
          targetPlan: { code: 'target' },
          classification,
          available,
          reasonCode: classification === 'forbidden' ? 'DOWNGRADE_NOT_ALLOWED' : null,
        },
      ];
      const w = mountPage();
      await flushPromises();
      const pricing = w.findComponent({ name: 'SubscribePricing' });
      expect(pricing.props('plans')[0].isDisabled).toBe(!available);
      pricing.vm.$emit('subscribe', 'target', 'Standard');
      await flushPromises();
      expect(mocks.upgrade.getQuote).toHaveBeenCalledTimes(available ? 1 : 0);
      if (classification === 'forbidden') expect(mocks.warn).toHaveBeenCalled();
      w.unmount();
    });
  for (const sourceMode of ['one_time_month', 'auto_monthly'])
    for (const targetMode of ['one_time_year', 'auto_yearly'])
      it.each(['missing', 'incorrectly_available'])(
        `${sourceMode} → ${targetMode} stays blocked with %s eligibility`,
        async eligibility => {
          mocks.member.subscription = {
            status: 'active',
            planCode: 'source',
            tier: 'basic',
            purchaseMode: sourceMode,
          };
          mocks.plans = [
            { ...(mocks.plans[0] as object), purchaseMode: targetMode, billingIntervalMonths: 12 },
          ];
          mocks.upgrade.options.options =
            eligibility === 'missing'
              ? []
              : [
                  {
                    targetPlan: { code: 'target' },
                    classification: 'allowed',
                    available: true,
                    previewOnly: true,
                  },
                ];
          const w = mountPage();
          await flushPromises();
          w.getComponent({ name: 'VBtnToggle' }).vm.$emit(
            'update:modelValue',
            targetMode === 'auto_yearly' ? 'yearly' : 'one_time_year'
          );
          await flushPromises();
          const pricing = w.getComponent({ name: 'SubscribePricing' });
          expect(pricing.props('plans')[0]).toMatchObject({
            isDisabled: true,
            actionLabel: '暂不支持升级',
            disabledReason: '本期暂不支持年付升级。',
          });
          // Bypass the disabled card to verify the event handler also prevents both payment flows.
          pricing.vm.$emit('subscribe', 'target', 'Standard');
          await flushPromises();
          expect(mocks.upgrade.getQuote).not.toHaveBeenCalled();
          expect(mocks.warn).toHaveBeenCalledWith('本期暂不支持年付升级。');
          expect(w.getComponent({ name: 'MembershipUpgradeDialog' }).props('open')).toBe(false);
          expect(w.getComponent({ name: 'MembershipPaymentDialog' }).props('open')).toBe(false);
          expect(w.getComponent({ name: 'MembershipPureSigningDialog' }).props('open')).toBe(false);
          w.unmount();
        }
      );
  for (const targetMode of ['one_time_year', 'auto_yearly'])
    it.each(['expired', 'no_membership'])(
      `${targetMode} retains regular purchase for %s`,
      async status => {
        mocks.member.subscription =
          status === 'expired' ? { status, planCode: 'source', tier: 'basic' } : null;
        mocks.plans = [
          { ...(mocks.plans[0] as object), purchaseMode: targetMode, billingIntervalMonths: 12 },
        ];
        mocks.upgrade.options.options = [];
        const w = mountPage();
        await flushPromises();
        w.getComponent({ name: 'VBtnToggle' }).vm.$emit(
          'update:modelValue',
          targetMode === 'auto_yearly' ? 'yearly' : 'one_time_year'
        );
        await flushPromises();
        const pricing = w.getComponent({ name: 'SubscribePricing' });
        expect(pricing.props('plans')[0].isDisabled).toBe(false);
        expect(pricing.props('plans')[0].actionLabel).toBeUndefined();
        pricing.vm.$emit('subscribe', 'target', 'Standard');
        await flushPromises();
        expect(
          w
            .getComponent({
              name:
                targetMode === 'one_time_year'
                  ? 'MembershipPaymentDialog'
                  : 'MembershipPureSigningDialog',
            })
            .props('open')
        ).toBe(true);
        expect(mocks.upgrade.getQuote).not.toHaveBeenCalled();
        expect(mocks.warn).not.toHaveBeenCalled();
        w.unmount();
      }
    );
  it('uses ordinary purchase after expiry instead of forcing an upgrade', async () => {
    mocks.member.subscription = { status: 'expired', planCode: 'premium', tier: 'premium' };
    mocks.upgrade.options.options = [
      {
        targetPlan: { code: 'target' },
        classification: 'not_upgrade',
        available: false,
        previewOnly: false,
        reasonCode: 'NO_EFFECTIVE_MEMBERSHIP',
      },
    ];
    const w = mountPage();
    await flushPromises();
    const pricing = w.findComponent({ name: 'SubscribePricing' });
    expect(pricing.props('plans')[0].isDisabled).toBe(false);
    pricing.vm.$emit('subscribe', 'target', 'Standard');
    await flushPromises();
    expect(mocks.upgrade.getQuote).not.toHaveBeenCalled();
    expect(mocks.warn).not.toHaveBeenCalled();
    w.unmount();
  });

  it('opens the upgrade dialog for an eligible local preview', async () => {
    mocks.upgrade.options.options = [
      {
        targetPlan: { code: 'target' },
        classification: 'allowed',
        available: false,
        previewOnly: true,
        reasonCode: null,
      },
    ];
    const w = mountPage();
    await flushPromises();
    const pricing = w.findComponent({ name: 'SubscribePricing' });
    expect(pricing.props('plans')[0].isDisabled).toBe(false);
    expect(pricing.props('plans')[0].actionLabel).toBe('升级预览');
    expect(pricing.props('plans')[0].disabledReason).toBeUndefined();
    pricing.vm.$emit('subscribe', 'target', 'Standard');
    await flushPromises();
    const dialog = w.findComponent({ name: 'MembershipUpgradeDialog' });
    expect(dialog.props('open')).toBe(true);
    expect(dialog.props('targetPlanCode')).toBe('target');
    expect(dialog.props('notice')).toBe(
      '当前为本地预览，暂未开放实际升级，不会创建订单或取消续费。'
    );
    expect(mocks.upgrade.getQuote).not.toHaveBeenCalled();
    expect(mocks.warn).not.toHaveBeenCalled();
    w.unmount();
  });

  it('keeps the upgrade entry visible when the feature gate prevents quoting', async () => {
    mocks.upgrade.options.options = [
      {
        targetPlan: { code: 'target' },
        classification: 'allowed',
        available: false,
        previewOnly: false,
        reasonCode: 'UPGRADE_DISABLED',
      },
    ];
    const w = mountPage();
    await flushPromises();
    const pricing = w.findComponent({ name: 'SubscribePricing' });
    expect(pricing.props('plans')[0].isDisabled).toBe(false);
    expect(pricing.props('plans')[0].actionLabel).toBe('升级会员');
    pricing.vm.$emit('subscribe', 'target', 'Standard');
    await flushPromises();
    expect(mocks.upgrade.getQuote).not.toHaveBeenCalled();
    expect(mocks.warn).not.toHaveBeenCalled();
    const dialog = w.findComponent({ name: 'MembershipUpgradeDialog' });
    expect(dialog.props('open')).toBe(true);
    expect(dialog.props('notice')).toBe('升级入口暂未开放。');
    w.unmount();
  });

  it('does not hide the upgrade entry if upgrade options have not loaded', async () => {
    mocks.upgrade.options.options = [];
    const w = mountPage();
    await flushPromises();
    const pricing = w.findComponent({ name: 'SubscribePricing' });
    expect(pricing.props('plans')[0].isDisabled).toBe(false);
    expect(pricing.props('plans')[0].actionLabel).toBe('升级会员');
    pricing.vm.$emit('subscribe', 'target', 'Standard');
    await flushPromises();
    expect(mocks.upgrade.getQuote).not.toHaveBeenCalled();
    expect(mocks.warn).not.toHaveBeenCalled();
    const dialog = w.findComponent({ name: 'MembershipUpgradeDialog' });
    expect(dialog.props('open')).toBe(true);
    expect(dialog.props('targetPlanCode')).toBe('target');
    expect(dialog.props('notice')).toBe('升级入口暂未开放。');
    w.unmount();
  });
});
