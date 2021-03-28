/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'

import { EPlatformRole } from '../../commontypes'
import { extractCommentTuple } from '@weasel/models/comment'
import { CommentModel, ICommentDocument } from '@weasel/schemas/comment'
import { ITeam, TeamModel } from '@weasel/schemas/team'
import { IUser } from '@weasel/schemas/user'
import logger from '@weasel/utils/logger'
import { rclient } from '@weasel/utils/redis'

/**
 *
 */
export async function ctrlCommentRemove(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const team = res.locals.team as ITeam
  const user = res.locals.user as IUser
  const comment = res.locals.comment as ICommentDocument
  const tuple = extractCommentTuple(res)
  logger.debug('%s: %s: removing comment', user.username, tuple)

  const isCommentOwner = comment.by.equals(user._id)
  const isPlatformAdmin = [EPlatformRole.Owner, EPlatformRole.Admin].includes(
    user.platformRole
  )
  const isTeamAdmin = await TeamModel.countDocuments({
    _id: team._id,
    $or: [{ admins: { $in: user._id } }, { owner: user._id }]
  })
  const isAuthorized = isCommentOwner || isPlatformAdmin || isTeamAdmin
  if (!isAuthorized) {
    return next({
      errors: ['insufficient privileges'],
      status: 403
    })
  }
  logger.silly('%s: can remove comment %s', user.username, comment._id)

  await CommentModel.findByIdAndDelete(comment._id)

  await rclient.removeCached(`route_commentList_${tuple}`)

  logger.info('%s: %s: removed comment', user.username, tuple)
  return res.status(204).send()
}
