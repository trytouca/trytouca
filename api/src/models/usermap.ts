// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import type { Userinfo } from '@touca/api-schema'
import { Types } from 'mongoose'

import { UserModel } from '@/schemas/user'

export class UserMap {
  private data: (Userinfo & { _id: Types.ObjectId })[] = []
  private groups = new Map<string, Types.ObjectId[]>()

  addGroup(key: string, values: Types.ObjectId[]): UserMap {
    this.groups.set(key, values)
    return this
  }

  async populate(): Promise<UserMap> {
    const ids = [...new Set([].concat(...Array.from(this.groups.values())))]
    this.data = await UserModel.aggregate([
      { $match: { _id: { $in: ids } } },
      { $project: { fullname: 1, username: 1 } }
    ])
    return this
  }

  getGroup(key: string): Userinfo[] {
    return this.data
      .filter((el) => this.groups.get(key).find((v) => v.equals(el._id)))
      .map(({ _id, ...el }) => el)
  }

  lookup(uid: Types.ObjectId): Userinfo {
    const el = this.data.find((v) => v._id.equals(uid))
    return { fullname: el.fullname, username: el.username }
  }

  allUsers(): Userinfo[] {
    return this.data.map(({ _id, ...el }) => el)
  }
}
