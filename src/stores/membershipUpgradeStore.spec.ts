import { createPinia, setActivePinia } from 'pinia';
// @vitest-environment happy-dom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { membershipUpgradeApi } from '@/api/membershipUpgradeApi';

import { useMembershipUpgradeStore } from './membershipUpgradeStore';
const mocks = vi.hoisted(() => ({ refresh: vi.fn().mockResolvedValue(undefined) }));
vi.mock('./membershipStore', () => ({ useMembershipStore: () => mocks }));
vi.mock('@/api/membershipUpgradeApi', () => ({
  membershipUpgradeApi: {
    options: vi.fn(),
    active: vi.fn(),
    detail: vi.fn(),
    quote: vi.fn(),
    create: vi.fn(),
    continue: vi.fn(),
    abandon: vi.fn(),
  },
}));
describe('membership upgrade session recovery', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    sessionStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(membershipUpgradeApi.options).mockResolvedValue({
      canManage: true,
      options: [],
    } as never);
    vi.mocked(membershipUpgradeApi.active).mockResolvedValue(null);
  });
  afterEach(() => vi.useRealTimers());
  it('reuses create idempotency after a timeout and never treats payment alone as completion', async () => {
    const s = useMembershipUpgradeStore();
    await s.load('workspace');
    s.quote = { id: 'quote' } as never;
    vi.mocked(membershipUpgradeApi.create)
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({
        id: 'op',
        state: 'FULFILLING',
        payment: { state: 'confirmed' },
        fulfillment: { state: 'pending' },
        renewal: { state: 'pending' },
        nextAction: { type: 'WAIT' },
        closedAt: null,
      } as never);
    await s.confirm();
    await s.confirm();
    expect(vi.mocked(membershipUpgradeApi.create).mock.calls[0][2]).toBe(
      vi.mocked(membershipUpgradeApi.create).mock.calls[1][2]
    );
    expect(s.terminal).toBe(false);
    expect(mocks.refresh).not.toHaveBeenCalled();
    s.stop();
  });
  it('restores server active operation, refreshes delivered benefits before renewal completes', async () => {
    vi.mocked(membershipUpgradeApi.active).mockResolvedValue({
      id: 'op',
      state: 'RENEWAL_PENDING',
      fulfillment: { state: 'committed' },
      renewal: { state: 'pending' },
      nextAction: { type: 'WAIT' },
      closedAt: null,
    } as never);
    const s = useMembershipUpgradeStore();
    await s.load('workspace');
    expect(s.operation?.id).toBe('op');
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(s.terminal).toBe(false);
    s.stop();
  });
  it('ignores a response from a previously selected workspace', async () => {
    let finish!: (v: never) => void;
    vi.mocked(membershipUpgradeApi.active).mockReturnValueOnce(
      new Promise(resolve => {
        finish = resolve;
      })
    );
    const s = useMembershipUpgradeStore();
    const first = s.load('old');
    s.switchWorkspace('new');
    finish({ id: 'old-op' } as never);
    await first;
    expect(s.workspaceId).toBe('new');
    expect(s.operation).toBeNull();
    s.stop();
  });
  it('restores the last completed operation after payment return and requotes with the original operation id', async () => {
    sessionStorage.setItem('membership-upgrade:last:workspace', 'op');
    const value = {
      id: 'op',
      version: 2,
      state: 'COMPLETED',
      fulfillment: { state: 'committed' },
      renewal: { state: 'ready' },
      nextAction: { type: 'NONE' },
      closedAt: '2026-09-20T00:00:00Z',
    };
    vi.mocked(membershipUpgradeApi.detail).mockResolvedValue(value as never);
    const s = useMembershipUpgradeStore();
    await s.load('workspace');
    expect(s.terminal).toBe(true);
    expect(s.operation?.id).toBe('op');
    s.operation = { ...value, state: 'RECONFIRM_REQUIRED', closedAt: null } as never;
    vi.mocked(membershipUpgradeApi.quote).mockResolvedValue({
      id: 'replacement',
      upgradeId: 'op',
    } as never);
    await s.getQuote('premium');
    expect(vi.mocked(membershipUpgradeApi.quote).mock.calls.at(-1)?.[1]).toEqual({
      targetPlanCode: 'premium',
      upgradeId: 'op',
    });
    expect(s.operation?.id).toBe('op');
    s.stop();
  });
  it('reuses abandon identity after a timeout and closing the view has no mutation', async () => {
    const s = useMembershipUpgradeStore();
    await s.load('workspace');
    s.operation = {
      id: 'op',
      version: 1,
      fulfillment: { state: 'pending' },
      renewal: { state: 'pending' },
      nextAction: { type: 'WAIT' },
      closedAt: null,
    } as never;
    s.closeView();
    expect(membershipUpgradeApi.abandon).not.toHaveBeenCalled();
    vi.mocked(membershipUpgradeApi.abandon)
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({
        ...s.operation,
        state: 'ABANDONED',
        closedAt: '2026-09-20T00:00:00Z',
      } as never);
    await s.abandon();
    await s.abandon();
    expect(vi.mocked(membershipUpgradeApi.abandon).mock.calls[0][3]).toBe(
      vi.mocked(membershipUpgradeApi.abandon).mock.calls[1][3]
    );
    expect(s.terminal).toBe(true);
    s.stop();
  });
});
