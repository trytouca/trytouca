// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DialogModule } from '@ngneat/dialog';
import { ClipboardModule } from 'ngx-clipboard';
import { NgIconsModule } from '@ng-icons/core';
import {
  HeroBadgeCheck,
  HeroCalendar,
  HeroChatAlt2,
  HeroCheckCircle,
  HeroChevronDoubleLeft,
  HeroChevronDown,
  HeroClipboardCopy,
  HeroClock,
  HeroDotsVertical,
  HeroExclamationCircle,
  HeroEye,
  HeroEyeOff,
  HeroInformationCircle,
  HeroLightningBolt,
  HeroMail,
  HeroPlusSolid,
  HeroRefresh,
  HeroSpeakerphone,
  HeroStar,
  HeroTerminal,
  HeroUpload
} from '@ng-icons/heroicons';
import {
  FeatherChevronDown,
  FeatherFileText,
  FeatherGift,
  FeatherGithub,
  FeatherList,
  FeatherPlusCircle,
  FeatherSend,
  FeatherSettings,
  FeatherTwitter,
  FeatherUser,
  FeatherUserMinus,
  FeatherUserPlus,
  FeatherUsers
} from '@ng-icons/feather-icons';
import { OctDiff } from '@ng-icons/octicons';

import {
  AlertComponent,
  CheckboxComponent,
  FooterComponent,
  HeaderInsideComponent,
  HeaderOutsideComponent,
  HelpComponent,
  NotificationComponent,
  ServerDownComponent
} from './components';
import { AutofocusDirective, DropdownDirective } from './directives';
import { DateAgoPipe, DateTimePipe } from './pipes';

@NgModule({
  imports: [
    ClipboardModule,
    CommonModule,
    DialogModule.forRoot(),
    FontAwesomeModule,
    FormsModule,
    HttpClientModule,
    NgIconsModule.withIcons({
      FeatherChevronDown,
      FeatherFileText,
      FeatherGift,
      FeatherGithub,
      FeatherList,
      FeatherPlusCircle,
      FeatherSend,
      FeatherSettings,
      FeatherTwitter,
      FeatherUser,
      FeatherUserMinus,
      FeatherUserPlus,
      FeatherUsers,
      HeroBadgeCheck,
      HeroCalendar,
      HeroChatAlt2,
      HeroCheckCircle,
      HeroChevronDoubleLeft,
      HeroChevronDown,
      HeroClipboardCopy,
      HeroClock,
      HeroDotsVertical,
      HeroExclamationCircle,
      HeroEye,
      HeroEyeOff,
      HeroInformationCircle,
      HeroLightningBolt,
      HeroMail,
      HeroPlusSolid,
      HeroRefresh,
      HeroSpeakerphone,
      HeroStar,
      HeroTerminal,
      HeroUpload,
      OctDiff
    }),
    ReactiveFormsModule,
    RouterModule
  ],
  declarations: [
    AlertComponent,
    AutofocusDirective,
    CheckboxComponent,
    DateAgoPipe,
    DateTimePipe,
    DropdownDirective,
    FooterComponent,
    HeaderInsideComponent,
    HeaderOutsideComponent,
    HelpComponent,
    NotificationComponent,
    ServerDownComponent
  ],
  exports: [
    AlertComponent,
    AutofocusDirective,
    CheckboxComponent,
    ClipboardModule,
    CommonModule,
    DateAgoPipe,
    DateTimePipe,
    DialogModule,
    DropdownDirective,
    FontAwesomeModule,
    FooterComponent,
    FormsModule,
    HeaderInsideComponent,
    HeaderOutsideComponent,
    HelpComponent,
    HttpClientModule,
    NgIconsModule,
    NotificationComponent,
    ReactiveFormsModule,
    ServerDownComponent
  ]
})
export class SharedModule {}
