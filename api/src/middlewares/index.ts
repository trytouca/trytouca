// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

export { hasBatch } from './batch'
export { hasComment } from './comment'
export { hasArtifact, hasElement } from './element'
export { isCloudInstance } from './relay'
export { hasSuite } from './suite'
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
  findPlatformRole,
  hasAccount,
  hasSuspendedAccount
} from './user'
export { inputs, validationRules } from './utils'
