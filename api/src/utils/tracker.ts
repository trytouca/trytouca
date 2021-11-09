// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { createHmac } from 'crypto'
import { Client as IntercomClient } from 'intercom-client'
import Mixpanel from 'mixpanel'

import { IUser } from '@/schemas/user'
import { config } from '@/utils/config'

/**
 *
 */
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

/**
 *
 */
export function intercomHash(user_id: string) {
  if (!config.tracking.intercom_secret) {
    return
  }
  return createHmac('sha256', config.tracking.intercom_secret)
    .update(user_id)
    .digest('hex')
}

/**
 *
 */
class Tracker {
  private intercom: IntercomClient
  private mixpanel: Mixpanel.Mixpanel

  constructor() {
    if (config.tracking.intercom_token) {
      this.intercom = new IntercomClient({
        token: config.tracking.intercom_token
      })
      this.intercom.useRequestOpts({
        headers: {
          'Intercom-Version': 1.4
        }
      })
    }
    if (config.tracking.mixpanel) {
      this.mixpanel = Mixpanel.init(config.tracking.mixpanel)
    }
  }

  async create(user: IUser, data: Partial<TrackerInfo>) {
    const intercom_registered = this.intercom?.users.create({
      user_id: user._id,
      signed_up_at: data.created_at
        ? Math.floor(data.created_at.getTime() / 1000)
        : undefined,
      email: data.email,
      name: data.name,
      last_seen_ip: data.ip_address,
      custom_attributes: {
        username: data.username
      }
    })
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
    return Promise.all([intercom_registered])
  }

  track(user: IUser, name: string, data?: Mixpanel.PropertyDict) {
    this.intercom?.events.create({
      event_name: name,
      created_at: Math.floor(Date.now() / 1000),
      user_id: user._id,
      metadata: data
    })
    this.mixpanel?.track(name, {
      distinct_id: user._id,
      ...data
    })
  }
}

/**
 *
 */
export const tracker = new Tracker()
