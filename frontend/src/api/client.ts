import axios, {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  AxiosRequestConfig,
} from "axios";
import { toast } from "sonner";
import { getItem } from "../utils/persistentStorage.ts";
import { StorageKey } from "../hooks/storage-data/index.ts";
import { extractErrorMessage } from "./errorUtils.ts";
import { API_URL } from "./constants.ts";

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        const token = getItem(StorageKey.ACCESS_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (!(config.data instanceof FormData)) {
          config.headers["Content-Type"] = "application/json";
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const status = error.response?.status;
        const isLoginPage =
          typeof window !== "undefined" &&
          window.location.pathname.includes("/login");

        if (status === 401 && typeof window !== "undefined" && !isLoginPage) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: AxiosError): never {
    const message = extractErrorMessage(error);
    const status = error.response?.status;
    const isLoginPage =
      typeof window !== "undefined" &&
      window.location.pathname.includes("/login");

    if (status !== 401 || isLoginPage) {
      toast.error(message);
    }

    throw new Error(message);
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.get(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.post(
        url,
        data,
        config
      );
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.put(
        url,
        data,
        config
      );
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.patch(
        url,
        data,
        config
      );
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.delete(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }
}

export const api = new ApiClient(API_URL);
