// Guard 5.3.9 exposes on(), but no off(). Install one SDK dispatcher per event,
// and detach component callbacks from our registry on unmount.
type Listener = (...args: any[]) => void;
type GuardEmitter = { on: (event: any, listener: Listener) => void };
const registries = new WeakMap<GuardEmitter, Map<string, Set<Listener>>>();
export function subscribeGuardEvent(guard: GuardEmitter, event: string, listener: Listener) {
  let registry = registries.get(guard);
  if (!registry) registries.set(guard, (registry = new Map()));
  let listeners = registry.get(event);
  if (!listeners) {
    listeners = new Set();
    registry.set(event, listeners);
    const subscribers = listeners;
    guard.on(event, (...args) => {
      for (const callback of subscribers) callback(...args);
    });
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
