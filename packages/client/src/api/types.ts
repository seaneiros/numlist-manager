export type ApiIntent<Response> = [
  () => Promise<Response>,
  () => void,
];

export interface IResponseFormat<T> {
  data: T;
  status: number;
  headers: Headers;
}

export type RequestConfig = {
  headers?: Record<string, string>;
  retries?: number;
};

export interface IHttpClient {
  head<T = void>(url: string, params: any, signal: AbortSignal, config?: RequestConfig): Promise<IResponseFormat<T>>;
  get<T>(url: string, params: any, signal: AbortSignal, config?: RequestConfig): Promise<IResponseFormat<T>>;
  put<T>(url: string, data: unknown, params: any, signal: AbortSignal, config?: RequestConfig): Promise<IResponseFormat<T>>;
  post<T>(url: string, data: unknown, params: any, signal: AbortSignal, config?: RequestConfig): Promise<IResponseFormat<T>>;
  patch<T>(url: string, data: unknown, params: any, signal: AbortSignal, config?: RequestConfig): Promise<IResponseFormat<T>>;
  delete<T>(url: string, params: any, signal: AbortSignal, config?: RequestConfig): Promise<IResponseFormat<T>>;
}

export interface IListCriteria {
  search?: string;
  limit?: number;
  /** Cursor: first item of the requested page. */
  from?: number;
};

export type ListResponse = {
  items: number[];
  next: number | null;
};

/**
 * `{ src, target }` moves `src` right after `target`,
 * `{ src }` moves `src` to the head,
 * `{ target }` moves `target` to the tail.
 */
export type SelectionOrderChangePayload =
  | { src: number; target: number }
  | { src: number }
  | { target: number };
