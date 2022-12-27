// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Router } from 'express'

import { inboxList, inboxSeen } from '../controllers/inbox/index.js'
import { isAuthenticated, standby } from '../middlewares/index.js'

const router = Router()

router.get('/', isAuthenticated, standby(inboxList, 'list user notifications'))

router.post(
  '/seen',
  isAuthenticated,
  standby(inboxSeen, 'mark user notifications as seen')
)

export { router as inboxRouter }
