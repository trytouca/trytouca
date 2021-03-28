/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import Redis from 'ioredis'

import { config } from '@weasel/utils/config'
import logger from '@weasel/utils/logger'

export const client = new Redis({
  host: config.redis.host,
  lazyConnect: true,
  port: config.redis.port,
  showFriendlyErrorStack: config.env !== 'production'
})

/**
 * enables logging of redis connection events. To be called after the initial
 * connection is established.
 */
function configureConnectionEventHandling(): void {
  client.on('error', (err) => {
    logger.warn('redis connection error: %s', err.message)
  })
  client.on('connect', () => {
    logger.debug('redis connections established')
  })
  client.on('ready', () => {
    logger.debug('redis client is ready')
  })
}

/**
 * attempt to connect to the redis cache server.
 *
 * @returns {Promise<boolean>} true if connection is successful
 */
export async function makeConnectionRedis(): Promise<boolean> {
  try {
    client.on('error', (err) => {
      // we suppress error emission here to prevent duplicate error messages
      // during application startup. once the connection is established, we
      // enable logging of all errors.
    })
    await client.connect()
  } catch (err) {
    logger.warn('redis connection error: %s', err.message)
  }

  // periodically check if redis client manages to establish the connection.

  // number of times to check on redis client
  const kMaxAttempts = 12
  // time interval (ms) to check if connection retry strategy of the redis
  // client has worked
  const kTimeout = 5000

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  for (let i = 1; i <= kMaxAttempts; i++) {
    if (client.status === 'ready') {
      logger.info('successfully connected to cache server')
      // once connection is established, we would like to enable logging
      // of future connection events.
      configureConnectionEventHandling()
      return true
    }
    logger.warn('failed to connect to cache server (%d/%d)', i, kMaxAttempts)
    await delay(kTimeout)
  }

  // if we failed to connect after exhausting all of our attempts,
  // assume that the database is down or has a fatal startup failure
  // in which case we cannot continue.

  logger.error('exhausted attempts to connect to cache server')
  return false
}

/**
 *
 */
async function isCached(cacheKey: string): Promise<boolean> {
  return Boolean(await client.exists(cacheKey))
}

/**
 *
 */
async function getCached<T>(cacheKey: string): Promise<T> {
  const str = await client.get(cacheKey)
  return JSON.parse(str) as T
}

/**
 *
 */
async function cache(
  cacheKey: string,
  output: unknown,
  cacheDuration?: number
): Promise<boolean> {
  cacheDuration = cacheDuration || config.redis.durationShort
  return client
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

async function removeCached(cacheKey: string): Promise<boolean> {
  return client
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

function removeCachedByPrefix(prefix: string): void {
  client
    .scanStream({ match: `${prefix}*` })
    .on('data', (keys: string[]) => {
      if (keys.length) {
        const pipeline = client.pipeline()
        keys.forEach((k) => {
          pipeline.del(k)
          logger.info('%s: removed', k)
        })
        pipeline.exec()
      }
    })
    .on('end', () => true)
}

export const rclient = {
  cache,
  getCached,
  isCached,
  removeCached,
  removeCachedByPrefix
}
