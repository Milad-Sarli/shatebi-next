import { API_URL } from '@/lib/constants';

export type OtpMethod = 'sms' | 'bale';

export interface LoginResponse {
  message: string;
  token: string;
  phone: string;
  bale_not_linked?: boolean;
}

export interface VerifyOtpResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    username: string;
    phone: string;
    app_roles: AppRole[];
  };
}

export interface ResendOtpResponse {
  message: string;
  token: string;
}

export interface LogoutResponse {
  message: string;
}

export interface AppRole {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginWithPasswordResponse {
  access_token: string;
  token_type: string;
  impersonated_by?: number;
  user: {
    id: number;
    username: string;
    fname: string;
    name: string | null;
    lname: string;
    avatar: string | null;
    phone: string;
    email: string | null;
    tenant_id: string;
    send_sms: boolean;
    is_superuser: boolean | null;
    is_admin: boolean | null;
    created_at: string;
    updated_at: string;
    app_roles?: AppRole[];
  };
}

export class AuthService {
  private static setAccessTokenCookie(token: string) {
    // Set cookie with secure options
    document.cookie = `access_token=${token}; path=/; secure; samesite=strict; max-age=86400`; // 24 hours
  }

  private static setAppRolesCookie(appRoles: AppRole[]) {
    // Store app_roles as a JSON string in a cookie (expires in 24 hours)
    document.cookie = `app_roles=${encodeURIComponent(JSON.stringify(appRoles))}; path=/; secure; samesite=strict; max-age=86400`;
  }

  static async login(username: string, method: OtpMethod = 'sms'): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username, method }),
      credentials: 'include',
    });

    const data = await response.json();

    if (data.bale_not_linked) {
      return data;
    }

    if (!response.ok) {
      throw new Error(data.message || 'خطا در ورود به سامانه');
    }

    return data;
  }

  static async verifyOtp(otp: string, token: string, phone: string): Promise<VerifyOtpResponse> {
    const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ otp, token, phone }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'کد تایید نامعتبر است');
    }

    const data = await response.json();
    // Set the access token cookie after successful verification
    this.setAccessTokenCookie(data.access_token);
    // // Set the app_roles cookie after successful verification
    // if (data.user && data.user.app_roles) {
    //   this.setAppRolesCookie(data.user.app_roles);
    // }
    return data;
  }

  static async resendOtp(token: string, method: OtpMethod = 'sms'): Promise<ResendOtpResponse> {
    const response = await fetch(`${API_URL}/api/auth/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ token, method }),
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

  static async loginAsUser(userId: number, accessToken: string): Promise<LoginWithPasswordResponse> {
    const response = await fetch(`${API_URL}/api/auth/login-as-user/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'خطا در ورود به عنوان کاربر');
    }

    return response.json();
  }

  static async loginWithUsernameAndPassword(username: string, password: string): Promise<LoginWithPasswordResponse> {
    const response = await fetch(`${API_URL}/api/auth/login-pass`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'خطا در ورود با نام کاربری و رمز عبور');
    }

    const data: LoginWithPasswordResponse = await response.json();
    console.log(data);
    if (data.access_token) {
      this.setAccessTokenCookie(data.access_token);
    }
    if (data.user && Array.isArray(data.user.app_roles)) {
      this.setAppRolesCookie(data.user.app_roles);
    }
    return data;
  }
} 