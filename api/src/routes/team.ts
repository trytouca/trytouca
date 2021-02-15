/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import bodyParser from 'body-parser'
import e from 'express'
import * as ev from 'express-validator'

import { ETeamRole } from '../commontypes'
import * as middleware from '../middlewares'
import { promisable } from '../utils/routing'
import { ctrlTeamCreate } from '../controllers/team/create'
import { teamInviteAccept } from '../controllers/team/inviteAccept'
import { teamInviteAdd } from '../controllers/team/inviteAdd'
import { teamInviteDecline } from '../controllers/team/inviteDecline'
import { teamInviteRescind } from '../controllers/team/inviteRescind'
import { teamJoinAccept } from '../controllers/team/joinAccept'
import { teamJoinAdd } from '../controllers/team/joinAdd'
import { teamJoinDecline } from '../controllers/team/joinDecline'
import { teamJoinRescind } from '../controllers/team/joinRescind'
import { teamLeave } from '../controllers/team/leave'
import { ctrlTeamList } from '../controllers/team/list'
import { ctrlTeamLookup } from '../controllers/team/lookup'
import { ctrlTeamRemove } from '../controllers/team/remove'
import { teamUpdate } from '../controllers/team/update'
import { teamMemberAdd } from '../controllers/team/memberAdd'
import { teamMemberList } from '../controllers/team/memberList'
import { teamMemberRemove } from '../controllers/team/memberRemove'
import { teamMemberUpdate } from '../controllers/team/memberUpdate'

const router = e.Router()

/**
 * Lists all the teams of which user is a member.
 *
 * @api [get] /team
 *    tags:
 *      - Team
 *    summary: List Teams
 *    operationId: team_list
 *    description:
 *      Lists all the teams of which user is a member.
 *      User performing the query must be authenticated.
 *    responses:
 *      200:
 *        description: List of Teams
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CT_TeamListResponse'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/',
  middleware.isAuthenticated,
  promisable(ctrlTeamList, 'list teams')
)

/**
 * Create a new team owned by this user.
 *
 * @api [post] /team
 *    tags:
 *      - Team
 *    summary: Create Team
 *    operationId: team_create
 *    description:
 *      Create a new team owned by this user.
 *      User initiating the request must be authenticated.
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            additionalProperties: false
 *            type: object
 *            required:
 *              - name
 *              - slug
 *            properties:
 *              name:
 *                type: string
 *              slug:
 *                type: string
 *    responses:
 *      201:
 *        description: Team Created
 *        headers:
 *          Location:
 *            schema:
 *              type: string
 *              format: url
 *            description: Link to new team
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      409:
 *        description: Team Already Registered
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.post(
  '/',
  middleware.isAuthenticated,
  bodyParser.json(),
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

/**
 * Learn more about a team.
 *
 * @api [get] /team/:team
 *    tags:
 *      - Team
 *    summary: Lookup Team
 *    operationId: team_lookup
 *    description:
 *      Learn more about a team.
 *      User performing the query must be authenticated.
 *      User performing the query must be member of the team.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *    responses:
 *      200:
 *        description:
 *          Detailed information about this team, excluding
 *          the list of members and their roles within this team.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CT_TeamLookupResponse'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        $ref: '#/components/responses/TeamNotFound'
 */
router.get(
  '/:team',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  promisable(ctrlTeamLookup, 'lookup team')
)

/**
 * Update team information.
 *
 * @api [patch] /team/:team
 *    tags:
 *      - Team
 *    summary: Update Team
 *    operationId: team_update
 *    description:
 *      Update team information.
 *      User initiating the request must be authenticated.
 *      User initiation the request must be owner of the team.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            additionalProperties: false
 *            type: object
 *            properties:
 *              name:
 *                type: string
 *              slug:
 *                type: string
 *    responses:
 *      201:
 *        description:
 *          Metadata of the team was updated.
 *          Team is now known by a new slug.
 *        headers:
 *          Location:
 *            schema:
 *              type: string
 *              format: url
 *            description: Link to the team with its new slug
 *      204:
 *        description:
 *          Metadata of the team was updated.
 *          Team slug has not changed.
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        $ref: '#/components/responses/TeamNotFound'
 *      409:
 *        description: 'Message Already Processed'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.patch(
  '/:team',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamOwner,
  bodyParser.json(),
  middleware.inputs([
    middleware.validationRules.get('entity-name').optional(),
    middleware.validationRules.get('entity-slug').optional()
  ]),
  promisable(teamUpdate, 'update team')
)

/**
 * Removes a team and all data associated with it.
 *
 * @api [delete] /team/:team
 *    tags:
 *      - Team
 *    summary: Remove Team
 *    operationId: team_remove
 *    description:
 *      Removes a team and all data associated with it.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be owner of the team.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *    responses:
 *      204:
 *        description: 'Team Removed'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        $ref: '#/components/responses/TeamNotFound'
 */
router.delete(
  '/:team',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamOwner,
  promisable(ctrlTeamRemove, 'remove team')
)

/**
 * Invite someone to join a team.
 *
 * @api [post] /team/:team/invite
 *    tags:
 *      - Team
 *    summary: 'Invite to Team'
 *    operationId: 'team_inviteAdd'
 *    description:
 *      Invite someone to join a team.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be administrator of the team.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - email
 *              - fullname
 *            properties:
 *              email:
 *                type: string
 *                format: email
 *                example: 'hpotter@hsww.edu'
 *              fullname:
 *                type: string
 *                example: 'Harry Potter'
 *      required: true
 *    responses:
 *      204:
 *        description: 'User Invited to Team'
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        $ref: '#/components/responses/TeamNotFound'
 *      409:
 *        description: 'User is already a member'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 *      429:
 *        description: 'User was last invited less than 10 minutes ago'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.post(
  '/:team/invite',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamAdmin,
  bodyParser.json(),
  middleware.inputs([
    middleware.validationRules.get('email'),
    middleware.validationRules.get('fullname')
  ]),
  promisable(teamInviteAdd, 'invite user to team')
)

/**
 * Rescind invitation to a team.
 *
 * @api [post] /team/:team/invite/rescind
 *    tags:
 *      - Team
 *    summary: 'Rescind Team Invitation'
 *    operationId: 'team_inviteRescind'
 *    description:
 *      Rescind invitation to a team.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be administrator of the team.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - email
 *            properties:
 *              email:
 *                type: string
 *                format: email
 *                example: 'hpotter@hsww.edu'
 *      required: true
 *    responses:
 *      204:
 *        description: 'User Invited to Team'
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        description: Team Not Found or user was not on invitation list.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.post(
  '/:team/invite/rescind',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamAdmin,
  bodyParser.json(),
  middleware.inputs([middleware.validationRules.get('email')]),
  promisable(teamInviteRescind, 'rescind team invitation')
)

/**
 * Adds user to the team they are invited to.
 *
 * @api [post] /team/:team/invite/accept
 *    tags:
 *      - Team
 *    summary: 'Accept Team Invitation'
 *    operationId: 'team_inviteAccept'
 *    description:
 *      Adds user to the team they are invited to.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be invited to the team.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *    responses:
 *      204:
 *        description: User was added as a member.
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        $ref: '#/components/responses/TeamNotFound'
 */
router.post(
  '/:team/invite/accept',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamInvitee,
  promisable(teamInviteAccept, 'join team')
)

/**
 * Removes team membership invitation for this user.
 *
 * @api [post] /team/:team/invite/decline
 *    tags:
 *      - Team
 *    summary: 'Decline Team Invitation'
 *    operationId: 'team_inviteDecline'
 *    description:
 *      Removes team membership invitation for this user.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be invited to the team.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *    responses:
 *      204:
 *        description: Team Invitation was Declined.
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        $ref: '#/components/responses/TeamNotFound'
 */
router.post(
  '/:team/invite/decline',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamInvitee,
  promisable(teamInviteDecline, 'decline team invitation')
)

/**
 * Leave a team.
 *
 * @api [post] /team/:team/leave
 *    tags:
 *      - Team
 *    summary: 'Leave a Team'
 *    operationId: 'team_leave'
 *    description:
 *      Cancel membership of a given team.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be member of the team.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *    responses:
 *      204:
 *        description: Membership Cancelled
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        $ref: '#/components/responses/TeamNotFound'
 */
router.post(
  '/:team/leave',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  promisable(teamLeave, 'leave from team')
)

/**
 * Lists all members of a team.
 *
 * @api [get] /team/:team/member
 *    tags:
 *      - Team
 *    summary: List Team Members
 *    operationId: team_memberList
 *    description:
 *      Lists all members of a team.
 *      Information provided for each member includes their roles
 *      within this team.
 *      Also provides list of users currently invited to join this team.
 *      User performing the query must be authenticated.
 *      User performing the query must be member of the team.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *    responses:
 *      200:
 *        description: 'List of Team Members'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/CT_TeamMemberListResponse'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        $ref: '#/components/responses/TeamNotFound'
 */
router.get(
  '/:team/member',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamMember,
  promisable(teamMemberList, 'list team members')
)

/**
 * Adds an existing user to a team
 *
 * @api [post] /team/:team/member/:account
 *    tags:
 *      - Team
 *    summary: 'Add User to Team'
 *    operationId: 'team_memberAdd'
 *    description:
 *      Adds an existing user to a team.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be administrator of the platform.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/account'
 *    responses:
 *      201:
 *        description: 'User Added to Team'
 *        headers:
 *          Location:
 *            schema:
 *              type: string
 *              format: url
 *            description: 'Link to the list of team members'
 *      400:
 *        $ref: '#/components/responses/RequestInvalid'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        description: Team or User Not Found
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.post(
  '/:team/member/:account',
  middleware.isAuthenticated,
  middleware.isPlatformAdmin,
  middleware.hasTeam,
  middleware.hasAccount,
  promisable(teamMemberAdd, 'add member to team')
)

/**
 * Updates role of an existing member in a team.
 *
 * @api [patch] /team/:team/member/:member
 *    tags:
 *      - Team
 *    summary: Update Member Role
 *    operationId: team_memberUpdate
 *    description:
 *      Updates role of an existing member in a team.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be a team administrator.
 *      User to be updated must be a team member.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/member'
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            additionalProperties: false
 *            type: object
 *            required:
 *              - role
 *            properties:
 *              role:
 *                type: string
 *                enum: [member, admin]
 *    responses:
 *      204:
 *        description: 'Member Role Updated'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        description: Team or Member Not Found
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.patch(
  '/:team/member/:member',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamAdmin,
  middleware.hasMember,
  bodyParser.json(),
  middleware.inputs([
    ev
      .body('role')
      .custom((v) =>
        Object.values(ETeamRole)
          .filter(
            (e: ETeamRole) => ![ETeamRole.Owner, ETeamRole.Invalid].includes(e)
          )
          .includes(v)
      )
      .withMessage('invalid')
  ]),
  promisable(teamMemberUpdate, 'update member role in team')
)

/**
 * Removes an existing member from a team.
 *
 * @api [delete] /team/:team/member/:member
 *    tags:
 *      - Team
 *    summary: Remove Team Member
 *    operationId: team_memberRemove
 *    description:
 *      Removes an existing member from a team.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be a team administrator.
 *      User to be updated must be a team member.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/member'
 *    responses:
 *      204:
 *        description: 'Member Removed'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        description: Team or Member Not Found
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.delete(
  '/:team/member/:member',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamAdmin,
  middleware.hasMember,
  promisable(teamMemberRemove, 'remove team member')
)

/**
 * Request to join a team.
 *
 * @api [post] /team/:team/join
 *    tags:
 *      - Team
 *    summary: 'Request to Join a Team'
 *    operationId: 'team_joinAdd'
 *    description:
 *      Request to join a team.
 *      User initiating the request must be authenticated.
 *      User initiating the request must not be a member of the team.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *    responses:
 *      204:
 *        description: 'Request was submitted.'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        $ref: '#/components/responses/TeamNotFound'
 *      409:
 *        description: 'User is already a member or has a pending request.'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.post(
  '/:team/join',
  middleware.isAuthenticated,
  middleware.hasTeam,
  promisable(teamJoinAdd, 'request to join')
)

/**
 * Rescind request to join a team.
 *
 * @api [delete] /team/:team/join
 *    tags:
 *      - Team
 *    summary: 'Rescind Team Join Request'
 *    operationId: 'team_joinRescind'
 *    description:
 *      Rescind request to join a team.
 *      User initiating the request must be authenticated.
 *      User initiating the request must not be a member of the team.
 *      User initiating the request must have a pending join request.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *    responses:
 *      204:
 *        description: 'User rescinded request to join the team.'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        description: Team Not Found or user did not have a pending join request.
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 *      409:
 *        description: 'User is already a member or has a pending request.'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.delete(
  '/:team/join',
  middleware.isAuthenticated,
  middleware.hasTeam,
  promisable(teamJoinRescind, 'rescind join request')
)

/**
 * Accept user request to join the team.
 *
 * @api [post] /team/:team/join/:account
 *    tags:
 *      - Team
 *    summary: 'Accept Team Join Request'
 *    operationId: 'team_joinAccept'
 *    description:
 *      Accept user request to join the team.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be administrator of the team.
 *      User holding the account must have a pending join request.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/account'
 *    responses:
 *      204:
 *        description: 'User request to join the team was accepted.'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        $ref: '#/components/responses/TeamNotFound'
 *      409:
 *        description: 'User is already a member or has no pending request.'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.post(
  '/:team/join/:account',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamAdmin,
  middleware.hasAccount,
  promisable(teamJoinAccept, 'accept join request')
)

/**
 * Decline user request to join the team .
 *
 * @api [post] /team/:team/join/decline
 *    tags:
 *      - Team
 *    summary: 'Decline Team Join Request'
 *    operationId: 'team_joinDecline'
 *    description:
 *      Decline user request to join the team.
 *      User initiating the request must be authenticated.
 *      User initiating the request must be administrator of the team.
 *      User holding the account must have a pending join request.
 *    parameters:
 *      - $ref: '#/components/parameters/team'
 *      - $ref: '#/components/parameters/account'
 *    responses:
 *      204:
 *        description: 'User request to join the team was declined.'
 *      401:
 *        $ref: '#/components/responses/Unauthorized'
 *      403:
 *        $ref: '#/components/responses/Forbidden'
 *      404:
 *        $ref: '#/components/responses/TeamNotFound'
 *      409:
 *        description: 'User is already a member or has no pending request.'
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Errors'
 */
router.delete(
  '/:team/join/:account',
  middleware.isAuthenticated,
  middleware.hasTeam,
  middleware.isTeamAdmin,
  middleware.hasAccount,
  promisable(teamJoinDecline, 'decline join request')
)

export const teamRouter = router
