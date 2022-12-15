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

@Component({
  selector: 'app-team-page',
  templateUrl: './page.component.html',
  providers: [TeamPageService, EventService]
})
export class TeamPageComponent
  extends PageComponent<TeamPageSuite, NotFound>
  implements OnInit, OnDestroy
{
  teams: RefinedTeamList;
  team: TeamItem;

  tabs: PageTab<TeamPageTabType>[];
  currentTab: PageTab<TeamPageTabType>;
  TabType = TeamPageTabType;

  banner: TeamBannerType;
  BannerType = TeamBannerType;

  private _dialogRef: DialogRef;
  private _sub: Record<
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
    this._sub = {
      alert: alertService.alerts$.subscribe((v) => {
        if (v.some((k) => k.kind === AlertKind.TeamNotFound)) {
          this.banner = TeamBannerType.TeamNotFound;
          this._notFound.teamSlug = route.snapshot.paramMap.get('team');
          localStorage.removeItem(ELocalStorageKey.LastVisitedTeam);
        }
      }),
      banner: teamPageService.banner$.subscribe((v) => {
        this.banner = v;
        if (this.banner === this.BannerType.TeamNotFound) {
          this._notFound.teamSlug = route.snapshot.paramMap.get('team');
        }
      }),
      dialog: undefined,
      event: eventService.event$
        .pipe(debounceTime(250))
        .subscribe((v) => this.teamPageService.consumeEvent(v)),
      tab: teamPageService.data.tab$.subscribe((v) => (this.currentTab = v)),
      tabs: teamPageService.data.tabs$.subscribe((v) => {
        this.tabs = v;
        const queryMap = this.route.snapshot.queryParamMap;
        const getQuery = (key: string) =>
          queryMap.has(key) ? queryMap.get(key) : null;
        const tab = this.tabs.find((v) => v.link === getQuery('t')) || v[0];
        this.teamPageService.updateCurrentTab(tab);
      }),
      teams: teamPageService.data.teams$.subscribe((v) => {
        if (v.active.length && !this.route.snapshot.params.team) {
          const activeTeam =
            localStorage.getItem(ELocalStorageKey.LastVisitedTeam) ??
            v.active[0].slug;
          this.router.navigate(['~', activeTeam]);
        }
        this.teams = v;
      }),
      team: teamPageService.data.team$.subscribe((v) => {
        this.team = v;
      })
    };
  }

  ngOnInit() {
    super.ngOnInit();
  }

  ngOnDestroy() {
    Object.values(this._sub)
      .filter(Boolean)
      .forEach((v) => v.unsubscribe());
    super.ngOnDestroy();
  }

  fetchItems(): void {
    this.teamPageService.fetchItems({
      teamSlug: this.route.snapshot.paramMap.get('team')
    });
  }

  switchTab(tab: PageTab<TeamPageTabType>) {
    this.teamPageService.updateCurrentTab(tab);
  }

  public switchPage(teamSlug: string) {
    if (this.team.slug !== teamSlug) {
      this.router.navigate(['~', teamSlug]);
      this.teamPageService.updateTeamSlug(teamSlug);
    }
  }

  openCreateTeamModel() {
    this._dialogRef = this.dialogService.open(TeamCreateTeamComponent, {
      closeButton: false,
      minHeight: '10vh'
    });
    this._sub.dialog = this._dialogRef.afterClosed$.subscribe(
      (state: { action: string; slug: string }) => {
        if (state) {
          if (state.action === 'create') {
            this.router.navigate(['~', state.slug]);
            this.teamPageService.refreshTeams(state.slug);
          } else {
            this.teamPageService.refreshTeams();
          }
        }
      }
    );
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
    this._dialogRef = this.dialogService.open(ConfirmComponent, {
      closeButton: false,
      data: elements,
      minHeight: '10vh'
    });
    this._sub.dialog = this._dialogRef.afterClosed$.subscribe(
      (state: boolean) => {
        if (!state) {
          return;
        }
        func();
      }
    );
  }

  accept(item: TeamItem) {
    const url = ['team', item.slug, 'invite', 'accept'].join('/');
    this.apiService.post(url).subscribe(() => {
      const index = this.teams.invitations.findIndex((v) => v === item);
      this.teams.invitations.splice(index, 1);
      this.teamPageService.refreshTeams();
      this.teamPageService.fetchItems({
        teamSlug: this.route.snapshot.paramMap.get('team')
      });
    });
  }

  private decline(item: TeamItem) {
    const url = ['team', item.slug, 'invite', 'decline'].join('/');
    this.apiService.post(url).subscribe(() => {
      const index = this.teams.invitations.findIndex((v) => v === item);
      this.teams.invitations.splice(index, 1);
      this.teamPageService.fetchItems({
        teamSlug: this.route.snapshot.paramMap.get('team')
      });
    });
  }

  private rescind(item: TeamItem) {
    const url = ['team', item.slug, 'join'].join('/');
    this.apiService.delete(url).subscribe(() => {
      const index = this.teams.requests.findIndex((v) => v === item);
      this.teams.requests.splice(index, 1);
      this.teamPageService.fetchItems({
        teamSlug: this.route.snapshot.paramMap.get('team')
      });
    });
  }
}
