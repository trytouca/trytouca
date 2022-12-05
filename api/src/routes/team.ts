// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { ETeamRole } from '@touca/api-schema'
import express from 'express'
import * as ev from 'express-validator'

import { ctrlTeamCreate } from '../controllers/team/create.js'
import { teamInviteAccept } from '../controllers/team/inviteAccept.js'
import { teamInviteAdd } from '../controllers/team/inviteAdd.js'
import { teamInviteDecline } from '../controllers/team/inviteDecline.js'
import { teamInviteRescind } from '../controllers/team/inviteRescind.js'
import { teamJoinAccept } from '../controllers/team/joinAccept.js'
import { teamJoinAdd } from '../controllers/team/joinAdd.js'
import { teamJoinDecline } from '../controllers/team/joinDecline.js'
import { teamJoinRescind } from '../controllers/team/joinRescind.js'
import { teamLeave } from '../controllers/team/leave.js'
import { ctrlTeamList } from '../controllers/team/list.js'
import { ctrlTeamLookup } from '../controllers/team/lookup.js'
import { teamMemberAdd } from '../controllers/team/memberAdd.js'
import { teamMemberList } from '../controllers/team/memberList.js'
import { teamMemberRemove } from '../controllers/team/memberRemove.js'
import { teamMemberUpdate } from '../controllers/team/memberUpdate.js'
import { teamPopulate } from '../controllers/team/populate.js'
import { ctrlTeamRemove } from '../controllers/team/remove.js'
import { teamUpdate } from '../controllers/team/update.js'
import * as middleware from '../middlewares/index.js'
import { promisable } from '../utils/routing.js'

const router = express.Router()

router.get(
  '/',
  middleware.isAuthenticated,
  promisable(ctrlTeamList, 'list teams')
)

router.post(
  '/',
  middleware.isAuthenticated,
  express.json(),
  middleware.inputs([
    middleware.validationRules
      .get('entity-name')
      .exists()
      .withMessage('required'),
    middleware.validationRules
      .get('entity-slug')
      .exists()
      .withMessage('required')
  ]),
  promisable(ctrlTeamCreate, 'create team')
)

router.get(
  '/:team',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  promisable(ctrlTeamLookup, 'lookup team')
)

router.patch(
  '/:team',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamOwner,
  express.json(),
  middleware.inputs([
    middleware.validationRules.get('entity-name').optional(),
    middleware.validationRules.get('entity-slug').optional()
  ]),
  promisable(teamUpdate, 'update team')
)

router.delete(
  '/:team',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamOwner,
  promisable(ctrlTeamRemove, 'remove team')
)

router.post(
  '/:team/populate',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  promisable(teamPopulate, 'populate team with sample data')
)

router.post(
  '/:team/invite',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamAdmin,
  express.json(),
  middleware.inputs([
    middleware.validationRules.get('email'),
    middleware.validationRules.get('fullname')
  ]),
  promisable(teamInviteAdd, 'invite user to team')
)

router.post(
  '/:team/invite/rescind',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamAdmin,
  express.json(),
  middleware.inputs([middleware.validationRules.get('email')]),
  promisable(teamInviteRescind, 'rescind team invitation')
)

router.post(
  '/:team/invite/accept',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamInvitee,
  promisable(teamInviteAccept, 'join team')
)

router.post(
  '/:team/invite/decline',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamInvitee,
  promisable(teamInviteDecline, 'decline team invitation')
)

router.post(
  '/:team/leave',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  promisable(teamLeave, 'leave from team')
)

router.get(
  '/:team/member',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  promisable(teamMemberList, 'list team members')
)

router.post(
  '/:team/member/:account',
  middleware.isAuthenticated,
  middleware.isPlatformAdmin,
  middleware.hasTeam,
  middleware.hasAccount,
  promisable(teamMemberAdd, 'add member to team')
)

router.patch(
  '/:team/member/:member',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamAdmin,
  middleware.hasMember,
  express.json(),
  middleware.inputs([
    ev
      .body('role')
      .custom(
        (v: ETeamRole) =>
          v === 'applicant' ||
          v === 'invited' ||
          v === 'member' ||
          v === 'admin'
      )
      .withMessage('invalid')
  ]),
  promisable(teamMemberUpdate, 'update member role in team')
)

router.delete(
  '/:team/member/:member',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamAdmin,
  middleware.hasMember,
  promisable(teamMemberRemove, 'remove team member')
)

router.post(
  '/:team/join',
  middleware.isAuthenticated,
  middleware.hasTeam,
  promisable(teamJoinAdd, 'request to join')
)

router.delete(
  '/:team/join',
  middleware.isAuthenticated,
  middleware.hasTeam,
  promisable(teamJoinRescind, 'rescind join request')
)

router.post(
  '/:team/join/:account',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamAdmin,
  middleware.hasAccount,
  promisable(teamJoinAccept, 'accept join request')
)

router.delete(
  '/:team/join/:account',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamAdmin,
  middleware.hasAccount,
  promisable(teamJoinDecline, 'decline join request')
)

export { router as teamRouter }
