// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

export { hasBatch } from './batch.js'
export { hasComment } from './comment.js'
export { hasArtifact, hasElement } from './element.js'
export { isCloudInstance } from './relay.js'
export { hasSuite } from './suite.js'
export {
  hasTeam,
  isTeamInvitee,
  isTeamMember,
  isTeamAdmin,
  isTeamOwner,
  hasMember
} from './team.js'
export {
  isAuthenticated,
  isClientAuthenticated,
  isPlatformAdmin,
  findPlatformRole,
  hasAccount,
  hasSuspendedAccount
} from './user.js'
export { validationRules, validationMap } from './utils.js'
