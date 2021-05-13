/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import Mixpanel from 'mixpanel'

import { IUser } from '@/schemas/user'
import { config } from '@/utils/config'

/**
 *
 */
class Tracker {
  private mixpanel: Mixpanel.Mixpanel

  /**
   *
   */
  constructor() {
    if (config.tracking.mixpanel) {
      this.mixpanel = Mixpanel.init(config.tracking.mixpanel)
    }
  }

  /**
   *
   */
  create(user: IUser, data: Mixpanel.PropertyDict) {
    this.mixpanel?.people.set(user._id, data)
  }

  /**
   *
   */
  track(user: IUser, name: string, data?: Mixpanel.PropertyDict) {
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
