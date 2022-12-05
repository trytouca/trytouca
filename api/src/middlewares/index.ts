// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

export { hasBatch } from './batch.js'
export { hasComment } from './comment.js'
export { hasArtifact, hasElement } from './element.js'
export { isCloudInstance } from './relay.js'
export { hasSuite } from './suite.js'
export {
  hasMember,
  hasTeam,
  isTeamAdmin,
  isTeamInvitee,
  isTeamMember,
  isTeamOwner
} from './team.js'
export {
  findPlatformRole,
  hasAccount,
  hasSuspendedAccount,
  isAuthenticated,
  isClientAuthenticated,
  isPlatformAdmin
} from './user.js'
export { validationMap, validationRules } from './utils.js'
