import { describe, expect, it, vi } from 'vite-plus/test';

import { subscribeGuardEvent } from './guardEvents';
import { singleFlight } from './singleFlight';
describe('login concurrency', () => {
  it('shares calls for the same token and releases failed calls for retry', async () => {
    const operation = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValue('ok');
    const sync = singleFlight(operation);
    const first = sync('token');
    expect(sync('token')).toBe(first);
    await expect(first).rejects.toThrow('network');
    await expect(sync('token')).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
  });
  it('does not share different tokens', async () => {
    const operation = vi.fn().mockResolvedValue('ok');
    const sync = singleFlight(operation);
    await Promise.all([sync('a'), sync('b')]);
    expect(operation).toHaveBeenCalledTimes(2);
  });
  it('detaches unmounted callbacks without accumulating SDK subscriptions', () => {
    const on = vi.fn();
    const guard = { on };
    const old = vi.fn();
    const off = subscribeGuardEvent(guard, 'login', old);
    off();
    const current = vi.fn();
    subscribeGuardEvent(guard, 'login', current);
    on.mock.calls[0][1]('user');
    expect(old).not.toHaveBeenCalled();
    expect(current).toHaveBeenCalledWith('user');
    expect(on).toHaveBeenCalledTimes(1);
  });
});
