export interface LatestRequestGuard {
  begin(): number;
  invalidate(): void;
  isCurrent(requestGeneration: number): boolean;
}

export interface SerialTaskQueue {
  run<T>(task: () => Promise<T>): Promise<T>;
}

export function createLatestRequestGuard(): LatestRequestGuard {
  let currentGeneration = 0;

  return {
    begin() {
      return ++currentGeneration;
    },
    invalidate() {
      currentGeneration++;
    },
    isCurrent(requestGeneration: number) {
      return requestGeneration === currentGeneration;
    },
  };
}

export function createSerialTaskQueue(): SerialTaskQueue {
  let queueTail: Promise<unknown> = Promise.resolve();

  return {
    run<T>(task: () => Promise<T>) {
      const result = queueTail.then(task, task);
      queueTail = result.catch(() => undefined);
      return result;
    },
  };
}
