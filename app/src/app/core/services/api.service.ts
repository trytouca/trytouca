// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

import {
  HttpClient,
  HttpErrorResponse,
  HttpParams
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { PlatformStatus } from '@/core/models/commontypes';
import { getBackendUrl } from '@/core/models/environment';

@Injectable()
export class ApiService {
  _status: PlatformStatus;

  constructor(private http: HttpClient) {}

  private makeUrl(path: string): string {
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    return getBackendUrl() + path;
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(error);
  }

  get<T>(path: string, params: HttpParams = new HttpParams()): Observable<T> {
    const url = this.makeUrl(path);
    const opts = { params, withCredentials: true };

    return this.http.get<T>(url, opts).pipe(catchError(this.handleError));
  }

  patch(path: string, body: Record<string, unknown>): Observable<any> {
    const url = this.makeUrl(path);
    const opts = { withCredentials: true };

    return this.http.patch(url, body, opts).pipe(catchError(this.handleError));
  }

  post(path: string, body: Record<string, unknown> = {}): Observable<any> {
    const url = this.makeUrl(path);
    const opts = { withCredentials: true };

    return this.http.post(url, body, opts).pipe(catchError(this.handleError));
  }

  delete(path: string): Observable<any> {
    const url = this.makeUrl(path);
    const opts = { withCredentials: true };

    return this.http.delete(url, opts).pipe(catchError(this.handleError));
  }

  status(): Observable<PlatformStatus> {
    if (this._status) {
      return of(this._status);
    }
    return this.get<PlatformStatus>('/platform').pipe(
      map((doc) => {
        this._status = doc;
        return doc;
      })
    );
  }

  /**
   * Utility function to extract error message provided by backend
   * from a given HttpErrorResponse and map it to a user-friendly
   * error message.
   *
   * @param httpError error thrown by the http operations
   * @param errorList mapping between backend status code and error message
   *                  to a user-friendly message. If missing, function
   *                  returns error message as provided by backend.
   */
  extractError(
    httpError: HttpErrorResponse,
    errorList?: [number, string, string][]
  ): string {
    const defaultMsg =
      'Something went wrong. ' +
      'Please try this operation again at a later time.';
    const errors = httpError.error?.errors as string[] | undefined;
    if (!Array.isArray(errors) || errors.length === 0) {
      return defaultMsg;
    }
    if (!errorList) {
      return errors[0];
    }
    const status = httpError.status;
    const msg = errorList.find((el) => status === el[0] && errors[0] === el[1]);
    if (!msg) {
      return defaultMsg;
    }
    return msg[2];
  }
}
