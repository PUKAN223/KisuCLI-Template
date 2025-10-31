import { PluginBase } from "./PluginBase.ts";

type Callback<T> = (payload: T) => void;

export class EventHandlers<AutoEvents extends Record<string, unknown>> {
  private autoListeners: Map<keyof AutoEvents, { owner?: PluginBase; cb: Callback<unknown> }[]> = new Map();
  private customListeners: Map<string, { owner?: PluginBase; cb: Callback<unknown> }[]> = new Map();

  /** Subscribe to events */
  // Overloads: on(event, callback) and on(owner, event, callback)
  public on<K extends keyof AutoEvents>(event: K, callback: Callback<AutoEvents[K]>): void;
  public on<K extends `Custom${string}`, T>(event: K, callback: Callback<T>): void;
  public on<K extends keyof AutoEvents>(owner: PluginBase, event: K, callback: Callback<AutoEvents[K]>): void;
  public on(...args: unknown[]): void {
    // on(event, callback)
    if (typeof args[0] === "string") {
      const event: string = args[0] as string;
      const callback: Callback<unknown> = args[1] as Callback<unknown>;
      const listeners = (event.startsWith("Custom")) ? this.customListeners : this.autoListeners;
      const list = listeners.get(event) ?? [];
      list.push({ cb: callback });
      listeners.set(event, list);
      return;
    }

    // on(owner, event, callback)
  const owner: PluginBase = args[0] as PluginBase;
  const event: string = args[1] as string;
  const callback: Callback<unknown> = args[2] as Callback<unknown>;
    const listeners = (event.startsWith("Custom")) ? this.customListeners : this.autoListeners;
    const list = listeners.get(event) ?? [];
    list.push({ owner, cb: callback });
    listeners.set(event, list);
  }

  /** Unsubscribe */
  // off(event, callback) or off(owner, event, callback)
  public off<K extends keyof AutoEvents | `Custom${string}`>(event: K, callback: Callback<unknown>): void;
  public off(owner: PluginBase, event: string, callback?: Callback<unknown>): void;
  public off(...args: unknown[]): void {
    // off(event, callback)
    if (typeof args[0] === "string") {
      const event: string = args[0] as string;
      const callback: Callback<unknown> = args[1] as Callback<unknown>;
      const listeners = (event.startsWith("Custom")) ? this.customListeners : this.autoListeners;
      const list = (listeners as Map<unknown, { owner?: unknown; cb: Callback<unknown> }[]>).get(event as unknown);
      if (!list) return;
      (listeners as Map<unknown, { owner?: unknown; cb: Callback<unknown> }[]>).set(event as unknown, list.filter(l => l.cb !== callback));
      return;
    }

    // off(owner, event, [callback])
  const owner: PluginBase = args[0] as PluginBase;
  const event: string = args[1] as string;
  const callback: Callback<unknown> | undefined = args[2] as Callback<unknown> | undefined;
    const listeners = (event.startsWith("Custom")) ? this.customListeners : this.autoListeners;
    const list = (listeners as Map<unknown, { owner?: unknown; cb: Callback<unknown> }[]>).get(event as unknown);
    if (!list) return;
    if (callback) {
      (listeners as Map<unknown, { owner?: unknown; cb: Callback<unknown> }[]>).set(event as unknown, list.filter(l => !(l.owner === owner && l.cb === callback)));
    } else {
      (listeners as Map<unknown, { owner?: unknown; cb: Callback<unknown> }[]>).set(event as unknown, list.filter(l => l.owner !== owner));
    }
  }

  /** Emit */
  public emit<K extends keyof AutoEvents>(event: K, payload: AutoEvents[K]): void;
  public emit<K extends `Custom${string}`, T>(event: K, payload: T): void;
  public emit(event: string, payload: unknown): void {
    const listeners = (event.startsWith("Custom")) ? this.customListeners : this.autoListeners;
    const list = (listeners as Map<unknown, { owner?: PluginBase; cb: Callback<unknown> }[]>).get(event as unknown);
    if (!list) return;
    for (const listener of list) {
      try {
        // If listener has an owner with isEnable defined, only run when true
        if (listener.owner) {
          const owner = listener.owner;
          if (typeof owner.isEnabled() !== 'undefined') {
            if (owner.isEnabled()) {
              (listener.cb as Callback<unknown>)(payload);
            }
          } else {
            (listener.cb as Callback<unknown>)(payload);
          }
        } else {
          (listener.cb as Callback<unknown>)(payload);
        }
  } catch (_e) {
        // swallow listener errors to avoid breaking emit loop
        // optionally could log
      }
    }
  }
}
