import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';

/**
 * Cache module wrapping Redis functionality
 */
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModuleWrapper {}
