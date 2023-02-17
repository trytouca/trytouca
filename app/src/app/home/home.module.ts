// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
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
    HomeRoutingModule,
    MarkdownModule.forRoot(),
    SharedModule
  ],
  declarations: [
    HomeComponent,
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
    BatchCommentsComponent,
    BatchPageComponent,
    BatchPromoteComponent,
    BatchSealComponent,
    BatchItemElementComponent,
    BatchListElementsComponent,
    ElementItemMetricComponent,
    ElementItemResultComponent,
    ElementListAssumptionsComponent,
    ElementListMetricsComponent,
    ElementListResultsComponent,
    ElementPageComponent
  ]
})
export class HomeModule {}
