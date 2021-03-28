/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { EPlatformRole } from '../commontypes'
import { IUser, UserModel } from '@weasel/schemas/user'

/**
 *
 */
export async function wslFindByRole(role: EPlatformRole): Promise<IUser[]> {
  return await UserModel.find(
    { platformRole: role, suspended: false },
    { _id: 1, email: 1, fullname: 1, platformRole: 1, username: 1 }
  )
}

/**
 *
 */
export async function wslFindByUname(uname: string): Promise<IUser> {
  return await UserModel.findOne(
    { username: uname, suspended: false },
    { _id: 1, email: 1, fullname: 1, platformRole: 1, username: 1 }
  )
}

/**
 * Provides information about the already registered super user.
 */
export async function wslGetSuperUser(): Promise<IUser> {
  const users = await wslFindByRole(EPlatformRole.Super)
  return users.length === 0 ? null : users[0]
}
