// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgIconsModule } from '@ng-icons/core';
import {
  featherActivity,
  featherAlertCircle,
  featherArchive,
  featherBell,
  featherBellOff,
  featherChevronDown,
  featherChevronRight,
  featherCpu,
  featherCreditCard,
  featherDatabase,
  featherDownloadCloud,
  featherEdit2,
  featherFilePlus,
  featherFileText,
  featherGift,
  featherGithub,
  featherHardDrive,
  featherKey,
  featherLink,
  featherLinkedin,
  featherList,
  featherLogOut,
  featherMail,
  featherPlusCircle,
  featherRss,
  featherSend,
  featherSettings,
  featherSliders,
  featherTrash2,
  featherTwitter,
  featherUploadCloud,
  featherUser,
  featherUserPlus,
  featherUsers,
  featherX
} from '@ng-icons/feather-icons';
import {
  heroArrowPath,
  heroArrowUpTray,
  heroBolt,
  heroCalendar,
  heroCheckCircle,
  heroChevronDoubleLeft,
  heroChevronDown,
  heroClipboardDocument,
  heroClock,
  heroCommandLine,
  heroEllipsisVertical,
  heroExclamationCircle,
  heroEye,
  heroEyeSlash,
  heroStar
} from '@ng-icons/heroicons/outline';
import {
  heroInformationCircleSolid,
  heroPlusSolid
} from '@ng-icons/heroicons/solid';
import { TippyModule, tooltipVariation } from '@ngneat/helipopper';
import { ClipboardModule } from 'ngx-clipboard';

import {
  AlertComponent,
  CheckboxComponent,
  FooterComponent,
  HeaderInsideComponent,
  HeaderOutsideComponent,
  HelpComponent,
  NotificationComponent,
  ServerDownComponent,
  SpinnerComponent
} from './components';
import { AutofocusDirective, DropdownDirective } from './directives';
import { DateAgoPipe, DateTimePipe } from './pipes';

@NgModule({
  imports: [
    ClipboardModule,
    CommonModule,
    FontAwesomeModule,
    FormsModule,
    HttpClientModule,
    NgIconsModule.withIcons({
      featherActivity,
      featherAlertCircle,
      featherArchive,
      featherBell,
      featherBellOff,
      featherChevronDown,
      featherChevronRight,
      featherCpu,
      featherCreditCard,
      featherDatabase,
      featherDownloadCloud,
      featherEdit2,
      featherFilePlus,
      featherFileText,
      featherGift,
      featherGithub,
      featherHardDrive,
      featherKey,
      featherLink,
      featherLinkedin,
      featherList,
      featherLogOut,
      featherMail,
      featherPlusCircle,
      featherRss,
      featherSend,
      featherSettings,
      featherSliders,
      featherTrash2,
      featherTwitter,
      featherUploadCloud,
      featherUser,
      featherUserPlus,
      featherUsers,
      featherX,
      heroArrowPath,
      heroArrowUpTray,
      heroBolt,
      heroCalendar,
      heroCheckCircle,
      heroChevronDoubleLeft,
      heroChevronDown,
      heroClipboardDocument,
      heroClock,
      heroCommandLine,
      heroEllipsisVertical,
      heroEye,
      heroEyeSlash,
      heroExclamationCircle,
      heroInformationCircleSolid,
      heroPlusSolid,
      heroStar
    }),
    ReactiveFormsModule,
    RouterModule,
    TippyModule.forRoot({
      defaultVariation: 'tooltip',
      variations: {
        tooltip: {
          ...tooltipVariation,
          delay: [100, 300],
          hideOnClick: true
        }
      }
    })
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
    ServerDownComponent,
    SpinnerComponent
  ],
  exports: [
    AlertComponent,
    AutofocusDirective,
    CheckboxComponent,
    ClipboardModule,
    CommonModule,
    DateAgoPipe,
    DateTimePipe,
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
    ServerDownComponent,
    SpinnerComponent,
    TippyModule
  ]
})
export class SharedModule {}
