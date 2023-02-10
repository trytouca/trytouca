// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import SegmentClient from 'analytics-node'

import { relay } from '../models/index.js'
import { IUser } from '../schemas/index.js'
import { config } from './config.js'

type ActivityType =
  | 'account:activated'
  | 'account:activation_link_resent'
  | 'account:created'
  | 'account:deleted'
  | 'account:logged_in'
  | 'account:logged_out'
  | 'account:password_remind'
  | 'account:password_resent'
  | 'account:password_reset'
  | 'batch:deleted'
  | 'batch:pdf_exported'
  | 'batch:promoted'
  | 'batch:zip_exported'
  | 'batch:sealed'
  | 'client:login'
  | 'client:submit'
  | 'comment:created'
  | 'comment:deleted'
  | 'comment:edited'
  | 'comment:replied'
  | 'feature_flag:updated'
  | 'profile:updated'
  | 'self_host:installed'
  | 'self_host:usage_reported'
  | 'suite:created'
  | 'suite:deleted'
  | 'suite:subscribed'
  | 'team:created'
  | 'team:deleted'
  | 'team_member:accepted'
  | 'team_member:added'
  | 'team_member:approved'
  | 'team_member:declined'
  | 'team_member:left'
  | 'team_member:received'
  | 'team_member:rejected'
  | 'team_member:removed'
  | 'team_member:rescinded'
  | 'team_member:requested'
  | 'team_member:promoted'
  | 'team_member:invited'
  | 'team_member:withdrawn'

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

  async add_activity(
    type: ActivityType,
    user: IUser,
    data: Partial<TrackerInfo>
  ) {
    const allowlist: Array<ActivityType> = [
      'account:created',
      'batch:promoted',
      'batch:sealed',
      'profile:updated',
      'self_host:installed',
      'suite:created',
      'team:created'
    ]
    if (!allowlist.includes(type)) {
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

class SegmentTracker {
  private segment: SegmentClient
  constructor() {
    if (config.tracking.segment_key) {
      this.segment = new SegmentClient(config.tracking.segment_key)
    }
  }
  async add_member(user: IUser, data: Partial<TrackerInfo>) {
    this.segment?.identify({
      userId: user._id.toString(),
      traits: {
        avatar: data.avatar,
        createdAt: data.created_at?.toISOString(),
        email: data.email,
        firstName: data.first_name,
        id: data.user_id?.toString(),
        lastName: data.last_name,
        name: data.name,
        username: data.username
      }
    })
  }
  async add_activity(
    type: ActivityType,
    user: IUser,
    data: Partial<TrackerInfo>
  ) {
    this.segment?.track({
      userId: user._id.toString(),
      event: type,
      properties: data
    })
  }
}

class Analytics {
  private orbit_tracker = new OrbitTracker()
  private segment_tracker = new SegmentTracker()

  constructor() {
    if (config.tracking.orbit_key) {
      this.orbit_tracker = new OrbitTracker()
    }
    if (config.tracking.segment_key) {
      this.segment_tracker = new SegmentTracker()
    }
  }

  async add_member(user: IUser, data: Partial<TrackerInfo>): Promise<void> {
    await Promise.allSettled([
      this.orbit_tracker?.add_member(user, data),
      this.segment_tracker?.add_member(user, data)
    ])
  }

  async add_activity(
    type: ActivityType,
    user: IUser,
    data?: Record<string, unknown>
  ) {
    await Promise.allSettled([
      this.orbit_tracker?.add_activity(type, user, data),
      this.segment_tracker?.add_activity(type, user, data)
    ])
  }
}

export const analytics = new Analytics()
