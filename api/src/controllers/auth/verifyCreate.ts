// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { NextFunction, Request, Response } from 'express'

import { createUserAccount } from '@/models/auth'
import { UserModel } from '@/schemas/user'

export async function authVerifyCreate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const askedEmail = (req.body.email as string).toLowerCase()
  const askedIpAddress = req.ip

  // return 400 if email is already associated with any user
  // important not to use any of the static helper functions of user schema
  // here since we like to include suspended accounts in our check.

  if (await UserModel.countDocuments({ email: askedEmail })) {
    return next({
      errors: ['email already registered'],
      status: 400
    })
  }

  // reject request if email has a domain that is on the deny list

  if (['aol.com', 'hotmail.com'].some((v) => askedEmail.endsWith(v))) {
    return next({
      errors: ['email address suspicious'],
      status: 403
    })
  }

  await createUserAccount({ email: askedEmail, ip_address: askedIpAddress })

  return res.status(201).json({})
}
