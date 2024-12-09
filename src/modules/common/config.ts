import type { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-ioredis';

export async function redisConfig(
  configService: ConfigService,
): Promise<RedisOptions> {
  const env = configService.get<string>('APP_ENV');

  if (env === 'dev' || env === 'local-prod') {
    return {
      ttl: Number(configService.get('CACHE_TTL') || 60),
      max: Number(configService.get('CACHE_MAX') || 100),
      store: redisStore,
      host: configService.get<string>('CACHE_HOST', 'localhost'),
      port: Number(configService.get<string>('CACHE_PORT', '6379')),
    };
  }

  if (env === 'prod') {
    const redisTlsUrl = configService.get<string>('REDIS_TLS_URL');
    if (!redisTlsUrl) {
      throw new Error(
        'REDIS_TLS_URL is not defined in the environment variables.',
      );
    }

    const dbHost = redisTlsUrl.split('@')[1]?.split(':')[0];
    if (!dbHost) {
      throw new Error(
        'Invalid REDIS_TLS_URL format. Expected format: redis://username:password@host:port',
      );
    }

    return {
      ttl: Number(configService.get('CACHE_TTL') || 60),
      max: Number(configService.get('CACHE_MAX') || 100),
      store: redisStore,
      url: redisTlsUrl,
      tls: {
        servername: dbHost,
        rejectUnauthorized: false, // Only use this in non-strict environments
      },
    };
  }

  throw new Error(`Unsupported environment: ${env}`);
}

interface RedisOptions extends CacheModuleOptions {
  store: any;
  host?: string;
  port?: number;
  url?: string;
  tls?: {
    servername: string;
    rejectUnauthorized: boolean;
  };
}
