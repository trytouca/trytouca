// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import express from 'express'

import { telemetry } from '@/controllers/relay/telemetry'
import * as middleware from '@/middlewares'
import { promisable } from '@/utils/routing'

const router = express.Router()

router.post(
  '/telemetry',
  middleware.isCloudInstance,
  promisable(telemetry, 'process submitted usage report')
)

export { router as relayRouter }
