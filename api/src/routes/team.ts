// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import type { ETeamRole } from '@touca/api-schema'
import express from 'express'
import * as ev from 'express-validator'

import {
  ctrlTeamCreate,
  ctrlTeamList,
  ctrlTeamLookup,
  ctrlTeamRemove,
  teamInviteAccept,
  teamInviteAdd,
  teamInviteDecline,
  teamInviteRescind,
  teamJoinAccept,
  teamJoinAdd,
  teamJoinDecline,
  teamJoinRescind,
  teamLeave,
  teamMemberAdd,
  teamMemberList,
  teamMemberRemove,
  teamMemberUpdate,
  teamPopulate,
  teamUpdate
} from '../controllers/team/index.js'
import {
  hasAccount,
  hasMember,
  hasTeam,
  isAuthenticated,
  isPlatformAdmin,
  isTeamAdmin,
  isTeamInvitee,
  isTeamMember,
  isTeamOwner,
  validationMap,
  validationRules
} from '../middlewares/index.js'
import { promisable } from '../utils/index.js'

const router = express.Router()

router.get('/', isAuthenticated, promisable(ctrlTeamList, 'list teams'))

router.post(
  '/',
  isAuthenticated,
  express.json(),
  validationRules([
    validationMap.get('entity-name').exists().withMessage('required'),
    validationMap.get('entity-slug').exists().withMessage('required')
  ]),
  promisable(ctrlTeamCreate, 'create team')
)

router.get(
  '/:team',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  promisable(ctrlTeamLookup, 'lookup team')
)

router.patch(
  '/:team',
  isAuthenticated,
  hasTeam,
  isTeamOwner,
  express.json(),
  validationRules([
    validationMap.get('entity-name').optional(),
    validationMap.get('entity-slug').optional()
  ]),
  promisable(teamUpdate, 'update team')
)

router.delete(
  '/:team',
  isAuthenticated,
  hasTeam,
  isTeamOwner,
  promisable(ctrlTeamRemove, 'remove team')
)

router.post(
  '/:team/populate',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  promisable(teamPopulate, 'populate team with sample data')
)

router.post(
  '/:team/invite',
  isAuthenticated,
  hasTeam,
  isTeamAdmin,
  express.json(),
  validationRules([validationMap.get('email'), validationMap.get('fullname')]),
  promisable(teamInviteAdd, 'invite user to team')
)

router.post(
  '/:team/invite/rescind',
  isAuthenticated,
  hasTeam,
  isTeamAdmin,
  express.json(),
  validationRules([validationMap.get('email')]),
  promisable(teamInviteRescind, 'rescind team invitation')
)

router.post(
  '/:team/invite/accept',
  isAuthenticated,
  hasTeam,
  isTeamInvitee,
  promisable(teamInviteAccept, 'join team')
)

router.post(
  '/:team/invite/decline',
  isAuthenticated,
  hasTeam,
  isTeamInvitee,
  promisable(teamInviteDecline, 'decline team invitation')
)

router.post(
  '/:team/leave',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  promisable(teamLeave, 'leave from team')
)

router.get(
  '/:team/member',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  promisable(teamMemberList, 'list team members')
)

router.post(
  '/:team/member/:account',
  isAuthenticated,
  isPlatformAdmin,
  hasTeam,
  hasAccount,
  promisable(teamMemberAdd, 'add member to team')
)

router.patch(
  '/:team/member/:member',
  isAuthenticated,
  hasTeam,
  isTeamAdmin,
  hasMember,
  express.json(),
  validationRules([
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
  isAuthenticated,
  hasTeam,
  isTeamAdmin,
  hasMember,
  promisable(teamMemberRemove, 'remove team member')
)

router.post(
  '/:team/join',
  isAuthenticated,
  hasTeam,
  promisable(teamJoinAdd, 'request to join')
)

router.delete(
  '/:team/join',
  isAuthenticated,
  hasTeam,
  promisable(teamJoinRescind, 'rescind join request')
)

router.post(
  '/:team/join/:account',
  isAuthenticated,
  hasTeam,
  isTeamAdmin,
  hasAccount,
  promisable(teamJoinAccept, 'accept join request')
)

router.delete(
  '/:team/join/:account',
  isAuthenticated,
  hasTeam,
  isTeamAdmin,
  hasAccount,
  promisable(teamJoinDecline, 'decline join request')
)

export { router as teamRouter }
