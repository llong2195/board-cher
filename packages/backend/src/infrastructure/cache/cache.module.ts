import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';

/**
 * Cache module wrapping Redis functionality
 */
@Module({
  imports: [
    CacheModule.register({
      ttl: 60 * 1000, // 60 seconds default TTL
      max: 100, // Maximum number of items in cache
      isGlobal: true, // Make cache available globally
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, CacheModule],
})
export class CacheModuleWrapper {}
