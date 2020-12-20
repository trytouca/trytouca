/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NextFunction, Request, Response } from 'express'

import { ElementModel } from '../schemas/element'
import { ISuiteDocument } from '../schemas/suite'
import logger from '../utils/logger'

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
 * - Database Queries: 1
 *
 * @returns
 * - Error 404 if element (`element`) does not exist in suite `suite`.
 */
export async function hasElement(
  req: Request, res: Response, next: NextFunction
) {
  const suite = res.locals.suite as ISuiteDocument
  const elementSlug = req.params.element

  const element = await ElementModel.findOne({
    name: elementSlug, suiteId: suite._id
  })

  // return 404 if element with specified slug does not exist in `suite`

  if (!element) {
    return next({
      errors: [ 'element not found' ],
      status: 404
    })
  }

  logger.silly('%s: element exists', element.name)
  res.locals.element = element
  return next()
}
