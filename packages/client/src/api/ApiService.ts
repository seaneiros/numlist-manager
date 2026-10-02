import { ApiIntent, IHttpClient, IResponseFormat, RequestConfig } from './types';


export abstract class ApiService {
  constructor(private httpClient: IHttpClient) {}

  private createAbortHandler() {
    const controller = new AbortController();
    const { signal } = controller;

    return {
      signal,
      abort: () => controller.abort(),
    };
  }

  protected createHeadIntent<ResponseData>(url: string, params?: any, config?: RequestConfig): ApiIntent<IResponseFormat<ResponseData>> {
    const { signal, abort } = this.createAbortHandler();

    return [() => this.httpClient.head<ResponseData>(url, params, signal, config), abort];
  }

  protected createGetIntent<ResponseData>(url: string, params?: any, config?: RequestConfig): ApiIntent<IResponseFormat<ResponseData>> {
    const { signal, abort } = this.createAbortHandler();

    return [() => this.httpClient.get<ResponseData>(url, params, signal, config), abort];
  }

  protected createPutIntent<ResponseData>(url: string, data: unknown, params?: any, config?: RequestConfig): ApiIntent<IResponseFormat<ResponseData>> {
    const { signal, abort } = this.createAbortHandler();

    return [() => this.httpClient.put<ResponseData>(url, data, params, signal, config), abort];
  }

  protected createPostIntent<ResponseData>(url: string, data: unknown, params?: any, config?: RequestConfig): ApiIntent<IResponseFormat<ResponseData>> {
    const { signal, abort } = this.createAbortHandler();

    return [() => this.httpClient.post<ResponseData>(url, data, params, signal, config), abort];
  }

  protected createPatchIntent<ResponseData>(url: string, data: unknown, params?: any, config?: RequestConfig): ApiIntent<IResponseFormat<ResponseData>> {
    const { signal, abort } = this.createAbortHandler();

    return [() => this.httpClient.patch<ResponseData>(url, data, params, signal, config), abort];
  }

  protected createDeleteIntent<ResponseData>(url: string, params?: any, config?: RequestConfig): ApiIntent<IResponseFormat<ResponseData>> {
    const { signal, abort } = this.createAbortHandler();

    return [() => this.httpClient.delete<ResponseData>(url, params, signal, config), abort];
  }
}

export const HttpClientToken = Symbol('HttpClient');