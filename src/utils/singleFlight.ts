/** Share only in-flight calls for a token; never retain tokens after settlement. */
export function singleFlight<A extends unknown[], R>(
  operation: (key: string, ...args: A) => Promise<R>
) {
  const pending = new Map<string, Promise<R>>();
  return (key: string, ...args: A): Promise<R> => {
    const existing = pending.get(key);
    if (existing) return existing;
    const promise = Promise.resolve()
      .then(() => operation(key, ...args))
      .finally(() => pending.delete(key));
    pending.set(key, promise);
    return promise;
  };
}
