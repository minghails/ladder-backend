import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_RPC_READ_CACHE_TTL_MS, RpcReadCache } from './rpc-read-cache';

describe('RpcReadCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns undefined on cache miss', () => {
    const cache = new RpcReadCache<string>(5_000);

    expect(cache.get('market:0xabc')).toBeUndefined();
  });

  it('returns the same value within TTL', () => {
    const cache = new RpcReadCache<{ nav: string }>(5_000);
    const value = { nav: '100' };

    cache.set('market:0xabc', value);

    expect(cache.get('market:0xabc')).toBe(value);
    vi.advanceTimersByTime(4_999);
    expect(cache.get('market:0xabc')).toBe(value);
  });

  it('expires entries after TTL', () => {
    const cache = new RpcReadCache<string>(5_000);

    cache.set('market:0xabc', 'cached');

    vi.advanceTimersByTime(5_000);

    expect(cache.get('market:0xabc')).toBeUndefined();
  });

  it('isolates entries by key', () => {
    const cache = new RpcReadCache<string>(5_000);

    cache.set('market:0xaaa', 'a');
    cache.set('market:0xbbb', 'b');

    expect(cache.get('market:0xaaa')).toBe('a');
    expect(cache.get('market:0xbbb')).toBe('b');
    expect(cache.get('token:0xaaa')).toBeUndefined();
  });

  it('overwrites an existing key on set', () => {
    const cache = new RpcReadCache<string>(5_000);

    cache.set('market:0xabc', 'first');
    cache.set('market:0xabc', 'second');

    expect(cache.get('market:0xabc')).toBe('second');
  });
});

describe('DEFAULT_RPC_READ_CACHE_TTL_MS', () => {
  it('matches the documented default of 15000 ms', () => {
    expect(DEFAULT_RPC_READ_CACHE_TTL_MS).toBe(15_000);
  });
});
