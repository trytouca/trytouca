// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogRef, DialogService } from '@ngneat/dialog';
import type { TeamItem } from '@touca/api-schema';
import { debounceTime, Subscription } from 'rxjs';

import { ELocalStorageKey } from '@/core/models/frontendtypes';
import {
  AlertKind,
  AlertService,
  ApiService,
  EventService
} from '@/core/services';
import {
  ConfirmComponent,
  ConfirmElements,
  PageComponent,
  PageTab
} from '@/home/components';

import { TeamCreateTeamComponent } from './create-team.component';
import { TeamPageSuite } from './team.model';
import {
  RefinedTeamList,
  TeamBannerType,
  TeamPageService,
  TeamPageTabType
} from './team.service';

type NotFound = Partial<{
  teamSlug: string;
}>;

const allTabs: Array<PageTab<TeamPageTabType>> = [
  {
    type: 'suites',
    name: 'Suites',
    link: 'suites',
    icon: 'feather-list',
    shown: true
  },
  {
    type: 'members',
    name: 'Members',
    link: 'members',
    icon: 'feather-users',
    shown: true
  },
  {
    type: 'settings',
    name: 'Settings',
    link: 'settings',
    icon: 'feather-settings',
    shown: true
  },
  {
    type: 'firstTeam',
    name: 'New Team',
    link: 'first-team',
    icon: 'feather-plus-circle',
    shown: true
  },
  {
    type: 'invitations',
    name: 'Invitations',
    link: 'invitations',
    icon: 'feather-gift',
    shown: true
  },
  {
    type: 'requests',
    name: 'Requests',
    link: 'requests',
    icon: 'feather-send',
    shown: true
  }
];

@Component({
  selector: 'app-team-page',
  templateUrl: './page.component.html',
  providers: [TeamPageService, EventService]
})
export class TeamPageComponent
  extends PageComponent<TeamPageSuite, NotFound>
  implements OnInit, OnDestroy
{
  data: Partial<{
    banner: TeamBannerType;
    tab: PageTab<TeamPageTabType>;
    tabs: Array<PageTab<TeamPageTabType>>;
    team: TeamItem;
    teams: RefinedTeamList;
  }> = {
    tabs: []
  };

  private subscriptions: Record<
    'alert' | 'banner' | 'dialog' | 'event' | 'tab' | 'tabs' | 'teams' | 'team',
    Subscription
  >;

  constructor(
    private apiService: ApiService,
    private dialogService: DialogService,
    private route: ActivatedRoute,
    private router: Router,
    private teamPageService: TeamPageService,
    alertService: AlertService,
    eventService: EventService
  ) {
    super(teamPageService);
    this.subscriptions = {
      alert: alertService.alerts$.subscribe((v) => {
        if (v.some((k) => k.kind === AlertKind.TeamNotFound)) {
          this.data.banner = 'team-not-found';
          this._notFound.teamSlug = route.snapshot.paramMap.get('team');
          localStorage.removeItem(ELocalStorageKey.LastVisitedTeam);
        }
      }),
      banner: teamPageService.data.banner$.subscribe((v) => {
        this.data.banner = v;
        if (this.data.banner === 'team-not-found') {
          this._notFound.teamSlug = route.snapshot.paramMap.get('team');
        }
      }),
      dialog: undefined,
      event: eventService.event$
        .pipe(debounceTime(250))
        .subscribe((v) => this.teamPageService.consumeEvent(v)),
      tab: teamPageService.data.tab$.subscribe(
        (v) => (this.data.tab = allTabs.find((t) => t.shown && t.type === v))
      ),
      tabs: teamPageService.data.tabs$.subscribe((tabs) => {
        this.data.tabs = allTabs.filter((v) => tabs.includes(v.type));
        const queryMap = this.route.snapshot.queryParamMap;
        const getQuery = (key: string) =>
          queryMap.has(key) ? queryMap.get(key) : null;
        const tab =
          this.data.tabs.find((t) => t.link === getQuery('t')) ||
          this.data.tabs[0];
        this.teamPageService.updateCurrentTab(tab.type);
      }),
      teams: teamPageService.data.teams$.subscribe((v) => {
        if (v.active.length && !this.route.snapshot.params.team) {
          const activeTeam =
            localStorage.getItem(ELocalStorageKey.LastVisitedTeam) ??
            v.active[0].slug;
          this.router.navigate(['~', activeTeam]);
        }
        this.data.teams = v;
      }),
      team: teamPageService.data.team$.subscribe((v) => {
        this.data.team = v;
      })
    };
  }

  ngOnInit() {
    super.ngOnInit();
  }

  ngOnDestroy() {
    Object.values(this.subscriptions)
      .filter(Boolean)
      .forEach((v) => v.unsubscribe());
    super.ngOnDestroy();
  }

  fetchItems(): void {
    this.teamPageService.fetchItems({
      teamSlug: this.route.snapshot.paramMap.get('team')
    });
  }

  switchTab(tab: TeamPageTabType) {
    this.teamPageService.updateCurrentTab(tab);
  }

  switchPage(teamSlug: string) {
    if (this.data.team.slug !== teamSlug) {
      this.router.navigate(['~', teamSlug]);
      this.teamPageService.updateTeamSlug(teamSlug);
    }
  }

  openCreateTeamModel() {
    this.subscriptions.dialog = this.dialogService
      .open(TeamCreateTeamComponent, {
        closeButton: false,
        minHeight: '10vh'
      })
      .afterClosed$.subscribe((state: { action: string; slug: string }) => {
        if (state) {
          if (state.action === 'create') {
            this.router.navigate(['~', state.slug]);
            this.teamPageService.refreshTeams(state.slug);
          } else {
            this.teamPageService.refreshTeams();
          }
        }
      });
  }

  confirmDecline(item: TeamItem): void {
    const elements: ConfirmElements = {
      title: 'Decline Team Invitation',
      message: `<p>Can you confirm you want to decline team <em>${item.name}</em>'s invitation?</p>`,
      button: 'Decline Invitation'
    };
    this.showConfirmation(elements, () => this.decline(item));
  }

  confirmRescind(item: TeamItem): void {
    const elements: ConfirmElements = {
      title: 'Rescind Join Request',
      message: `<p>Can you confirm you want to cancel your request to join team <em>${item.name}</em>?</p>`,
      button: 'Rescind Request'
    };
    this.showConfirmation(elements, () => this.rescind(item));
  }

  private showConfirmation(elements: ConfirmElements, func: () => void) {
    this.subscriptions.dialog = this.dialogService
      .open(ConfirmComponent, {
        closeButton: false,
        data: elements,
        minHeight: '10vh'
      })
      .afterClosed$.subscribe((state: boolean) => {
        if (!state) {
          return;
        }
        func();
      });
  }

  accept(item: TeamItem) {
    const url = ['team', item.slug, 'invite', 'accept'].join('/');
    this.apiService.post(url).subscribe(() => {
      const index = this.data.teams.invitations.findIndex((v) => v === item);
      this.data.teams.invitations.splice(index, 1);
      this.teamPageService.refreshTeams();
      this.teamPageService.fetchItems({
        teamSlug: this.route.snapshot.paramMap.get('team')
      });
    });
  }

  private decline(item: TeamItem) {
    const url = ['team', item.slug, 'invite', 'decline'].join('/');
    this.apiService.post(url).subscribe(() => {
      const index = this.data.teams.invitations.findIndex((v) => v === item);
      this.data.teams.invitations.splice(index, 1);
      this.teamPageService.fetchItems({
        teamSlug: this.route.snapshot.paramMap.get('team')
      });
    });
  }

  private rescind(item: TeamItem) {
    const url = ['team', item.slug, 'join'].join('/');
    this.apiService.delete(url).subscribe(() => {
      const index = this.data.teams.requests.findIndex((v) => v === item);
      this.data.teams.requests.splice(index, 1);
      this.teamPageService.fetchItems({
        teamSlug: this.route.snapshot.paramMap.get('team')
      });
    });
  }
}
