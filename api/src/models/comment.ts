// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Response } from 'express'

import {
  IBatchDocument,
  IElementDocument,
  ISuiteDocument,
  ITeam,
  IUser,
  SuiteModel
} from '../schemas/index.js'
import { ECommentType } from '../types/backendtypes.js'
import { mailUser } from '../utils/index.js'

export type CommentInputs = {
  user: IUser
  team: ITeam
  suite: ISuiteDocument
  batch?: IBatchDocument
  element?: IElementDocument
}

export function extractCommentTuple(res: Response) {
  const keys = []
  for (const key of ['team', 'suite', 'batch', 'element']) {
    if (!res.locals[key]) {
      break
    }
    keys.push(res.locals[key].slug)
  }
  return keys.join('_')
}

export function extractCommentType(res: Response): ECommentType {
  if (res.locals.element) {
    return ECommentType.Element
  }
  if (res.locals.batch) {
    return ECommentType.Batch
  }
  if (res.locals.suite) {
    return ECommentType.Suite
  }
  return ECommentType.Team
}

async function getSuiteSubscribers(
  suiteId: ISuiteDocument['_id']
): Promise<IUser[]> {
  type SuiteInfo = { subscribers: IUser[] }
  const result: SuiteInfo[] = await SuiteModel.aggregate([
    { $match: { _id: suiteId } },
    {
      $lookup: {
        as: 'subscriberDocs',
        foreignField: '_id',
        from: 'users',
        localField: 'subscribers'
      }
    },
    {
      $project: {
        _id: 0,
        subscribers: {
          $map: {
            input: '$subscriberDocs',
            as: 'sub',
            in: {
              _id: '$$sub._id',
              email: '$$sub.email',
              username: '$$sub.username',
              fullname: '$$sub.fullname'
            }
          }
        }
      }
    }
  ])
  return result[0].subscribers
}

/**
 * type of parameter `inputs` in function `notifySubscribers`.
 */
type MailInputs = {
  commentBy: string
  subject: string
  template: string
  username: string
}

export async function notifySubscribers(
  inputs: MailInputs,
  locals: CommentInputs
): Promise<void> {
  const subscribers = await getSuiteSubscribers(locals.suite._id)

  // since there may be many subscribers, we prefer to send emails in chunks.

  const chunkSize = 5
  for (let i = 0; i < subscribers.length; i = i + chunkSize) {
    const jobs = subscribers.slice(i, i + chunkSize).map(async (subscriber) => {
      inputs.username = subscriber.fullname
      inputs.commentBy =
        subscriber.username === locals.user.username
          ? 'You'
          : locals.user.fullname || locals.user.username
      await mailUser(subscriber, inputs.subject, inputs.template, inputs)
    })
    await Promise.all(jobs)
  }
}
