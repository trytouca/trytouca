// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import IORedis, { RedisOptions } from 'ioredis'

import { config } from '@/utils/config'
import logger from '@/utils/logger'

function getRedisOptions(): RedisOptions {
  const cloudOptions = config.redis.tlsCertificateFile
    ? {
        tls: {
          checkServerIdentity: () => undefined
        }
      }
    : {}
  return {
    host: config.redis.host,
    port: config.redis.port,
    showFriendlyErrorStack: config.env !== 'production',
    maxRetriesPerRequest: null,
    retryStrategy: () => 5000,
    ...cloudOptions
  }
}

export function createRedisConnection() {
  const client = new IORedis(getRedisOptions())
  client.on('error', (err) => {
    logger.warn('redis connection error: %s', err.message)
  })
  client.on('connect', () => {
    logger.debug('redis connections established')
  })
  client.on('ready', () => {
    logger.debug('redis client is ready')
  })
  return client
}

class RedisClient {
  private _client = createRedisConnection()
  async isReady() {
    return this._client.status === 'ready'
  }
  async shutdown() {
    logger.info('disconnecting from redis')
    if (this._client.status === 'ready') {
      await this._client.quit()
    }
  }
  async isCached(cacheKey: string): Promise<boolean> {
    return Boolean(await this._client.exists(cacheKey))
  }
  async getCached<T>(cacheKey: string): Promise<T> {
    const str = await this._client.get(cacheKey)
    return JSON.parse(str) as T
  }
  async cache(
    cacheKey: string,
    output: unknown,
    cacheDuration?: number
  ): Promise<boolean> {
    cacheDuration = cacheDuration || config.redis.durationShort
    return this._client
      .set(cacheKey, JSON.stringify(output), 'EX', cacheDuration)
      .then((value) => {
        if (value === 'OK') {
          logger.silly('%s: cached', cacheKey)
          return true
        }
        logger.warn('%s: failed to cache', cacheKey)
        return false
      })
      .catch((err) => {
        logger.warn('%s: failed to cache: %O', cacheKey, err)
        return false
      })
  }
  async removeCached(cacheKey: string): Promise<boolean> {
    return this._client
      .del(cacheKey)
      .then((value) => {
        logger.debug('%s: removed cached result', cacheKey)
        return Boolean(value)
      })
      .catch((err) => {
        logger.warn('%s: failed to remove cached result: %O', cacheKey, err)
        return false
      })
  }
  removeCachedByPrefix(prefix: string, suffix = ''): void {
    this._client
      .scanStream({ match: `${prefix}*${suffix}` })
      .on('data', (keys: string[]) => {
        if (keys.length) {
          const pipeline = this._client.pipeline()
          keys.forEach((k) => {
            pipeline.del(k)
            logger.info('%s: removed', k)
          })
          pipeline.exec()
        }
      })
      .on('end', () => true)
  }
}

export const rclient = new RedisClient()
