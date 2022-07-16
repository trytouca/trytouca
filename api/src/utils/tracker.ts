// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Client as HubspotClient } from '@hubspot/api-client'
import Mixpanel from 'mixpanel'

import { relay } from '@/models/relay'
import { IUser } from '@/schemas/user'
import { config } from '@/utils/config'
import logger from '@/utils/logger'
import { rclient as redis } from '@/utils/redis'

export enum EActivity {
  AccountActivated = 'account:activated',
  AccountActivationResent = 'account:activation_link_resent',
  AccountCreated = 'account:created',
  AccountDeleted = 'account:deleted',
  AccountLoggedIn = 'account:logged_in',
  AccountLoggedOut = 'account:logged_out',
  AccountPasswordRemind = 'account:password_remind',
  AccountPasswordResent = 'account:password_resent',
  AccountPasswordReset = 'account:password_reset',
  BatchDeleted = 'batch:deleted',
  BatchPDFExported = 'batch:pdf_exported',
  BatchPromoted = 'batch:promoted',
  BatchZipExported = 'batch:zip_exported',
  BatchSealed = 'batch:sealed',
  CommentCreated = 'comment:created',
  CommentDeleted = 'comment:deleted',
  CommentEdited = 'comment:edited',
  CommentReplied = 'comment:replied',
  FeatureFlagUpdated = 'feature_flag:updated',
  ProfileUpdated = 'profile:updated',
  SelfHostedInstall = 'self_host:installed',
  SuiteCreated = 'suite:created',
  SuiteSubscribed = 'suite:subscribed',
  TeamCreated = 'team:created'
}

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
  const token = response.token
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

class OrbitTracker {
  async add_member(user: IUser, data: Partial<TrackerInfo>) {
    await relay({
      host: 'https://app.orbit.love',
      path: '/api/v1/touca/members',
      authorization: `Bearer ${config.tracking.orbit_key}`,
      data: JSON.stringify({
        member: {
          email: data.email,
          name: data.name,
          slug: data.username
        },
        identity: {
          uid: user._id,
          email: data.email,
          name: data.name,
          username: data.username,
          source: 'touca',
          source_host: config.express.root
        }
      })
    })
  }

  async add_activity(type: EActivity, user: IUser, data: Partial<TrackerInfo>) {
    if (
      ![
        EActivity.AccountCreated,
        EActivity.BatchPromoted,
        EActivity.BatchSealed,
        EActivity.SelfHostedInstall,
        EActivity.SuiteCreated,
        EActivity.ProfileUpdated,
        EActivity.TeamCreated
      ].includes(type)
    ) {
      return
    }
    await relay({
      host: 'https://app.orbit.love',
      path: '/api/v1/touca/activities',
      authorization: `Bearer ${config.tracking.orbit_key}`,
      data: JSON.stringify({
        activity: {
          activity_type_key: type,
          occurred_at: new Date().toISOString(),
          properties: data,
          title: type
        },
        identity: {
          uid: user._id,
          source: 'touca',
          source_host: config.express.root
        }
      })
    })
  }
}

class Analytics {
  private mixpanel: Mixpanel.Mixpanel
  private orbit_tracker: OrbitTracker

  constructor() {
    if (config.tracking.mixpanel) {
      this.mixpanel = Mixpanel.init(config.tracking.mixpanel)
    }
    if (config.tracking.orbit_key) {
      this.orbit_tracker = new OrbitTracker()
    }
  }

  async add_member(user: IUser, data: Partial<TrackerInfo>) {
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
    this.orbit_tracker?.add_member(user, data)
    return Promise.resolve()
  }

  add_activity(type: EActivity, user: IUser, data?: Mixpanel.PropertyDict) {
    this.mixpanel?.track(type, {
      distinct_id: user._id,
      ...data
    })
    this.orbit_tracker?.add_activity(type, user, data)
  }
}

export const analytics = new Analytics()
