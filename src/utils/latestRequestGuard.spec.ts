import { describe, expect, it } from 'vitest';

import { createLatestRequestGuard, createSerialTaskQueue } from './latestRequestGuard';

describe('createLatestRequestGuard', () => {
  it('invalidates older requests when a newer request begins', () => {
    const guard = createLatestRequestGuard();
    const firstRequest = guard.begin();
    const secondRequest = guard.begin();

    expect(guard.isCurrent(firstRequest)).toBe(false);
    expect(guard.isCurrent(secondRequest)).toBe(true);
  });

  it('invalidates the active request when its owner closes', () => {
    const guard = createLatestRequestGuard();
    const request = guard.begin();

    guard.invalidate();

    expect(guard.isCurrent(request)).toBe(false);
  });
});

describe('createSerialTaskQueue', () => {
  it('does not start a newer task until the previous task settles', async () => {
    const queue = createSerialTaskQueue();
    let finishFirst!: () => void;
    const firstFinished = new Promise<void>(resolve => {
      finishFirst = resolve;
    });
    const calls: string[] = [];

    const first = queue.run(async () => {
      calls.push('first:start');
      await firstFinished;
      calls.push('first:end');
    });
    const second = queue.run(async () => {
      calls.push('second:start');
    });

    await Promise.resolve();
    expect(calls).toEqual(['first:start']);

    finishFirst();
    await Promise.all([first, second]);
    expect(calls).toEqual(['first:start', 'first:end', 'second:start']);
  });
});
