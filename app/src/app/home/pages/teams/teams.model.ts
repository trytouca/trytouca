/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import type { TeamItem } from '@/core/models/commontypes';
import { PageListItem } from '@/home/models/page-list-item.model';

/**
 *
 */
export enum TeamsPageItemType {
  Active = 'active',
  Invited = 'invited',
  Joining = 'joining'
}

/**
 *
 */
export class TeamsPageTeam extends PageListItem<TeamItem, TeamsPageItemType> {
  public constructor(data: TeamItem, type: TeamsPageItemType) {
    super(data, type);
  }
}
