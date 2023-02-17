// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { Component, OnDestroy } from '@angular/core';
import { EFeatureFlag } from '@touca/api-schema';
import { Subscription, timer } from 'rxjs';

import { toggleAppearance } from '@/core/models/theme';
import { UserService } from '@/core/services';
import { Checkbox } from '@/account/settings/checkbox.component';

@Component({
  selector: 'app-settings-tab-preferences',
  templateUrl: './preferences.component.html',
  styles: []
})
export class SettingsTabPreferencesComponent implements OnDestroy {
  toggleAppearance = toggleAppearance;
  private subscriptions: Record<'user', Subscription>;
  private preferences: Record<EFeatureFlag, Checkbox & { slug: EFeatureFlag }> =
    {
      newsletter_product: {
        default: true,
        description:
          'Receive monthly emails about major features and important product updates',
        experimental: false,
        saved: false,
        slug: 'newsletter_product',
        title: 'Monthly Product Updates'
      },
      newsletter_changelog: {
        default: false,
        description:
          'Receive weekly emails about newly released features and improvements',
        experimental: false,
        saved: false,
        slug: 'newsletter_changelog',
        title: 'Weekly Changelog'
      }
    };

  constructor(private userService: UserService) {
    this.subscriptions = {
      user: this.userService.currentUser$.subscribe((user) => {
        user.feature_flags.forEach((v) => {
          if (this.preferences[v]) {
            this.preferences[v].value = true;
          }
        });
      })
    };
  }

  ngOnDestroy() {
    Object.values(this.subscriptions)
      .filter(Boolean)
      .forEach((v) => v.unsubscribe());
  }

  getPreferences(experimental: boolean): Checkbox[] {
    return Object.values(this.preferences).filter(
      (v) => v.experimental === experimental
    );
  }

  toggleFeatureFlag(flag: Checkbox) {
    const node = this.preferences[flag.slug];
    node.value = !(node.value ?? false);
    this.userService
      .updateFeatureFlag(flag.slug, node.value as boolean)
      .subscribe({
        next: () => {
          node.saved = true;
          timer(3000).subscribe(() => (node.saved = false));
        }
      });
  }
}
