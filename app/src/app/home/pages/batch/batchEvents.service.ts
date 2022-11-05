// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { map, share } from 'rxjs/operators';
import { ServerEvent, RawServerEvent } from '@touca/server-events';
import { EventSourceService } from '@/core/services/eventSource.service';
import { ApiService } from '@/core/services';

// @todo: this pattern is not very robust.  In particular, it doesn't allow for any
// future possibility of subscribing to more than one batch events URL at once, e.g.
// if we wanted to receive batch events for more than one suite at a time.  As it is,
// this Service is basically coupled to the 'one page, one list subscription'
// model of the current UI.
@Injectable({ providedIn: 'root' })
export class BatchEventService {
  private eventSource: EventSource;
  private source$: Observable<ServerEvent>;

  constructor(
    private es: EventSourceService,
    private ngZone: NgZone,
    private apiService: ApiService
  ) {}

  init(teamSlug: string, suiteSlug: string) {
    const path = ['batch', teamSlug, suiteSlug, 'events'].join('/');

    if (this.source$ !== undefined) return;

    const eventSource = this.es.create(path);

    this.eventSource = eventSource;

    this.source$ = new Observable((observer) => {
      eventSource.onmessage = (msg) => {
        this.ngZone.run(() => observer.next(msg));
      };

      eventSource.onerror = (e) => {
        this.ngZone.run(() => observer.error(e));
      };

      return () => eventSource.close();
    }).pipe(
      // @todo: handle errors
      map<RawServerEvent, ServerEvent>((e) => JSON.parse(e.data)),
      share()
    );

    return this.source$;
  }

  close() {
    if (this.source$ === undefined) return;

    this.eventSource.close();

    this.eventSource = undefined;
    this.source$ = undefined;
  }
}
