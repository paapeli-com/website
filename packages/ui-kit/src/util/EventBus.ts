type Callback<T = any> = (payload: T) => void;

export class EventBus{
  private events: Map<string, Callback[]> = new Map();
  private lastPayloads: Map<string, any> = new Map();

  // Register an event
  on(eventName: string, cb: Callback): void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName)!.push(cb);

    // Fire immediately if there's a saved payload
    if (this.lastPayloads.has(eventName)) {
      cb(this.lastPayloads.get(eventName));
    }
  }

  // Remove an event listener
  off(eventName: string, cb: Callback): void {
    const cbs = this.events.get(eventName);
    if (!cbs) return;

    this.events.set(
      eventName,
      cbs.filter(listener => listener !== cb)
    );

    // If no listeners left, clean up
    if (this.events.get(eventName)!.length === 0) {
      this.events.delete(eventName);
    }
  }

  // Dispatch an event
  dispatch(eventName: string, payload?: any, saveFire: boolean = false): void {
    if (saveFire) {
      this.lastPayloads.set(eventName, payload);
    }

    const cbs = this.events.get(eventName);
    if (cbs) {
      cbs.forEach(cb => cb(payload));
    }
  }
}
