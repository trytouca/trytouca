// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { EPlatformRole } from '@touca/api-schema'
import { NextFunction, Request, Response } from 'express'

import { extractCommentTuple } from '@/models/comment'
import { CommentModel, ICommentDocument } from '@/schemas/comment'
import { ITeam, TeamModel } from '@/schemas/team'
import { IUser } from '@/schemas/user'
import logger from '@/utils/logger'
import { rclient } from '@/utils/redis'
import { analytics, EActivity } from '@/utils/tracker'

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
  analytics.add_activity(EActivity.CommentDeleted, user)
  return res.status(204).send()
}
