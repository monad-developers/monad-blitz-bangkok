import { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
interface IAxiosWrapper {
  get: (...configs: [string, any]) => Promise<any>;
  post: (...configs: [string, any]) => Promise<any>;
  put: (...configs: [string, any]) => Promise<any>;
  delete: (...configs: [string, any]) => Promise<any>;
}

export interface EndpointCommonResponse {
  status: number;
  data?: any;
  message: any;
}

export default class AxiosWrapper implements IAxiosWrapper {
  private axiosInstance!: AxiosInstance;
  private readonly prefix: string;
  constructor(axiosInstance: any, prefix: string) {
    this.axiosInstance = axiosInstance;
    this.prefix = prefix;
  }

  async get(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    try {
      const response = await this.axiosInstance.get(this.prefix + url, config);
      return response;
    } catch (error: any) {
      return error.response;
    }
  }

  async post(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse> {
    try {
      const response = await this.axiosInstance.post(
        this.prefix + url,
        data,
        config
      );
      return response;
    } catch (error: any) {
      return error.response;
    }
  }

  async patch(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse> {
    try {
      const response = await this.axiosInstance.patch(
        this.prefix + url,
        data,
        config
      );
      return response;
    } catch (error: any) {
      return error.response;
    }
  }

  async put(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse> {
    try {
      const response = await this.axiosInstance.put(
        this.prefix + url,
        data,
        config
      );
      return response;
    } catch (error: any) {
      return error.response;
    }
  }

  async delete(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse> {
    try {
      const response = await this.axiosInstance.delete(
        this.prefix + url,
        config
      );
      return response;
    } catch (error: any) {
      return error.response;
    }
  }

  interceptor<T>(res: AxiosResponse): {
    isSuccess: boolean;
    data?: T;
    message?: string;
  } {
    const data = res.data;
    if (
      data &&
      data.isSuccess &&
      data.statusCode >= 200 &&
      data.statusCode < 300
    ) {
      return {
        isSuccess: true,
        data: data.data,
        message: data.message,
      };
    } else {
      return {
        isSuccess: false,
        message: data.message || this.messageTransalater(res.status) || '',
      };
    }
  }

  private messageTransalater(status: number): string {
    switch (status) {
      case 400:
        return '400';
      case 401:
        return '401';
      case 403:
        return '403';
      case 409:
        return '409';
      case 410:
        return '410';
      case 418:
        return '418';
      case 500:
        return '500';
      default:
        return 'failed';
    }
  }
}
