/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faCog, faPlus, faTasks, faUsers, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import type { TeamItem } from '@weasel/core/models/commontypes';
import { AlertService, AlertKind } from '@weasel/core/services';
import { PageComponent, PageTab } from '@weasel/home/components';
import { TeamCreateSuiteComponent } from './create.component';
import { TeamInviteComponent } from './invite.component';
import { TeamPageSuite } from './team.model';
import { TeamPageTabType, TeamPageService } from './team.service';

const pageTabs: PageTab<TeamPageTabType>[] = [
  {
    type: TeamPageTabType.Suites,
    name: 'Suites',
    link: 'suites',
    icon: 'tasks',
    shown: true
  },
  {
    type: TeamPageTabType.Members,
    name: 'Members',
    link: 'members',
    icon: 'users',
    shown: true
  },
  {
    type: TeamPageTabType.Settings,
    name: 'Settings',
    link: 'settings',
    icon: 'cog',
    shown: true
  },
];

type NotFound = Partial<{
  teamSlug: string
}>;

@Component({
  selector: 'app-team-page',
  templateUrl: './page.component.html',
  providers: [ TeamPageService, { provide: 'PAGE_TABS', useValue: pageTabs } ]
})
export class TeamPageComponent extends PageComponent<TeamPageSuite, TeamPageTabType, NotFound> implements OnInit, OnDestroy {

  team: TeamItem;
  teams: TeamItem[];
  TabType = TeamPageTabType;

  private _modalRef: NgbModalRef;

  private _subTeams: Subscription;
  private _subTeam: Subscription;
  private _subAlert: Subscription;

  /**
   *
   */
  constructor(
    private alertService: AlertService,
    private modalService: NgbModal,
    private router: Router,
    private teamPageService: TeamPageService,
    private faIconLibrary: FaIconLibrary,
    route: ActivatedRoute
  ) {
    super(teamPageService, pageTabs, route);
    faIconLibrary.addIcons(faCog, faPlus, faTasks, faUserPlus, faUsers);
    this._subAlert = this.alertService.alerts$.subscribe(v => {
      if (v.some(k => k.kind === AlertKind.TeamNotFound)) {
        this._notFound.teamSlug = this.route.snapshot.paramMap.get('team');
      }
    });
    this._subTeams = this.teamPageService.teams$.subscribe(v => {
      this.teams = v;
    });
    this._subTeam = this.teamPageService.team$.subscribe(v => {
      this.team = v;
    });
  }

  /**
   *
   */
  ngOnInit() {
    super.ngOnInit();
  }

  /**
   *
   */
  ngOnDestroy() {
    this._subAlert.unsubscribe();
    this._subTeams.unsubscribe();
    this._subTeam.unsubscribe();
    super.ngOnDestroy();
  }

  /**
   *
   */
  fetchItems(): void {
    const paramMap = this.route.snapshot.paramMap;
    const teamSlug = paramMap.get('team');
    this.pageService.fetchItems({ currentTab: this.currentTab, teamSlug });
  }

  /**
   *
   */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    // pressing key 'Backspace' should return user to "Teams" page
    if ('Backspace' === event.key) {
      this.router.navigate(['..'], {relativeTo: this.route });
    }
  }

  /**
   *
   */
  public switchPage(teamSlug: string) {
    if (this.team.slug !== teamSlug) {
      this.router.navigate([ '~', teamSlug ]);
      this.teamPageService.updateTeamSlug(this.currentTab, teamSlug);
    }
  }

  /**
   *
   */
  openCreateModal() {
    this._modalRef = this.modalService.open(TeamCreateSuiteComponent);
    this._modalRef.componentInstance.teamSlug = this.team.slug;
    this._modalRef.result
      .then((state: boolean) => {
        if (state) {
          this.fetchItems();
        }
      })
      .catch(_e => true);
  }

  /**
   *
   */
  openInviteModal() {
    this._modalRef = this.modalService.open(TeamInviteComponent);
    this._modalRef.componentInstance.teamSlug = this.team.slug;
    this._modalRef.result
      .then((state: boolean) => {
        if (state) {
          this.teamPageService.refreshMembers();
        }
      })
      .catch(_e => true);
  }

}
