import { ApiError } from '@sorter/common';
import { createIdempotencyKey } from '../utils';
import { IHttpClient, IResponseFormat, RequestConfig } from './types';


type Method = 'HEAD' | 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE';

const CANCELLED_STATUS = -999;
const NETWORK_ERROR_STATUS = 0;

export type FetchHttpClientOptions = {
  baseUrl?: string;
  maxRetries?: number;
  retryBaseDelay?: number;
};

/**
 * IHttpClient on top of fetch, with retries for transient failures.
 * Every mutation carries one idempotency key that is reused by its retries,
 * so the server applies it once even if a response got lost on the way back.
 */
export class FetchHttpClient implements IHttpClient {
  private readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly retryBaseDelay: number;

  constructor({ baseUrl = '', maxRetries = 3, retryBaseDelay = 400 }: FetchHttpClientOptions = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.maxRetries = maxRetries;
    this.retryBaseDelay = retryBaseDelay;
  }

  head<T = void>(url: string, params: any, signal: AbortSignal, config?: RequestConfig) {
    return this.request<T>('HEAD', url, params, undefined, signal, config);
  }

  get<T>(url: string, params: any, signal: AbortSignal, config?: RequestConfig) {
    return this.request<T>('GET', url, params, undefined, signal, config);
  }

  put<T>(url: string, data: unknown, params: any, signal: AbortSignal, config?: RequestConfig) {
    return this.request<T>('PUT', url, params, data, signal, config);
  }

  post<T>(url: string, data: unknown, params: any, signal: AbortSignal, config?: RequestConfig) {
    return this.request<T>('POST', url, params, data, signal, config);
  }

  patch<T>(url: string, data: unknown, params: any, signal: AbortSignal, config?: RequestConfig) {
    return this.request<T>('PATCH', url, params, data, signal, config);
  }

  delete<T>(url: string, params: any, signal: AbortSignal, config?: RequestConfig) {
    return this.request<T>('DELETE', url, params, undefined, signal, config);
  }

  private async request<T>(
    method: Method,
    url: string,
    params: Record<string, unknown> | undefined,
    data: unknown,
    signal: AbortSignal,
    config: RequestConfig = {},
  ): Promise<IResponseFormat<T>> {
    const headers: Record<string, string> = { ...config.headers };

    if (data !== undefined) {
      headers['Content-Type'] ??= 'application/json';
    }

    if (isMutation(method)) {
      headers['X-Idempotency-Key'] ??= createIdempotencyKey();
    }

    const init: RequestInit = {
      method,
      headers,
      body: data === undefined ? undefined : JSON.stringify(data),
      signal,
    };
    const target = this.buildUrl(url, params);
    const maxRetries = config.retries ?? this.maxRetries;

    for (let attempt = 0; ; attempt++) {
      let failure: ApiError;

      try {
        const res = await fetch(target, init);

        if (res.ok) {
          return { data: (await parseBody(res)) as T, status: res.status, headers: res.headers };
        }

        failure = await toApiError(res);
      } catch (err) {
        failure = toTransportError(err, signal);
      }

      if (failure.cancelled || attempt >= maxRetries || !isRetriable(failure, method)) {
        throw failure;
      }

      try {
        await sleep(this.retryBaseDelay * 2 ** attempt, signal);
      } catch (err) {
        throw toTransportError(err, signal);
      }
    }
  }

  private buildUrl(url: string, params: Record<string, unknown> = {}): string {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        search.set(key, String(value));
      }
    }

    const qs = search.toString();

    return `${this.baseUrl}${url}${qs ? `?${qs}` : ''}`;
  }
}


/* HELPERS */

function isMutation(method: Method): boolean {
  return method !== 'GET' && method !== 'HEAD';
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();

  return text ? JSON.parse(text) : {};
}

async function toApiError(res: Response): Promise<ApiError> {
  let code: string | null = null;
  let message = `Request failed with status ${res.status}`;

  try {
    const body = (await parseBody(res)) as { error?: string; message?: string } | undefined;

    code = body?.error ?? null;
    message = body?.message ?? message;
  } catch {
    // non-JSON error body: keep the generic message
  }

  return new ApiError(message, res.status, code);
}

function toTransportError(err: unknown, signal: AbortSignal): ApiError {
  if (signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
    return new ApiError('Request cancelled', CANCELLED_STATUS);
  }

  // fetch rejects with a TypeError when the network is unavailable
  return new ApiError(err instanceof Error ? err.message : 'Network error', NETWORK_ERROR_STATUS);
}

function isRetriable(err: ApiError, method: Method): boolean {
  if (err.status === NETWORK_ERROR_STATUS) {
    return true;
  }

  // the same idempotency key is still being processed: ask again later for its stored outcome
  if (err.status === 409 && err.code === 'Conflict') {
    return true;
  }

  // the server stores mutation responses under their idempotency key, so only reads gain from retrying errors
  return !isMutation(method) && (err.status >= 500 || err.status === 408 || err.status === 429);
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));

      return;
    }

    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    signal.addEventListener('abort', onAbort, { once: true });
  });
}
