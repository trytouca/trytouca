/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'

import { ITeam, TeamModel } from '@/schemas/team'
import { IUser, UserModel } from '@/schemas/user'
import { config } from '@/utils/config'
import logger from '@/utils/logger'
import * as mailer from '@/utils/mailer'
import { rclient } from '@/utils/redis'

/**
 * @summary
 * Invites someone by email to join an existing team.
 *
 * @description
 * Invitee may or may not be already registered on the platform.
 * Invitee must not be an existing member of this team.
 * Invitee receives an email with a link to *Join Team*.
 *
 * This function is designed to be called after the following middlewares:
 *  - `isAuthenticated` to yield `user`
 *  - `hasTeam` to yield `team`
 *  - `isTeamAdmin`
 * Expects `email` field in request body.
 * Expects `fullname` field in request body.
 *
 * Performs five database queries.
 */
export async function teamInviteAdd(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = res.locals.user as IUser
  const team = res.locals.team as ITeam
  const askedEmail = req.body.email
  const askedFullname = req.body.fullname
  const tuple = [user.username, askedEmail, team.slug]
  logger.debug('%s: inviting %s to team %s', ...tuple)

  // check if user is already invited

  type Invitee = { email: string; invitedAt: Date }
  const result: Invitee[] = await TeamModel.aggregate([
    {
      $match: { _id: team._id, invitees: { $elemMatch: { email: askedEmail } } }
    },
    { $unwind: '$invitees' },
    { $project: { _id: 0, invitees: 1 } },
    { $replaceRoot: { newRoot: '$invitees' } }
  ])
  const alreadyInvited = result.length === 0 ? null : result[0]

  // reject the request if user was already invited less than 10 minutes ago.

  if (alreadyInvited) {
    const invitedAt = alreadyInvited.invitedAt
    invitedAt.setMinutes(invitedAt.getMinutes() + 10)
    if (new Date() < invitedAt) {
      return next({
        errors: ['user invited recently'],
        status: 429
      })
    }
  }

  // reject the request if user is already a member of this team

  const isMember = await UserModel.countDocuments({
    email: askedEmail,
    teams: { $in: [team._id] }
  })
  if (isMember) {
    return next({
      errors: ['user already a member'],
      status: 409
    })
  }

  // update database field

  if (alreadyInvited) {
    await TeamModel.updateOne(
      { _id: team._id, invitees: { $elemMatch: { email: askedEmail } } },
      {
        $set: {
          'invitees.$': {
            email: askedEmail,
            fullname: askedFullname,
            invitedAt: new Date()
          }
        }
      }
    )
    logger.info('%s: reinvited %s to team %s', ...tuple)
  } else {
    await TeamModel.findByIdAndUpdate(team._id, {
      $push: {
        invitees: {
          email: askedEmail,
          fullname: askedFullname,
          invitedAt: new Date()
        }
      }
    })
    logger.info('%s: invited %s to team %s', ...tuple)
  }

  // remove list of team members from cache.

  await rclient.removeCached(`route_teamMemberList_${team.slug}`)

  // if user was registered, refresh their team list

  const isRegistered = await UserModel.findOne(
    { email: askedEmail },
    { fullname: 1, username: 1 }
  )

  if (isRegistered) {
    await rclient.removeCached(`route_teamList_${isRegistered.username}`)
  }

  // send invitation email to user

  const subject = `Join team "${team.name}" on Weasel`
  const recipient: IUser = {
    _id: null,
    email: askedEmail,
    fullname: null,
    platformRole: null,
    username: askedEmail
  }
  mailer.mailUser(recipient, subject, 'team-invite-new', {
    greetings: isRegistered?.fullname ? `Hi ${isRegistered.fullname}` : `Hello`,
    hasIntro: !isRegistered,
    joinLink: `${config.webapp.root}?redirect=join`,
    ownerName: user.fullname,
    ownerEmail: user.email,
    subject,
    teamName: team.name
  })

  return res.status(204).send()
}
