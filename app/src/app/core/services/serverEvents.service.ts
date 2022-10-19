// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { share, tap } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ServerEventService implements OnDestroy {
  private eventSource: EventSource;
  private source$: Observable<Partial<MessageEvent<any>>>;

  constructor(private api: ApiService) {
    this.eventSource = this.makeEventSource();

    this.source$ = new Observable((observer) => {
      this.eventSource.onmessage = (msg) => observer.next(msg);
      this.eventSource.onerror = (e) => observer.error(e);
    }).pipe(
      tap(() => console.info('initializing shared event source')),
      share()
    );
  }

  ngOnDestroy(): void {
    this.eventSource.close();
  }

  events() {
    return this.source$;
  }

  private makeEventSource() {
    return new EventSource(this.api.makeUrl('events'));
  }
}
