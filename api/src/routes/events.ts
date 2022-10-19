import { Router } from 'express'
import * as middleware from '@/middlewares'
import ServerEvents from 'services/serverEvents'

const router = Router()

router.get('/', middleware.isAuthenticated, ServerEvents.handle)

export { router as eventsRouter }
