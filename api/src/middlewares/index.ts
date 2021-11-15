// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

export { inputs, validationRules } from './utils'
export { hasSuite } from './suite'
export { hasBatch } from './batch'
export { hasElement } from './element'
export { hasComment } from './comment'

export {
  hasTeam,
  isTeamInvitee,
  isTeamMember,
  isTeamAdmin,
  isTeamOwner,
  hasMember
} from './team'

export {
  isAuthenticated,
  isClientAuthenticated,
  isPlatformAdmin,
  hasAccount,
  hasSuspendedAccount
} from './user'
