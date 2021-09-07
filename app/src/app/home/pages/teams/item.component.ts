// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Component, Input } from '@angular/core';

import { Data, Icon, Topic } from '@/home/models/page-item.model';

import { TeamsPageTeam } from './teams.model';

@Component({
  selector: 'app-teams-item-team',
  templateUrl: './item.component.html',
  styleUrls: ['../../styles/item.component.scss']
})
export class TeamsItemTeamComponent {
  data: Data;
  icon: Icon;
  topics: Topic[];

  @Input()
  set item(team: TeamsPageTeam) {
    this.data = {
      name: team.data.name,
      link: team.data.slug,
      query: null
    };
    this.icon = null;
    this.topics = [];
  }
}
