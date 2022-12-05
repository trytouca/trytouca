// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import {
  ElementModel,
  IBatchDocument,
  IElementDocument,
  ISuiteDocument,
  ITeamDocument,
  MessageModel
} from '../schemas/index.js'
import { Artifact } from '../types/backendtypes.js'
import { logger } from '../utils/index.js'

/**
 * @summary
 * Checks if an element exists in a suite.
 *
 * @description
 * Checks if an element whose slug is specified in request parameter
 * as `element` exists for suite `suite` in team `team`.
 *
 * - Populates local response variables: `element`.
 * - Expects request parameters: `element`
 * - Expects local response variables: `suite`
 *
 * @returns
 * - Error 404 if element (`element`) does not exist in suite `suite`.
 */
export async function hasElement(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const suite = res.locals.suite as ISuiteDocument
  const elementSlug = req.params.element

  const element = await ElementModel.findOne({
    slug: elementSlug,
    suiteId: suite._id
  })

  // return 404 if element with specified slug does not exist in `suite`

  if (!element) {
    return next({
      errors: ['element not found'],
      status: 404
    })
  }

  logger.silly('%s: element exists', element.name)
  res.locals.element = element
  return next()
}

export async function hasArtifact(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const team = res.locals.team as ITeamDocument
  const suite = res.locals.suite as ISuiteDocument
  const batch = res.locals.batch as IBatchDocument
  const element = res.locals.element as IElementDocument
  const artifact_name = req.params.artifact

  const message = await MessageModel.findOne({
    batchId: batch._id,
    elementId: element._id,
    artifacts: { $in: [{ key: artifact_name }] }
  })

  if (!message) {
    return next({
      errors: ['artifact not found'],
      status: 404
    })
  }

  const artifact: Omit<Artifact, 'content'> = {
    filename_external:
      [team.slug, suite.slug, batch.slug, artifact_name].join('_') + '.pdf',
    filename_internal: artifact_name,
    message_id: message.id
  }

  logger.silly('%s: artifact exists', artifact.filename_external)
  res.locals.artifact = artifact
  return next()
}
