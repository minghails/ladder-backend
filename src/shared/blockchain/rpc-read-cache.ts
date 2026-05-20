/** Default TTL for in-process RPC read cache (15s). */
export const DEFAULT_RPC_READ_CACHE_TTL_MS = 15_000;

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

/**
 * Process-local TTL cache for live contract reads.
 * Keys are caller-defined (e.g. method + address); values are not cloned.
 */
export class RpcReadCache<T = unknown> {
  private readonly entries = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (entry === undefined) {
      return undefined;
    }
    if (Date.now() >= entry.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.entries.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }
}
