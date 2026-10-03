// @vitest-environment happy-dom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vite-plus/test';
import { createI18n } from 'vue-i18n';

import zhHans from '@/locales/zhHans';

import SubscribePricing, { type SubscriptionPlan } from './SubscribePricing.vue';

const plan: SubscriptionPlan = {
  planName: '标准会员',
  price: '¥239/月',
  credits: '8000',
  features: [],
  productId: 'standard',
};
const create = (embedded: boolean, overrides: Partial<SubscriptionPlan>) =>
  shallowMount(SubscribePricing, {
    props: { embedded, plans: [{ ...plan, ...overrides }] },
    global: {
      plugins: [createI18n({ legacy: false, locale: 'zhHans', messages: { zhHans } })],
      renderStubDefaultSlot: true,
      stubs: {
        VItem: { template: '<div><slot selectedClass="" :toggle="() => {}"/></div>' },
        VBtn: {
          props: ['disabled'],
          emits: ['click'],
          template: `<button :disabled="disabled" @click="$emit('click')"><slot/></button>`,
        },
      },
    },
  });

describe.each([true, false])('pricing actions (embedded=%s)', embedded => {
  it('removes gated upgrade actions and their disabled hint from the DOM', () => {
    const w = create(embedded, {
      showAction: false,
      isDisabled: true,
      actionLabel: '升级会员',
      disabledReason: '升级入口暂未开放。',
    });
    expect(w.find('button').exists()).toBe(false);
    expect(w.text()).not.toContain('升级会员');
    expect(w.text()).not.toContain('升级入口暂未开放。');
    expect(w.text()).toContain('标准会员');
    expect(w.emitted('subscribe')).toBeUndefined();
    w.unmount();
  });
  it('preserves ordinary purchase when action visibility is unspecified', async () => {
    const w = create(embedded, {});
    await w.get('button').trigger('click');
    expect(w.emitted('subscribe')).toEqual([['standard', '标准会员']]);
    w.unmount();
  });
});
