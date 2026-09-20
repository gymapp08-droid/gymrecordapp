import { IApiResponse } from '@alpha/types';
import { SecureStorage } from './secureStorage';

const BASE_URL = 'http://localhost:4000/api/v1';

export class ApiClient {
  private static async getAuthHeader(): Promise<Record<string, string>> {
    const token = await SecureStorage.getItem('alpha_access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  static async post<T>(endpoint: string, body: unknown): Promise<IApiResponse<T>> {
    const authHeaders = await this.getAuthHeader();
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      return data;
    } catch (err) {
      return {
        success: false,
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Unable to reach ALPHA services. Check network connection.',
        },
      };
    }
  }

  static async get<T>(endpoint: string): Promise<IApiResponse<T>> {
    const authHeaders = await this.getAuthHeader();
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          ...authHeaders,
        },
      });

      const data = await res.json();
      return data;
    } catch (err) {
      return {
        success: false,
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Unable to reach ALPHA services. Check network connection.',
        },
      };
    }
  }

  static async delete<T>(endpoint: string): Promise<IApiResponse<T>> {
    const authHeaders = await this.getAuthHeader();
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          ...authHeaders,
        },
      });

      const data = await res.json();
      return data;
    } catch (err) {
      return {
        success: false,
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Unable to reach ALPHA services. Check network connection.',
        },
      };
    }
  }

  static async patch<T>(endpoint: string, body?: unknown): Promise<IApiResponse<T>> {
    const authHeaders = await this.getAuthHeader();
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await res.json();
      return data;
    } catch (err) {
      return {
        success: false,
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Unable to reach ALPHA services. Check network connection.',
        },
      };
    }
  }
}
