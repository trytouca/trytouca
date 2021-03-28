/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import mongoose from 'mongoose'

/**
 *
 */
const teamSchema = new mongoose.Schema(
  {
    admins: [
      {
        ref: 'User',
        required: true,
        type: mongoose.Schema.Types.ObjectId
      }
    ],
    applicants: [
      {
        ref: 'User',
        required: true,
        type: mongoose.Schema.Types.ObjectId
      }
    ],
    invitees: [
      {
        _id: false,
        email: {
          required: true,
          type: String
        },
        fullname: {
          required: true,
          type: String
        },
        invitedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    members: [
      {
        ref: 'User',
        required: true,
        type: mongoose.Schema.Types.ObjectId
      }
    ],
    name: {
      required: true,
      type: String
    },
    owner: {
      ref: 'User',
      required: true,
      type: mongoose.Schema.Types.ObjectId
    },
    slug: {
      required: true,
      type: String
    },
    suspended: {
      default: false,
      type: Boolean
    }
  },
  {
    timestamps: true
  }
)

/**
 *
 */
teamSchema.index({ slug: 1 }, { unique: true })

/**
 *
 */
export interface ITeamDocument extends mongoose.Document {
  admins: mongoose.Types.ObjectId[]
  applicants: mongoose.Types.ObjectId[]
  invitees: { email: string; fullname: string; invitedAt: Date }[]
  members: mongoose.Types.ObjectId[]
  name: string
  owner: mongoose.Types.ObjectId
  slug: string
  suspended: boolean
}

/**
 *
 */
export type ITeam = Pick<ITeamDocument, '_id' | 'name' | 'slug'>

/**
 *
 */
export interface ITeamModel extends mongoose.Model<ITeamDocument> {}

/**
 *
 */
export const TeamModel: ITeamModel = mongoose.model<ITeamDocument, ITeamModel>(
  'Team',
  teamSchema
)
