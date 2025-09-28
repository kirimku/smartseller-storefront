/**
 * Device Fingerprinting Utility
 * 
 * Generates a unique fingerprint for the current device/browser
 * to enhance security and detect suspicious login attempts.
 */

interface DeviceInfo {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  colorDepth: number;
  hardwareConcurrency: number;
  deviceMemory?: number;
  cookieEnabled: boolean;
  doNotTrack: string | null;
  webdriver: boolean;
}

interface FingerprintResult {
  fingerprint: string;
  deviceInfo: DeviceInfo;
  timestamp: number;
  confidence: 'high' | 'medium' | 'low';
}

class DeviceFingerprinting {
  private static instance: DeviceFingerprinting;

  private constructor() {}

  public static getInstance(): DeviceFingerprinting {
    if (!DeviceFingerprinting.instance) {
      DeviceFingerprinting.instance = new DeviceFingerprinting();
    }
    return DeviceFingerprinting.instance;
  }

  /**
   * Generate device fingerprint
   */
  public async generateFingerprint(): Promise<FingerprintResult> {
    try {
      const deviceInfo = await this.collectDeviceInfo();
      const fingerprint = await this.createFingerprint(deviceInfo);
      const confidence = this.calculateConfidence(deviceInfo);

      return {
        fingerprint,
        deviceInfo,
        timestamp: Date.now(),
        confidence
      };
    } catch (error) {
      console.error('❌ Failed to generate device fingerprint:', error);
      throw new Error('Device fingerprinting failed');
    }
  }

  /**
   * Collect device information
   */
  private async collectDeviceInfo(): Promise<DeviceInfo> {
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      webdriver?: boolean;
    };

    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      colorDepth: screen.colorDepth,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: nav.deviceMemory,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      webdriver: nav.webdriver || false
    };
  }

  /**
   * Create fingerprint hash from device info
   */
  private async createFingerprint(deviceInfo: DeviceInfo): Promise<string> {
    // Create a string from device characteristics
    const fingerprintString = [
      deviceInfo.userAgent,
      deviceInfo.language,
      deviceInfo.platform,
      deviceInfo.screenResolution,
      deviceInfo.timezone,
      deviceInfo.colorDepth.toString(),
      deviceInfo.hardwareConcurrency.toString(),
      deviceInfo.deviceMemory?.toString() || 'unknown',
      deviceInfo.cookieEnabled.toString(),
      deviceInfo.doNotTrack || 'null'
    ].join('|');

    // Use Web Crypto API for hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprintString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  }

  /**
   * Calculate confidence level based on available information
   */
  private calculateConfidence(deviceInfo: DeviceInfo): 'high' | 'medium' | 'low' {
    let score = 0;

    // Check for unique identifiers
    if (deviceInfo.userAgent && deviceInfo.userAgent.length > 50) score += 2;
    if (deviceInfo.screenResolution && deviceInfo.screenResolution !== '0x0') score += 2;
    if (deviceInfo.timezone) score += 1;
    if (deviceInfo.hardwareConcurrency > 0) score += 1;
    if (deviceInfo.deviceMemory) score += 1;
    if (deviceInfo.colorDepth > 0) score += 1;

    // Penalize for suspicious indicators
    if (deviceInfo.webdriver) score -= 2;
    if (!deviceInfo.cookieEnabled) score -= 1;

    if (score >= 6) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  /**
   * Compare two fingerprints for similarity
   */
  public compareFingerprintSimilarity(fp1: string, fp2: string): number {
    if (fp1 === fp2) return 1.0;

    // Simple similarity check - in production, you might want more sophisticated comparison
    let matches = 0;
    const length = Math.min(fp1.length, fp2.length);

    for (let i = 0; i < length; i++) {
      if (fp1[i] === fp2[i]) matches++;
    }

    return matches / Math.max(fp1.length, fp2.length);
  }

  /**
   * Validate if fingerprint matches stored fingerprint
   */
  public validateFingerprint(currentFingerprint: string, storedFingerprint: string): {
    isValid: boolean;
    similarity: number;
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const similarity = this.compareFingerprintSimilarity(currentFingerprint, storedFingerprint);
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let isValid = true;

    if (similarity < 0.7) {
      riskLevel = 'high';
      isValid = false;
    } else if (similarity < 0.9) {
      riskLevel = 'medium';
      isValid = true; // Allow but flag for monitoring
    }

    return {
      isValid,
      similarity,
      riskLevel
    };
  }

  /**
   * Get stored fingerprint from localStorage
   */
  public getStoredFingerprint(): string | null {
    return localStorage.getItem('device_fingerprint');
  }

  /**
   * Store fingerprint in localStorage
   */
  public storeFingerprint(fingerprint: string): void {
    localStorage.setItem('device_fingerprint', fingerprint);
    localStorage.setItem('device_fingerprint_timestamp', Date.now().toString());
  }

  /**
   * Check if stored fingerprint is expired
   */
  public isStoredFingerprintExpired(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): boolean {
    const timestamp = localStorage.getItem('device_fingerprint_timestamp');
    if (!timestamp) return true;

    const age = Date.now() - parseInt(timestamp);
    return age > maxAgeMs;
  }

  /**
   * Generate and validate device fingerprint for authentication
   */
  public async validateDeviceForAuth(): Promise<{
    fingerprint: string;
    isNewDevice: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    deviceInfo: DeviceInfo;
  }> {
    const result = await this.generateFingerprint();
    const storedFingerprint = this.getStoredFingerprint();

    if (!storedFingerprint || this.isStoredFingerprintExpired()) {
      // New device or expired fingerprint
      this.storeFingerprint(result.fingerprint);
      return {
        fingerprint: result.fingerprint,
        isNewDevice: true,
        riskLevel: 'medium', // New devices are medium risk
        deviceInfo: result.deviceInfo
      };
    }

    const validation = this.validateFingerprint(result.fingerprint, storedFingerprint);

    if (validation.isValid) {
      // Update stored fingerprint if it's similar enough
      this.storeFingerprint(result.fingerprint);
    }

    return {
      fingerprint: result.fingerprint,
      isNewDevice: false,
      riskLevel: validation.riskLevel,
      deviceInfo: result.deviceInfo
    };
  }

  /**
   * Clear stored fingerprint data
   */
  public clearStoredFingerprint(): void {
    localStorage.removeItem('device_fingerprint');
    localStorage.removeItem('device_fingerprint_timestamp');
  }

  /**
   * Get device risk assessment
   */
  public assessDeviceRisk(deviceInfo: DeviceInfo): {
    riskScore: number;
    riskFactors: string[];
    recommendation: 'allow' | 'challenge' | 'block';
  } {
    const riskFactors: string[] = [];
    let riskScore = 0;

    // Check for automation indicators
    if (deviceInfo.webdriver) {
      riskFactors.push('Automated browser detected');
      riskScore += 50;
    }

    // Check for unusual configurations
    if (!deviceInfo.cookieEnabled) {
      riskFactors.push('Cookies disabled');
      riskScore += 20;
    }

    if (deviceInfo.doNotTrack === '1') {
      riskFactors.push('Do Not Track enabled');
      riskScore += 5;
    }

    // Check for suspicious user agent
    if (deviceInfo.userAgent.includes('bot') || deviceInfo.userAgent.includes('crawler')) {
      riskFactors.push('Bot-like user agent');
      riskScore += 40;
    }

    // Check for unusual hardware
    if (deviceInfo.hardwareConcurrency === 0) {
      riskFactors.push('No hardware concurrency info');
      riskScore += 10;
    }

    if (deviceInfo.colorDepth < 16) {
      riskFactors.push('Unusual color depth');
      riskScore += 15;
    }

    // Determine recommendation
    let recommendation: 'allow' | 'challenge' | 'block' = 'allow';
    if (riskScore >= 50) {
      recommendation = 'block';
    } else if (riskScore >= 20) {
      recommendation = 'challenge';
    }

    return {
      riskScore,
      riskFactors,
      recommendation
    };
  }
}

// Export singleton instance
export const deviceFingerprinting = DeviceFingerprinting.getInstance();
export type { DeviceInfo, FingerprintResult };