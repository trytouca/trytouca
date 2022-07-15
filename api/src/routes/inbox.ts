// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import e from 'express'

import { inboxList } from '@/controllers/inbox/list'
import { inboxSeen } from '@/controllers/inbox/seen'
import * as middleware from '@/middlewares'
import { promisable } from '@/utils/routing'

const router = e.Router()

router.get(
  '/',
  middleware.isAuthenticated,
  promisable(inboxList, 'list user notifications')
)

router.post(
  '/seen',
  middleware.isAuthenticated,
  promisable(inboxSeen, 'mark user notifications as seen')
)

export { router as inboxRouter }
