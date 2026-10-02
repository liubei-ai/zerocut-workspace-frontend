// @vitest-environment happy-dom
import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vite-plus/test';
import { createI18n } from 'vue-i18n';

import type { UpgradeQuote, UpgradeUpgrade } from '@/api/membershipUpgradeApi';

import zhHans from '@/locales/zhHans';

import MembershipUpgradeDialog from './MembershipUpgradeDialog.vue';
const quote = {
  id: 'quote',
  amountCents: 20000,
  target: { code: 'PREMIUM', monthlyCredits: '2000' },
  credits: {
    oldAvailableCredits: '100',
    newCredits: '2000',
    totalAvailableCredits: '2100',
    oldBatches: [
      { transactionId: 'old', remainingCredits: '100', expiresAt: '2026-10-05T02:00:00Z' },
    ],
  },
  estimatedStartAt: '2026-09-20T02:00:00Z',
  estimatedEndAt: '2026-10-20T02:00:00Z',
  expiresAt: '2099-01-01T00:00:00Z',
  renewal: { applicable: true, amountCents: 20000, estimatedChargeAt: '2026-10-19T02:00:00Z' },
} as UpgradeQuote;
const create = (props: Record<string, unknown>) =>
  mount(MembershipUpgradeDialog, {
    attachTo: document.body,
    props: { open: true, ...props },
    global: { plugins: [createI18n({ legacy: false, locale: 'zhHans', messages: { zhHans } })] },
  });
describe('upgrade confirmation and progress', () => {
  it('shows full cost, independent credits/expiry and requires explicit consent', async () => {
    const w = create({ quote });
    expect(w.text()).toContain('200.00');
    expect(w.text()).toContain('2100');
    expect(w.text()).toContain('2026');
    expect(w.get('[data-test=confirm]').attributes('disabled')).toBeDefined();
    await w.get('input[type=checkbox]').setValue(true);
    await w.get('form').trigger('submit');
    expect(w.emitted('confirm')).toHaveLength(1);
    w.unmount();
  });
  it('keeps keyboard focus inside the dialog and Escape closes without abandoning', async () => {
    const w = create({ quote });
    await flushPromises();
    const panel = w.get('[role=dialog]');
    expect(document.activeElement).toBe(panel.element);
    await panel.trigger('keydown', { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(w.get('input[type=checkbox]').element);
    await panel.trigger('keydown', { key: 'Tab' });
    expect(document.activeElement).toBe(w.get('[data-test=close]').element);
    await panel.trigger('keydown', { key: 'Escape' });
    expect(w.emitted('close')).toHaveLength(1);
    expect(w.emitted('abandon')).toBeUndefined();
    w.unmount();
  });
  it('does not present paid-but-undelivered as completed or expose payment while cancellation is unknown', () => {
    const operation = {
      state: 'PAYMENT_UNKNOWN',
      cancellationState: 'unknown',
      payment: { state: 'confirmed' },
      fulfillment: { state: 'pending' },
      renewal: { state: 'pending' },
      nextAction: { type: 'WAIT_QUERY' },
      allowedActions: ['retry'],
      support: {},
      refund: { state: 'none' },
    } as UpgradeUpgrade;
    const w = create({ operation });
    expect(w.find('[data-test=completed]').exists()).toBe(false);
    expect(w.find('[data-test=authorize]').exists()).toBe(false);
    expect(w.find('[data-test=prepare]').exists()).toBe(false);
    w.unmount();
  });
  it('prepares only when instructed and closing does not abandon the operation', async () => {
    const operation = {
      state: 'AUTHORIZING',
      cancellationState: 'confirmed',
      payment: { state: 'not_started' },
      fulfillment: { state: 'pending' },
      renewal: { state: 'pending' },
      nextAction: { type: 'AUTHORIZE' },
      allowedActions: ['prepare'],
      support: {},
      refund: { state: 'none' },
    } as UpgradeUpgrade;
    const w = create({ operation });
    await w.get('[data-test=prepare]').trigger('click');
    expect(w.emitted('prepare')).toHaveLength(1);
    await w.get('[data-test=close]').trigger('click');
    expect(w.emitted('close')).toHaveLength(1);
    expect(w.emitted('abandon')).toBeUndefined();
    w.unmount();
  });
});
