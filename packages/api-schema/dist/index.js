"use strict";
// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETeamRole = exports.ENotificationType = exports.EPlatformRole = exports.EFeatureFlag = void 0;
/**
 * @schema CT_EFeatureFlag
 *  type: string
 *  enum: ['newsletter_product', 'newsletter_changelog']
 */
var EFeatureFlag;
(function (EFeatureFlag) {
    EFeatureFlag["NewsletterProduct"] = "newsletter_product";
    EFeatureFlag["NewsletterChangelog"] = "newsletter_changelog";
})(EFeatureFlag = exports.EFeatureFlag || (exports.EFeatureFlag = {}));
/**
 * @schema CT_EPlatformRole
 *  type: string
 *  enum: ['guest', 'user', 'admin', 'owner']
 */
var EPlatformRole;
(function (EPlatformRole) {
    EPlatformRole["Guest"] = "guest";
    EPlatformRole["User"] = "user";
    EPlatformRole["Admin"] = "admin";
    EPlatformRole["Owner"] = "owner";
    EPlatformRole["Super"] = "super";
})(EPlatformRole = exports.EPlatformRole || (exports.EPlatformRole = {}));
/**
 * @schema CT_ENotificationType
 *  type: string
 *  enum: ['none', 'different', 'all']
 */
var ENotificationType;
(function (ENotificationType) {
    ENotificationType["None"] = "none";
    ENotificationType["Different"] = "different";
    ENotificationType["All"] = "all";
})(ENotificationType = exports.ENotificationType || (exports.ENotificationType = {}));
/**
 * @schema CT_ETeamRole
 *  type: string
 *  enum: ['applicant', 'invited', 'member', 'admin', 'owner']
 */
var ETeamRole;
(function (ETeamRole) {
    ETeamRole["Invalid"] = "unknown";
    ETeamRole["Applicant"] = "applicant";
    ETeamRole["Invited"] = "invited";
    ETeamRole["Member"] = "member";
    ETeamRole["Admin"] = "admin";
    ETeamRole["Owner"] = "owner";
})(ETeamRole = exports.ETeamRole || (exports.ETeamRole = {}));
//# sourceMappingURL=index.js.map