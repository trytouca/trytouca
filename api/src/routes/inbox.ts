// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Router } from 'express'

import { inboxList, inboxSeen } from '../controllers/inbox/index.js'
import { isAuthenticated } from '../middlewares/index.js'
import { promisable } from '../utils/index.js'

const router = Router()

router.get(
  '/',
  isAuthenticated,
  promisable(inboxList, 'list user notifications')
)

router.post(
  '/seen',
  isAuthenticated,
  promisable(inboxSeen, 'mark user notifications as seen')
)

export { router as inboxRouter }
