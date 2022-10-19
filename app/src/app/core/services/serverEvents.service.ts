// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { share, tap } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ServerEventService {
  private source$: Observable<Partial<MessageEvent<any>>>;

  constructor(private api: ApiService) {
    this.source$ = new Observable((observer) => {
      const eventSource = this.makeEventSource();

      eventSource.addEventListener('init', () => {
        console.log('event source initialized');
      });

      eventSource.onmessage = (msg) => {
        observer.next(msg);
      };

      eventSource.onerror = (e) => observer.error(e);

      return () => eventSource.close();
    }).pipe(share());
  }

  events() {
    return this.source$;
  }

  private makeEventSource() {
    return new EventSource(this.api.makeUrl('events'), {
      withCredentials: true
    });
  }
}
