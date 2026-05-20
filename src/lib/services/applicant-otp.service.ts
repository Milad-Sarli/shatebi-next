import { API_URL } from '@/lib/constants';

export interface SendOtpResponse {
    message: string;
    token: string;
}

export interface VerifyOtpResponse {
    message: string;
    verified_token: string;
}

export interface TenantResponse {
    id: number;
    name: string;
    title: string | null;
}

export class ApplicantOtpService {
    static async sendOtp(phone: string): Promise<SendOtpResponse> {
        const response = await fetch(`${API_URL}/api/applicants/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ phone }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'خطا در ارسال کد تایید');
        }

        return response.json();
    }

    static async verifyOtp(phone: string, otp: string, token: string): Promise<VerifyOtpResponse> {
        const response = await fetch(`${API_URL}/api/applicants/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ phone, otp, token }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'کد تایید نامعتبر است');
        }

        return response.json();
    }

    static async getPublicTenants(): Promise<TenantResponse[]> {
        const response = await fetch(`${API_URL}/api/tenants/public`, {
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
            throw new Error('خطا در دریافت مراکز');
        }

        return response.json();
    }
}
