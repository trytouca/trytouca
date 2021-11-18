// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Client as HubspotClient } from '@hubspot/api-client'
import Mixpanel from 'mixpanel'

import { IUser } from '@/schemas/user'
import { config } from '@/utils/config'
import logger from '@/utils/logger'
import { rclient as redis } from '@/utils/redis'

export async function getChatToken(user: IUser): Promise<string> {
  if (!config.tracking.hubspot_key || !user._id) {
    return
  }
  const cacheKey = `chat_token_${user._id}`
  if (await redis.isCached(cacheKey)) {
    logger.silly('returning chat token from cache')
    return await redis.getCached(cacheKey)
  }
  logger.debug('asking hubspot for chat token')
  const hub = new HubspotClient({ apiKey: config.tracking.hubspot_key })
  const api = hub.conversations.visitorIdentification.generateApi
  const response = await api.generateToken({ email: user.email })
  const token = response.body.token
  redis.cache(cacheKey, token, 36000) // store this key for 10 hours
  return token
}

export type TrackerInfo = {
  avatar: string
  created_at: Date
  email: string
  ip_address: string
  name: string
  first_name: string
  last_name: string
  user_id: string
  username: string
}

class Tracker {
  private mixpanel: Mixpanel.Mixpanel

  constructor() {
    if (config.tracking.mixpanel) {
      this.mixpanel = Mixpanel.init(config.tracking.mixpanel)
    }
  }

  async create(user: IUser, data: Partial<TrackerInfo>) {
    this.mixpanel?.people.set(user._id, {
      $avatar: data.avatar,
      $created: data.created_at?.toISOString(),
      $email: data.email,
      $name: data.name,
      $first_name: data.first_name,
      $last_name: data.last_name,
      $ip: data.ip_address,
      username: data.username
    })
    return Promise.resolve()
  }

  track(user: IUser, name: string, data?: Mixpanel.PropertyDict) {
    this.mixpanel?.track(name, {
      distinct_id: user._id,
      ...data
    })
  }
}

export const tracker = new Tracker()
