/**
 * API Client Configuration
 * Integrates the generated OpenAPI client with authentication and error handling
 */

import { Configuration } from '@/generated/api/configuration';
import { AuthenticationApi } from '@/generated/api/apis/authentication-api';
import { DefaultApi } from '@/generated/api/apis/default-api';
import type { 
  ApiV1AuthLoginPostRequest,
  ApiV1AuthLoginPost200Response,
  ApiV1AuthForgotPasswordPostRequest,
  ApiV1AuthResetPasswordPostRequest,
  UserDTO
} from '@/generated/api/models';

// Base configuration for the API client
const createApiConfiguration = (): Configuration => {
  return new Configuration({
    basePath: import.meta.env.VITE_API_BASE_URL || 'https://smartseller-api.preproduction.kirimku.com',
    baseOptions: {
      headers: {
        'Content-Type': 'application/json',
        'X-Storefront-Slug': 'rexus',
      },
    },
  });
};

// Create API instances
const configuration = createApiConfiguration();
export const authenticationApi = new AuthenticationApi(configuration);
export const defaultApi = new DefaultApi(configuration);

// Enhanced API client with authentication support
export class SmartSellerApiClient {
  private authApi: AuthenticationApi;
  private defaultApi: DefaultApi;
  private accessToken: string | null = null;

  constructor() {
    this.authApi = new AuthenticationApi(this.getConfiguration());
    this.defaultApi = new DefaultApi(this.getConfiguration());
  }

  private getConfiguration(): Configuration {
    return new Configuration({
      basePath: import.meta.env.VITE_API_BASE_URL || 'https://smartseller-api.preproduction.kirimku.com',
      baseOptions: {
        headers: {
          'Content-Type': 'application/json',
          'X-Storefront-Slug': 'rexus',
          ...(this.accessToken && { 'Authorization': `Bearer ${this.accessToken}` }),
        },
      },
    });
  }

  // Update the access token and refresh API instances
  public setAccessToken(token: string | null): void {
    this.accessToken = token;
    const config = this.getConfiguration();
    this.authApi = new AuthenticationApi(config);
    this.defaultApi = new DefaultApi(config);
  }

  // Authentication methods
  public async login(credentials: ApiV1AuthLoginPostRequest): Promise<ApiV1AuthLoginPost200Response> {
    try {
      const response = await this.authApi.apiV1AuthLoginPost(credentials);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  public async forgotPassword(request: ApiV1AuthForgotPasswordPostRequest): Promise<void> {
    try {
      await this.authApi.apiV1AuthForgotPasswordPost(request);
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  public async resetPassword(request: ApiV1AuthResetPasswordPostRequest): Promise<void> {
    try {
      await this.authApi.apiV1AuthResetPasswordPost(request);
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // Google OAuth methods
  public async getGoogleLoginUrl(): Promise<{ redirect_url: string; state: string }> {
    try {
      const response = await this.defaultApi.apiV1AuthGoogleLoginGet();
      return response.data.data!;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  public async handleGoogleCallback(code: string, state: string): Promise<ApiV1AuthLoginPost200Response> {
    try {
      const response = await this.defaultApi.apiV1AuthGoogleCallbackPost({ code, state });
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  public async refreshToken(): Promise<ApiV1AuthLoginPost200Response> {
    try {
      const response = await this.defaultApi.apiV1AuthRefreshPost();
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // Error handling
  private handleApiError(error: unknown): Error {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const message = data?.message || `API Error: ${status}`;
      return new Error(message);
    } else if (error.request) {
      // Network error
      return new Error('Network error: Unable to connect to the server');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

// Export a singleton instance
export const apiClient = new SmartSellerApiClient();

// Export types for convenience
export type {
  ApiV1AuthLoginPostRequest as LoginRequest,
  ApiV1AuthLoginPost200Response as LoginResponse,
  ApiV1AuthForgotPasswordPostRequest as ForgotPasswordRequest,
  ApiV1AuthResetPasswordPostRequest as ResetPasswordRequest,
  UserDTO,
};