import { deviceFingerprinting } from '../utils/deviceFingerprint';

export interface OAuthProvider {
  id: 'google' | 'facebook' | 'apple';
  name: string;
  clientId: string;
  redirectUri: string;
  scope: string[];
  authUrl: string;
  tokenUrl: string;
}

export interface OAuthConfig {
  google: {
    clientId: string;
    redirectUri: string;
  };
  facebook: {
    clientId: string;
    redirectUri: string;
  };
  apple: {
    clientId: string;
    redirectUri: string;
    teamId: string;
    keyId: string;
  };
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  id_token?: string;
}

export interface OAuthUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email?: boolean;
  provider: string;
}

export interface SocialLoginRequest {
  provider: string;
  access_token: string;
  id_token?: string;
  device_fingerprint: string;
  user_info: OAuthUserInfo;
}

export interface SocialLoginResponse {
  access_token: string;
  refresh_token: string;
  customer: {
    id: string;
    email: string;
    name: string;
    profile_picture?: string;
    is_verified: boolean;
  };
  expires_in: number;
}

class OAuthService {
  private config: OAuthConfig;
  private providers: Map<string, OAuthProvider>;

  constructor() {
    // Initialize with environment variables or default values
    this.config = {
      google: {
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        redirectUri: `${window.location.origin}/auth/google/callback`,
      },
      facebook: {
        clientId: import.meta.env.VITE_FACEBOOK_CLIENT_ID || '',
        redirectUri: `${window.location.origin}/auth/facebook/callback`,
      },
      apple: {
        clientId: import.meta.env.VITE_APPLE_CLIENT_ID || '',
        redirectUri: `${window.location.origin}/auth/apple/callback`,
        teamId: import.meta.env.VITE_APPLE_TEAM_ID || '',
        keyId: import.meta.env.VITE_APPLE_KEY_ID || '',
      },
    };

    this.providers = new Map();
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Google OAuth provider
    this.providers.set('google', {
      id: 'google',
      name: 'Google',
      clientId: this.config.google.clientId,
      redirectUri: this.config.google.redirectUri,
      scope: ['openid', 'email', 'profile'],
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
    });

    // Facebook OAuth provider
    this.providers.set('facebook', {
      id: 'facebook',
      name: 'Facebook',
      clientId: this.config.facebook.clientId,
      redirectUri: this.config.facebook.redirectUri,
      scope: ['email', 'public_profile'],
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    });

    // Apple OAuth provider
    this.providers.set('apple', {
      id: 'apple',
      name: 'Apple',
      clientId: this.config.apple.clientId,
      redirectUri: this.config.apple.redirectUri,
      scope: ['name', 'email'],
      authUrl: 'https://appleid.apple.com/auth/authorize',
      tokenUrl: 'https://appleid.apple.com/auth/token',
    });
  }

  /**
   * Generate OAuth authorization URL for a provider
   */
  getAuthorizationUrl(providerId: string, state?: string): string {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Unsupported OAuth provider: ${providerId}`);
    }

    if (!provider.clientId) {
      throw new Error(`OAuth client ID not configured for ${providerId}`);
    }

    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: provider.redirectUri,
      scope: provider.scope.join(' '),
      response_type: 'code',
      state: state || this.generateState(),
    });

    // Add provider-specific parameters
    if (providerId === 'google') {
      params.append('access_type', 'offline');
      params.append('prompt', 'consent');
    } else if (providerId === 'apple') {
      params.append('response_mode', 'form_post');
    }

    return `${provider.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    providerId: string,
    code: string,
    state?: string
  ): Promise<OAuthTokenResponse> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Unsupported OAuth provider: ${providerId}`);
    }

    const tokenData = new URLSearchParams({
      client_id: provider.clientId,
      client_secret: this.getClientSecret(providerId),
      code,
      grant_type: 'authorization_code',
      redirect_uri: provider.redirectUri,
    });

    try {
      const response = await fetch(provider.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: tokenData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token exchange failed: ${errorData}`);
      }

      const tokenResponse: OAuthTokenResponse = await response.json();
      return tokenResponse;
    } catch (error) {
      console.error(`OAuth token exchange error for ${providerId}:`, error);
      throw new Error(`Failed to exchange code for token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user information from OAuth provider
   */
  async getUserInfo(providerId: string, accessToken: string): Promise<OAuthUserInfo> {
    try {
      let userInfo: OAuthUserInfo;

      switch (providerId) {
        case 'google':
          userInfo = await this.getGoogleUserInfo(accessToken);
          break;
        case 'facebook':
          userInfo = await this.getFacebookUserInfo(accessToken);
          break;
        case 'apple':
          userInfo = await this.getAppleUserInfo(accessToken);
          break;
        default:
          throw new Error(`Unsupported provider: ${providerId}`);
      }

      return {
        ...userInfo,
        provider: providerId,
      };
    } catch (error) {
      console.error(`Failed to get user info from ${providerId}:`, error);
      throw new Error(`Failed to retrieve user information: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform social login with backend
   */
  async socialLogin(
    providerId: string,
    accessToken: string,
    idToken?: string
  ): Promise<SocialLoginResponse> {
    try {
      // Get user info from OAuth provider
      const userInfo = await this.getUserInfo(providerId, accessToken);

      // Generate device fingerprint
      const fingerprintResult = await deviceFingerprinting.generateFingerprint();
      const deviceFingerprint = fingerprintResult.fingerprint;

      // Prepare social login request
      const socialLoginRequest: SocialLoginRequest = {
        provider: providerId,
        access_token: accessToken,
        id_token: idToken,
        device_fingerprint: deviceFingerprint,
        user_info: userInfo,
      };

      // Send request to backend
      const response = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(socialLoginRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Social login failed');
      }

      const loginResponse: SocialLoginResponse = await response.json();
      return loginResponse;
    } catch (error) {
      console.error(`Social login error for ${providerId}:`, error);
      throw new Error(`Social login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initiate OAuth flow by redirecting to provider
   */
  initiateOAuthFlow(providerId: string): void {
    try {
      const state = this.generateState();
      const authUrl = this.getAuthorizationUrl(providerId, state);
      
      // Store state for validation
      sessionStorage.setItem(`oauth_state_${providerId}`, state);
      
      // Redirect to OAuth provider
      window.location.href = authUrl;
    } catch (error) {
      console.error(`Failed to initiate OAuth flow for ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(
    providerId: string,
    code: string,
    state: string
  ): Promise<SocialLoginResponse> {
    try {
      // Validate state parameter
      const storedState = sessionStorage.getItem(`oauth_state_${providerId}`);
      if (!storedState || storedState !== state) {
        throw new Error('Invalid state parameter');
      }

      // Clean up stored state
      sessionStorage.removeItem(`oauth_state_${providerId}`);

      // Exchange code for token
      const tokenResponse = await this.exchangeCodeForToken(providerId, code, state);

      // Perform social login
      const loginResponse = await this.socialLogin(
        providerId,
        tokenResponse.access_token,
        tokenResponse.id_token
      );

      return loginResponse;
    } catch (error) {
      console.error(`OAuth callback error for ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Check if provider is configured
   */
  isProviderConfigured(providerId: string): boolean {
    const provider = this.providers.get(providerId);
    return !!(provider && provider.clientId);
  }

  /**
   * Get list of configured providers
   */
  getConfiguredProviders(): OAuthProvider[] {
    return Array.from(this.providers.values()).filter(provider => 
      this.isProviderConfigured(provider.id)
    );
  }

  // Private helper methods

  private getClientSecret(providerId: string): string {
    switch (providerId) {
      case 'google':
        return import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '';
      case 'facebook':
        return import.meta.env.VITE_FACEBOOK_CLIENT_SECRET || '';
      case 'apple':
        return import.meta.env.VITE_APPLE_CLIENT_SECRET || '';
      default:
        return '';
    }
  }

  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private async getGoogleUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get Google user info');
    }

    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture,
      verified_email: data.verified_email,
      provider: 'google',
    };
  }

  private async getFacebookUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
    );

    if (!response.ok) {
      throw new Error('Failed to get Facebook user info');
    }

    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture?.data?.url,
      verified_email: true, // Facebook emails are generally verified
      provider: 'facebook',
    };
  }

  private async getAppleUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    // Apple doesn't provide a userinfo endpoint, so we need to decode the ID token
    // This is a simplified implementation - in production, you'd properly verify the JWT
    const response = await fetch('https://appleid.apple.com/auth/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get Apple user info');
    }

    const data = await response.json();
    return {
      id: data.sub,
      email: data.email,
      name: data.name || 'Apple User',
      verified_email: data.email_verified === 'true',
      provider: 'apple',
    };
  }
}

// Export singleton instance
export const oauthService = new OAuthService();
export default oauthService;