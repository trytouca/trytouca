/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

import { EPlatformRole } from '../commontypes'

/**
 *
 */
const userSchema = new mongoose.Schema(
  {
    activatedAt: {
      required: false,
      type: Date
    },
    activationKey: {
      required: false,
      type: String
    },
    apiKeys: {
      type: [String],
      default: () => [ uuidv4() ]
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    email: {
      required: true,
      type: String,
      unique: true
    },
    fullname: {
      required: false,
      type: String
    },
    lockedAt: {
      required: false,
      type: Date
    },
    loginAttempts: {
      default: 0,
      required: false,
      typee: Number
    },
    password: {
      required: true,
      type: String
    },
    platformRole: {
      enum: Object.values(EPlatformRole),
      default: 'user',
      required: true,
      type: String
    },
    prospectiveTeams: [{
      ref: 'Team',
      required: false,
      type: mongoose.Schema.Types.ObjectId
    }],
    resetAt: {
      required: false,
      type: Date
    },
    resetKey: {
      required: false,
      type: String
    },
    resetKeyExpiresAt: {
      required: false,
      type: Date
    },
    suspended: {
      default: false,
      required: true,
      type: Boolean
    },
    teams: [{
      ref: 'Team',
      required: false,
      type: mongoose.Schema.Types.ObjectId
    }],
    username: {
      required: true,
      type: String,
      unique: true
    }
  }
)

/**
 *
 */
export interface IUserDocument extends mongoose.Document {
  activatedAt: Date
  activationKey: string
  apiKeys: string[]
  createdAt: Date
  email: string
  fullname: string
  lockedAt: Date
  loginAttempts: number
  password: string
  platformRole: EPlatformRole
  prospectiveTeams: mongoose.Types.ObjectId[]
  resetAt: Date
  resetKey: string
  resetKeyExpiresAt: Date
  suspended: boolean
  teams: mongoose.Types.ObjectId[]
  username: string
}

/**
 *
 */
export type IUser = Pick<IUserDocument,
  '_id' | 'email' | 'fullname' | 'platformRole' | 'username'>

/**
 *
 */
userSchema.statics.wslFindByRole = async function(role: EPlatformRole) : Promise<IUser[]> {
  const users = await this.model('User').find(
    { platformRole: role, suspended: false },
    { _id: 1, email: 1, fullname: 1, platformRole: 1, username: 1 })
  return users
}

/**
 *
 */
userSchema.statics.wslFindByUname = async function(uname: string) : Promise<IUser> {
  const user = await this.model('User').findOne(
    { username: uname, suspended: false },
    { _id: 1, email: 1, fullname: 1, platformRole: 1, username: 1 })
  return user
}

/**
 * Provides information about the already registerd super user.
 */
userSchema.statics.wslGetSuperUser = async function(): Promise<IUser> {
  const users = await this.model('User').wslFindByRole(EPlatformRole.Super)
  return users.length === 0 ? null : users[0]
}

/**
 *
 */
export interface IUserModel extends mongoose.Model<IUserDocument> {
  wslFindByRole: (platformRole: EPlatformRole) => Promise<IUser[]>
  wslFindByUname: (uname: string) => Promise<IUser>
  wslGetSuperUser: () => Promise<IUser>
}

/**
 *
 */
export const UserModel: IUserModel = mongoose.model<
  IUserDocument,
  IUserModel
>('User', userSchema)
