import { API_URL } from '@/lib/constants';

export interface LoginResponse {
  message: string;
  token: string;
}

export interface VerifyOtpResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    username: string;
    phone: string;
  };
}

export interface ResendOtpResponse {
  message: string;
  token: string;
}

export interface LogoutResponse {
  message: string;
}

export class AuthService {
  private static setAccessTokenCookie(token: string) {
    // Set cookie with secure options
    document.cookie = `access_token=${token}; path=/; secure; samesite=strict; max-age=86400`; // 24 hours
  }

  static async login(username: string, phone: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username, phone }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'خطا در ورود به سامانه');
    }

    return response.json();
  }

  static async verifyOtp(phone: string, otp: string, token: string): Promise<VerifyOtpResponse> {
    const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ phone, otp, token }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'کد تایید نامعتبر است');
    }

    const data = await response.json();
    // Set the access token cookie after successful verification
    this.setAccessTokenCookie(data.access_token);
    return data;
  }

  static async resendOtp(phone: string, token: string): Promise<ResendOtpResponse> {
    const response = await fetch(`${API_URL}/api/auth/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ phone, token }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'خطا در ارسال مجدد کد تایید');
    }

    return response.json();
  }

  static async logout(accessToken: string): Promise<LogoutResponse> {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'خطا در خروج از سامانه');
    }

    return response.json();
  }
} 