// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, share } from 'rxjs/operators';
import { ApiService } from './api.service';
import { SuiteServiceEvents } from '../../home/pages/suite/suite.service';

type ServerEventType = SuiteServiceEvents;

export interface ServerEvent {
  eventType: ServerEventType;
  record: unknown;
}

interface RawServerEvent {
  data: string;
}

@Injectable({ providedIn: 'root' })
export class ServerEventService {
  private source$: Observable<ServerEvent>;

  constructor(private api: ApiService) {
    this.source$ = new Observable((observer) => {
      const eventSource = this.makeEventSource();

      eventSource.onopen = () => console.log('event source initialized');

      eventSource.onmessage = (msg) => {
        observer.next(msg);
      };

      eventSource.onerror = (e) => observer.error(e);

      return () => eventSource.close();
    }).pipe(
      // @todo: handle errors
      map<RawServerEvent, ServerEvent>((e) => JSON.parse(e.data)),
      share()
    );
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
