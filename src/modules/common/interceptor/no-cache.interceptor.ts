import { ExecutionContext } from '@nestjs/common';
import { IGNORE_CACHE_KEY } from '../decorator/no-cache.decorator';
import { CacheInterceptor } from '@nestjs/cache-manager';

export class NoCacheInterceptor extends CacheInterceptor {
  protected isRequestCacheable(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const request = http.getRequest();

    const ignoreCaching: boolean = this.reflector.get(
      IGNORE_CACHE_KEY,
      context.getHandler(),
    );
    if (ignoreCaching) {
      return false;
    }
    return request.method === 'GET';

  }
}