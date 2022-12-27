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
  standby,
  validationMap,
  validationRules
} from '../middlewares/index.js'
import { handleEvents } from '../utils/index.js'

const router = express.Router()

router.get('/', isAuthenticated, standby(ctrlTeamList, 'list teams'))

router.post(
  '/',
  isAuthenticated,
  express.json(),
  validationRules([
    validationMap.get('entity-name').exists().withMessage('required'),
    validationMap.get('entity-slug').exists().withMessage('required')
  ]),
  standby(ctrlTeamCreate, 'create team')
)

router.get(
  '/:team',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  standby(ctrlTeamLookup, 'lookup team')
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
  standby(teamUpdate, 'update team')
)

router.delete(
  '/:team',
  isAuthenticated,
  hasTeam,
  isTeamOwner,
  standby(ctrlTeamRemove, 'remove team')
)

router.get(
  '/:team/events',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  handleEvents
)

router.post(
  '/:team/populate',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  standby(teamPopulate, 'populate team with sample data')
)

router.post(
  '/:team/invite',
  isAuthenticated,
  hasTeam,
  isTeamAdmin,
  express.json(),
  validationRules([validationMap.get('email'), validationMap.get('fullname')]),
  standby(teamInviteAdd, 'invite user to team')
)

router.post(
  '/:team/invite/rescind',
  isAuthenticated,
  hasTeam,
  isTeamAdmin,
  express.json(),
  validationRules([validationMap.get('email')]),
  standby(teamInviteRescind, 'rescind team invitation')
)

router.post(
  '/:team/invite/accept',
  isAuthenticated,
  hasTeam,
  isTeamInvitee,
  standby(teamInviteAccept, 'join team')
)

router.post(
  '/:team/invite/decline',
  isAuthenticated,
  hasTeam,
  isTeamInvitee,
  standby(teamInviteDecline, 'decline team invitation')
)

router.post(
  '/:team/leave',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  standby(teamLeave, 'leave from team')
)

router.get(
  '/:team/member',
  isAuthenticated,
  hasTeam,
  isTeamMember,
  standby(teamMemberList, 'list team members')
)

router.post(
  '/:team/member/:account',
  isAuthenticated,
  isPlatformAdmin,
  hasTeam,
  hasAccount,
  standby(teamMemberAdd, 'add member to team')
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
  standby(teamMemberUpdate, 'update member role in team')
)

router.delete(
  '/:team/member/:member',
  isAuthenticated,
  hasTeam,
  isTeamAdmin,
  hasMember,
  standby(teamMemberRemove, 'remove team member')
)

router.post(
  '/:team/join',
  isAuthenticated,
  hasTeam,
  standby(teamJoinAdd, 'request to join')
)

router.delete(
  '/:team/join',
  isAuthenticated,
  hasTeam,
  standby(teamJoinRescind, 'rescind join request')
)

router.post(
  '/:team/join/:account',
  isAuthenticated,
  hasTeam,
  isTeamAdmin,
  hasAccount,
  standby(teamJoinAccept, 'accept join request')
)

router.delete(
  '/:team/join/:account',
  isAuthenticated,
  hasTeam,
  isTeamAdmin,
  hasAccount,
  standby(teamJoinDecline, 'decline join request')
)

export { router as teamRouter }
