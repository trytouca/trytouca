// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgxDiffModule } from 'ngx-diff';
import { MarkdownModule } from 'ngx-markdown';

import { SharedModule } from '../shared';
import {
  CommentComponent,
  ConfirmComponent,
  HomeNotFoundComponent,
  ListFilterComponent,
  ListPagerComponent,
  ModalComponent,
  PageListComponent,
  PageOverviewComponent,
  PillContainerComponent,
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
  ElementListAssumptionsComponent,
  ElementListMetricsComponent,
  ElementListResultsComponent,
  ElementPageComponent
} from './pages/element';
import {
  SuiteChartRuntimeComponent,
  SuiteFirstBatchComponent,
  SuiteItemBatchComponent,
  SuiteItemCaseComponent,
  SuiteItemPromotionComponent,
  SuiteListBatchesComponent,
  SuiteListCommentsComponent,
  SuitePageComponent,
  SuiteTabCasesComponent,
  SuiteTabSettingsComponent,
  SuiteTrendsRuntimeComponent
} from './pages/suite';
import {
  TeamCreateSuiteComponent,
  TeamCreateTeamComponent,
  TeamFirstSuiteComponent,
  TeamFirstTeamComponent,
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

@NgModule({
  providers: [],
  imports: [
    CommonModule,
    NgxDiffModule,
    HomeRoutingModule,
    MarkdownModule.forRoot(),
    SharedModule
  ],
  declarations: [
    HomeComponent,
    // shared components
    CommentComponent,
    ConfirmComponent,
    HomeNotFoundComponent,
    ListFilterComponent,
    ListPagerComponent,
    ModalComponent,
    PageListComponent,
    PageOverviewComponent,
    PillContainerComponent,
    VersionListComponent,
    VersionNavigatorComponent,
    // team page components
    TeamPageComponent,
    TeamCreateSuiteComponent,
    TeamCreateTeamComponent,
    TeamFirstSuiteComponent,
    TeamFirstTeamComponent,
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
    SuiteItemCaseComponent,
    SuiteItemPromotionComponent,
    SuiteListBatchesComponent,
    SuiteListCommentsComponent,
    SuiteChartRuntimeComponent,
    SuiteTabCasesComponent,
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
    ElementListAssumptionsComponent,
    ElementListMetricsComponent,
    ElementListResultsComponent,
    ElementPageComponent
  ]
})
export class HomeModule {}
