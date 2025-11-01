import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';

/**
 * CacheService provides methods for interacting with Redis cache
 */
@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.cacheManager.get<T>(key);
    return value || null;
  }

  /**
   * Set value in cache with optional TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (optional)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (ttl) {
      await this.cacheManager.set(key, value, ttl * 1000); // Convert to milliseconds
    } else {
      await this.cacheManager.set(key, value);
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Invalidate multiple keys matching a pattern
   * Note: This requires additional setup with ioredis client for pattern matching
   */
  async invalidate(pattern: string): Promise<void> {
    // Simple implementation - delete exact key
    // For pattern matching, you'd need direct ioredis access
    await this.delete(pattern);
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    await this.cacheManager.clear();
  }

  /**
   * Wrap a function with caching
   * @param key Cache key
   * @param fn Function to execute if cache miss
   * @param ttl Time to live in seconds
   */
  async wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, ttl);
    return result;
  }
}
