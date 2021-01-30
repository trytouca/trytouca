/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

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
  hasAccount
} from './user'
