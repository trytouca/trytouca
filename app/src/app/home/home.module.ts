// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MarkdownModule } from 'ngx-markdown';

import { SharedModule } from '../shared';
import {
  CommentComponent,
  ConfirmComponent,
  FeedbackLinkComponent,
  HomeNotFoundComponent,
  ListFilterComponent,
  ListPagerComponent,
  ModalComponent,
  PageListComponent,
  PageOverviewComponent,
  VersionListComponent,
  VersionNavigatorComponent
} from './components';
import { HomeComponent } from './home.component';
import { HomeRoutingModule } from './home-routing.module';
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
import {
  SuiteChartRuntimeComponent,
  SuiteFirstBatchComponent,
  SuiteItemBatchComponent,
  SuiteItemPromotionComponent,
  SuiteListBatchesComponent,
  SuiteListCommentsComponent,
  SuitePageComponent,
  SuiteTabSettingsComponent,
  SuiteTrendsRuntimeComponent
} from './pages/suite';
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
  TeamsCreateTeamComponent,
  TeamsFirstTeamComponent,
  TeamsItemTeamComponent,
  TeamsPageComponent,
  TeamsTabTeamsComponent
} from './pages/teams';

@NgModule({
  providers: [],
  imports: [
    CommonModule,
    HomeRoutingModule,
    MarkdownModule.forRoot(),
    SharedModule
  ],
  declarations: [
    HomeComponent,
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
    SuiteListCommentsComponent,
    SuiteChartRuntimeComponent,
    SuiteTabSettingsComponent,
    SuiteTrendsRuntimeComponent,
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
    ElementPageComponent
  ]
})
export class HomeModule {}
