/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClipboardModule } from 'ngx-clipboard';
import { MomentModule } from 'ngx-moment';
import { MarkdownModule } from 'ngx-markdown';
import { HomeComponent } from './home.component';
import { HomeRoutingModule } from './home-routing.module';
import { SharedModule } from '../shared';

import {
  CommentComponent,
  ConfirmComponent,
  FeedbackLinkComponent,
  HomeNotFoundComponent,
  ListFilterComponent,
  ListPagerComponent,
  ModalComponent,
  NotificationComponent,
  PageListComponent,
  PageOverviewComponent,
  VersionListComponent,
  VersionNavigatorComponent
} from './components';

import {
  DurationPipe
} from './pipes';

import {
  TeamsCreateTeamComponent,
  TeamsFirstTeamComponent,
  TeamsItemTeamComponent,
  TeamsPageComponent,
  TeamsTabTeamsComponent
} from './pages/teams';

import {
  TeamCreateSuiteComponent,
  TeamFirstSuiteComponent,
  TeamInviteComponent,
  TeamItemApplicantComponent,
  TeamItemInviteeComponent,
  TeamItemMemberComponent,
  TeamItemSuiteComponent,
  TeamPageComponent,
  TeamTabMembersComponent,
  TeamTabSettingsComponent,
  TeamTabSuitesComponent
} from './pages/team';

import {
  SuiteChartRuntimeComponent,
  SuiteFirstBatchComponent,
  SuiteItemBatchComponent,
  SuiteItemPromotionComponent,
  SuiteListBatchesComponent,
  SuitePageComponent,
  SuiteTabSettingsComponent,
  SuiteTabTrendsComponent
} from './pages/suite';

import {
  BatchCommentsComponent,
  BatchItemElementComponent,
  BatchListElementsComponent,
  BatchPageComponent,
  BatchPromoteComponent,
  BatchSealComponent
} from './pages/batch';

import {
  ElementItemMetricComponent,
  ElementItemResultComponent,
  ElementListMetricsComponent,
  ElementListResultsComponent,
  ElementPageComponent
} from './pages/element';

@NgModule({
  providers: [
  ],
  imports: [
    ClipboardModule,
    CommonModule,
    HomeRoutingModule,
    MarkdownModule.forRoot(),
    MomentModule,
    SharedModule
  ],
  declarations: [
    HomeComponent,
    // pipes
    DurationPipe,
    // shared components
    CommentComponent,
    ConfirmComponent,
    FeedbackLinkComponent,
    HomeNotFoundComponent,
    ListFilterComponent,
    ListPagerComponent,
    ModalComponent,
    PageListComponent,
    PageOverviewComponent,
    NotificationComponent,
    VersionListComponent,
    VersionNavigatorComponent,
    // teams page components
    TeamsPageComponent,
    TeamsCreateTeamComponent,
    TeamsFirstTeamComponent,
    TeamsItemTeamComponent,
    TeamsTabTeamsComponent,
    // team page components
    TeamPageComponent,
    TeamCreateSuiteComponent,
    TeamFirstSuiteComponent,
    TeamInviteComponent,
    TeamItemApplicantComponent,
    TeamItemInviteeComponent,
    TeamItemMemberComponent,
    TeamItemSuiteComponent,
    TeamTabMembersComponent,
    TeamTabSettingsComponent,
    TeamTabSuitesComponent,
    // suite page components
    SuitePageComponent,
    SuiteFirstBatchComponent,
    SuiteItemBatchComponent,
    SuiteItemPromotionComponent,
    SuiteListBatchesComponent,
    SuiteChartRuntimeComponent,
    SuiteTabSettingsComponent,
    SuiteTabTrendsComponent,
    // batch page components
    BatchCommentsComponent,
    BatchPageComponent,
    BatchPromoteComponent,
    BatchSealComponent,
    BatchItemElementComponent,
    BatchListElementsComponent,
    // element page components
    ElementItemMetricComponent,
    ElementItemResultComponent,
    ElementListMetricsComponent,
    ElementListResultsComponent,
    ElementPageComponent,
  ]
})
export class HomeModule { }
