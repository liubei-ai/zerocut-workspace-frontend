// @vitest-environment happy-dom
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { reactive } from 'vue';

import { getCurrentSubscription } from '@/api/membershipApi';
import { getWalletInfo } from '@/api/walletApi';

import { useMembershipStore } from './membershipStore';
const mocks = vi.hoisted(() => ({ workspace: { currentWorkspaceId: 'workspace' } }));
vi.mock('./workspaceStore', () => ({ useWorkspaceStore: () => mocks.workspace }));
vi.mock('@/api/membershipApi', () => ({ getCurrentSubscription: vi.fn() }));
vi.mock('@/api/walletApi', () => ({ getWalletInfo: vi.fn() }));
const details = (tier = 'basic') => ({
  subscription: { status: 'active', tier },
  firstMonthPromoEligible: false,
});
beforeEach(() => {
  setActivePinia(createPinia());
  vi.resetAllMocks();
  mocks.workspace = reactive({ currentWorkspaceId: 'workspace' });
  vi.mocked(getCurrentSubscription).mockResolvedValue(details() as never);
  vi.mocked(getWalletInfo).mockResolvedValue({ availableCredits: 100 } as never);
});
describe('membership rights refresh', () => {
  it('shares the actual in-flight Promise with concurrent callers', async () => {
    let finish!: (value: never) => void;
    vi.mocked(getCurrentSubscription).mockReturnValueOnce(
      new Promise(resolve => {
        finish = resolve;
      })
    );
    const s = useMembershipStore();
    const one = s.refresh();
    const two = s.refresh();
    let completed = 0;
    void one.then(() => completed++);
    void two.then(() => completed++);
    await Promise.resolve();
    expect(completed).toBe(0);
    expect(getCurrentSubscription).toHaveBeenCalledTimes(1);
    finish(details() as never);
    await two;
    expect(s.availableCredits).toBe(100);
  });
  it('preserves confirmed subscription and wallet if the new wallet fetch fails', async () => {
    const s = useMembershipStore();
    await s.initialize();
    vi.mocked(getCurrentSubscription).mockResolvedValueOnce(details('premium') as never);
    vi.mocked(getWalletInfo).mockRejectedValueOnce(new Error('offline'));
    await expect(s.refresh()).rejects.toThrow('offline');
    expect(s.subscription?.tier).toBe('basic');
    expect(s.availableCredits).toBe(100);
    await s.refresh();
    expect(s.loading).toBe(false);
  });
  it('does not mark failed initialization complete', async () => {
    vi.mocked(getCurrentSubscription).mockRejectedValueOnce(new Error('offline'));
    const s = useMembershipStore();
    await expect(s.initialize()).rejects.toThrow();
    expect(s.initialized).toBe(false);
    await s.initialize();
    expect(s.initialized).toBe(true);
  });
  it('clears old workspace data and ignores its late response', async () => {
    const s = useMembershipStore();
    await s.initialize();
    let finish!: (value: never) => void;
    vi.mocked(getCurrentSubscription).mockReturnValueOnce(
      new Promise(resolve => {
        finish = resolve;
      })
    );
    const old = s.refresh();
    mocks.workspace.currentWorkspaceId = 'next';
    expect(s.subscription).toBeNull();
    expect(s.availableCredits).toBe(0);
    vi.mocked(getCurrentSubscription).mockResolvedValueOnce(details('standard') as never);
    await s.refresh();
    finish(details('premium') as never);
    await old;
    expect(s.subscription?.tier).toBe('standard');
  });
});
