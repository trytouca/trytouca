// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import e from 'express'

import { inboxList } from '../controllers/inbox/list.js'
import { inboxSeen } from '../controllers/inbox/seen.js'
import * as middleware from '../middlewares/index.js'
import { promisable } from '../utils/routing.js'

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
