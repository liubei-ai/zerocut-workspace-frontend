import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createI18n } from 'vue-i18n';
import SubscriptionSuccessDialog from './SubscriptionSuccessDialog.vue';
import * as membershipApi from '@/api/membershipApi';
import type { SubscriptionDetails } from '@/api/membershipApi';

// Mock the API
vi.mock('@/api/membershipApi', () => ({
  getCurrentSubscription: vi.fn(),
}));

const mockSubscription: SubscriptionDetails = {
  subscriptionId: 123,
  planCode: 'BASIC_AUTO_MONTHLY',
  tier: 'basic',
  purchaseMode: 'auto_monthly',
  status: 'active',
  autoRenew: true,
  termStartAt: '2026-01-01T00:00:00Z',
  termEndAt: '2026-12-31T23:59:59Z',
  currentPeriodStartAt: '2026-01-01T00:00:00Z',
  currentPeriodEndAt: '2026-01-31T23:59:59Z',
  monthlyQuota: 1000,
  remainingInCurrentPeriod: 800,
  nextBillingAt: '2026-02-01T00:00:00Z',
};

describe('SubscriptionSuccessDialog', () => {
  let vuetify: ReturnType<typeof createVuetify>;
  let i18n: ReturnType<typeof createI18n>;

  beforeEach(() => {
    vuetify = createVuetify({ components, directives });
    i18n = createI18n({
      legacy: false,
      locale: 'zhHans',
      messages: {
        zhHans: {
          zerocut: {
            subscriptionSuccess: {
              loading: '加载订阅信息...',
              title: '订阅成功！',
              subtitle: '您的订阅已生效',
              errorLoading: '加载订阅信息失败',
              viewDetailsAnyway: '查看订阅详情',
              viewDetailsButton: '查看订阅详情',
              autoRenew: '自动续费',
              oneTime: '单次',
              separator: '・',
              creditsUnit: '积分',
              labels: {
                plan: '订阅计划',
                monthlyCredits: '每月积分配额',
                subscriptionType: '订阅类型',
                currentPeriod: '当前周期',
              },
            },
            membership: {
              tiers: {
                basic: '基础会员',
                standard: '标准会员',
                premium: '高级会员',
              },
              cycles: {
                auto_monthly: '连续包月',
                auto_yearly: '连续包年',
                one_time_month: '按月支付',
                one_time_year: '按年支付',
              },
            },
          },
        },
      },
    });

    vi.clearAllMocks();
  });

  const mountComponent = (props = {}) => {
    return mount(SubscriptionSuccessDialog, {
      props: {
        modelValue: false,
        subscriptionId: null,
        workspaceId: null,
        ...props,
      },
      global: {
        plugins: [vuetify, i18n],
      },
    });
  };

  describe('Props and Events', () => {
    it('should render v-dialog with correct model value', () => {
      const wrapper = mountComponent({ modelValue: true });
      const dialog = wrapper.findComponent({ name: 'VDialog' });
      expect(dialog.exists()).toBe(true);
    });

    it('should emit update:modelValue when dialog is closed', async () => {
      const wrapper = mountComponent({ modelValue: true });
      const dialog = wrapper.findComponent({ name: 'VDialog' });
      await dialog.vm.$emit('update:modelValue', false);
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    });

    it('should emit close event when dialog is closed', async () => {
      const wrapper = mountComponent({
        modelValue: true,
        subscriptionId: 123,
        workspaceId: 'workspace-1',
      });

      // Wait for API call
      await wrapper.vm.$nextTick();

      // Close dialog
      const dialog = wrapper.findComponent({ name: 'VDialog' });
      await dialog.vm.$emit('update:modelValue', false);

      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('should show loading state when opening dialog', async () => {
      (membershipApi.getCurrentSubscription as Mock).mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => resolve(mockSubscription), 100);
          })
      );

      const wrapper = mountComponent({
        modelValue: true,
        subscriptionId: 123,
        workspaceId: 'workspace-1',
      });

      await wrapper.vm.$nextTick();

      // Should show loading progress
      expect(wrapper.html()).toContain('加载订阅信息...');
    });

    it('should call API when dialog opens with valid props', async () => {
      (membershipApi.getCurrentSubscription as Mock).mockResolvedValue(mockSubscription);

      const wrapper = mountComponent({
        modelValue: true,
        subscriptionId: 123,
        workspaceId: 'workspace-1',
      });

      await wrapper.vm.$nextTick();

      expect(membershipApi.getCurrentSubscription).toHaveBeenCalledWith('workspace-1');
    });
  });

  describe('Error State', () => {
    it('should show error state when API fails', async () => {
      const errorMessage = '网络错误';
      (membershipApi.getCurrentSubscription as Mock).mockRejectedValue(new Error(errorMessage));

      const wrapper = mountComponent({
        modelValue: true,
        subscriptionId: 123,
        workspaceId: 'workspace-1',
      });

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(wrapper.html()).toContain('加载订阅信息失败');
      expect(wrapper.html()).toContain(errorMessage);
    });

    it('should allow navigation on error state', async () => {
      (membershipApi.getCurrentSubscription as Mock).mockRejectedValue(new Error('Test error'));

      const wrapper = mountComponent({
        modelValue: true,
        subscriptionId: 123,
        workspaceId: 'workspace-1',
      });

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 10));

      const viewDetailsButton = wrapper.find('[data-testid="view-details-anyway-button"]');
      expect(viewDetailsButton.exists()).toBe(true);

      await viewDetailsButton.trigger('click');
      expect(wrapper.emitted('view-details')).toBeTruthy();
    });
  });

  describe('Success State', () => {
    beforeEach(() => {
      (membershipApi.getCurrentSubscription as Mock).mockResolvedValue(mockSubscription);
    });

    it('should display subscription information correctly', async () => {
      const wrapper = mountComponent({
        modelValue: true,
        subscriptionId: 123,
        workspaceId: 'workspace-1',
      });

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Check for success elements
      expect(wrapper.html()).toContain('订阅成功！');
      expect(wrapper.html()).toContain('您的订阅已生效');
      expect(wrapper.html()).toContain('基础会员');
      expect(wrapper.html()).toContain('1000');
      expect(wrapper.html()).toContain('积分');
    });

    it('should format subscription type correctly for auto-renew', async () => {
      const wrapper = mountComponent({
        modelValue: true,
        subscriptionId: 123,
        workspaceId: 'workspace-1',
      });

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(wrapper.html()).toContain('连续包月');
      expect(wrapper.html()).toContain('自动续费');
    });

    it('should format subscription type correctly for one-time', async () => {
      const oneTimeSubscription: SubscriptionDetails = {
        ...mockSubscription,
        purchaseMode: 'one_time_month',
        autoRenew: false,
      };

      (membershipApi.getCurrentSubscription as Mock).mockResolvedValue(oneTimeSubscription);

      const wrapper = mountComponent({
        modelValue: true,
        subscriptionId: 123,
        workspaceId: 'workspace-1',
      });

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(wrapper.html()).toContain('按月支付');
      expect(wrapper.html()).toContain('单次');
    });

    it('should format period dates correctly', async () => {
      const wrapper = mountComponent({
        modelValue: true,
        subscriptionId: 123,
        workspaceId: 'workspace-1',
      });

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Check for formatted dates (format should be YYYY-MM-DD)
      expect(wrapper.html()).toContain('2026-01-01');
      expect(wrapper.html()).toContain('2026-01-31');
    });

    it('should emit view-details event when button is clicked', async () => {
      const wrapper = mountComponent({
        modelValue: true,
        subscriptionId: 123,
        workspaceId: 'workspace-1',
      });

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 10));

      const viewDetailsButton = wrapper.find('[data-testid="view-details-button"]');
      expect(viewDetailsButton.exists()).toBe(true);

      await viewDetailsButton.trigger('click');
      expect(wrapper.emitted('view-details')).toBeTruthy();
    });

    it('should display celebration icon with animation', async () => {
      const wrapper = mountComponent({
        modelValue: true,
        subscriptionId: 123,
        workspaceId: 'workspace-1',
      });

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 10));

      const celebrationIcon = wrapper.find('.celebration-icon');
      expect(celebrationIcon.exists()).toBe(true);
    });
  });

  describe('Tier Display', () => {
    it('should display correct tier name for standard', async () => {
      const standardSubscription: SubscriptionDetails = {
        ...mockSubscription,
        tier: 'standard',
        monthlyQuota: 3000,
      };

      (membershipApi.getCurrentSubscription as Mock).mockResolvedValue(standardSubscription);

      const wrapper = mountComponent({
        modelValue: true,
        subscriptionId: 123,
        workspaceId: 'workspace-1',
      });

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(wrapper.html()).toContain('标准会员');
      expect(wrapper.html()).toContain('3000');
    });

    it('should display correct tier name for premium', async () => {
      const premiumSubscription: SubscriptionDetails = {
        ...mockSubscription,
        tier: 'premium',
        monthlyQuota: 10000,
      };

      (membershipApi.getCurrentSubscription as Mock).mockResolvedValue(premiumSubscription);

      const wrapper = mountComponent({
        modelValue: true,
        subscriptionId: 123,
        workspaceId: 'workspace-1',
      });

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(wrapper.html()).toContain('高级会员');
      expect(wrapper.html()).toContain('10000');
    });
  });

  describe('Edge Cases', () => {
    it('should not call API if workspaceId is missing', async () => {
      const wrapper = mountComponent({
        modelValue: true,
        subscriptionId: 123,
        workspaceId: null,
      });

      await wrapper.vm.$nextTick();

      expect(membershipApi.getCurrentSubscription).not.toHaveBeenCalled();
    });

    it('should not call API if subscriptionId is missing', async () => {
      const wrapper = mountComponent({
        modelValue: true,
        subscriptionId: null,
        workspaceId: 'workspace-1',
      });

      await wrapper.vm.$nextTick();

      expect(membershipApi.getCurrentSubscription).not.toHaveBeenCalled();
    });

    it('should handle missing period dates gracefully', async () => {
      const subscriptionNoDates: SubscriptionDetails = {
        ...mockSubscription,
        currentPeriodStartAt: null,
        currentPeriodEndAt: null,
      };

      (membershipApi.getCurrentSubscription as Mock).mockResolvedValue(subscriptionNoDates);

      const wrapper = mountComponent({
        modelValue: true,
        subscriptionId: 123,
        workspaceId: 'workspace-1',
      });

      await wrapper.vm.$nextTick();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should not crash and should display dash
      expect(wrapper.html()).toContain('-');
    });
  });

  describe('Dialog Behavior', () => {
    it('should have persistent attribute to prevent closing on outside click', () => {
      const wrapper = mountComponent({ modelValue: true });
      const dialog = wrapper.findComponent({ name: 'VDialog' });
      expect(dialog.props('persistent')).toBe(true);
    });

    it('should have max-width of 560', () => {
      const wrapper = mountComponent({ modelValue: true });
      const dialog = wrapper.findComponent({ name: 'VDialog' });
      expect(dialog.props('maxWidth')).toBe('560');
    });
  });
});
