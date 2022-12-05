// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'
import {
  body as vbody,
  param as vparam,
  ValidationChain,
  validationResult
} from 'express-validator'

import logger from '../utils/logger.js'

export const validationMap = new Map<string, ValidationChain>([
  [
    'body',
    vbody('body')
      .exists()
      .withMessage('body')
      .isString()
      .withMessage('must be a string')
      .isLength({ max: 1500 })
      .withMessage('too long')
  ],
  [
    'email',
    vbody('email')
      .exists()
      .withMessage('required')
      .isEmail()
      .withMessage('invalid')
  ],
  [
    'resetKey',
    vparam('key')
      .exists()
      .withMessage('required')
      .isUUID()
      .withMessage('invalid')
  ],
  [
    'password',
    vbody('password')
      .exists()
      .withMessage('required')
      .isString()
      .withMessage('must be a string')
      .isLength({ min: 8 })
      .withMessage('too short')
  ],
  [
    'username',
    vbody('username')
      .exists({ checkFalsy: true, checkNull: true })
      .withMessage('required')
      .isString()
      .withMessage('must be a string')
      .isLength({ min: 3 })
      .withMessage('too short')
      .isLength({ max: 32 })
      .withMessage('too long')
  ],
  [
    'google_token',
    vbody('google_token')
      .exists()
      .withMessage('required')
      .isString()
      .withMessage('must be a string')
  ],
  [
    'fullname',
    vbody('fullname').optional().isString().withMessage('must be a string')
  ],
  [
    'reason',
    vbody('reason')
      .exists()
      .withMessage('required')
      .isString()
      .withMessage('must be a string')
      .isLength({ max: 1500 })
      .withMessage('too long')
  ],
  [
    'entity-slug',
    vbody('slug')
      .isSlug()
      .withMessage('invalid')
      .isLength({ min: 3 })
      .withMessage('too short')
      .isLength({ max: 32 })
      .withMessage('too long')
  ],
  [
    'entity-name',
    vbody('name')
      .isString()
      .withMessage('must be a string')
      .isLength({ min: 1 })
      .withMessage('too short')
      .isLength({ max: 32 })
      .withMessage('too long')
  ]
])

async function validateOperation(
  req: Request,
  res: Response,
  next: NextFunction,
  rules: ValidationChain[]
) {
  await Promise.all(rules.map((validation) => validation.run(req)))

  const errors = validationResult(req)
    .array({ onlyFirstError: true })
    .map((e) => {
      logger.info('%s: invalid request: %s %s', req.originalUrl, e.param, e.msg)
      return `${e.param} is invalid`
    })

  if (errors.length === 0) {
    return next()
  }

  return res.status(400).json({ errors })
}

export function validationRules(rules: ValidationChain[]) {
  return (req: Request, res: Response, next: NextFunction) =>
    validateOperation(req, res, next, rules)
}
