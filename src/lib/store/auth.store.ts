import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AuthService } from '@/lib/services/auth.service'
import Cookies from 'js-cookie'
import { User, LoginResponse, ResendOtpResponse, VerifyOtpResponse } from '@/lib/types/auth.types'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  accessToken: string | null
}

interface AuthActions {
  login: (username: string) => Promise<LoginResponse>
  verifyOtp: (otp: string, token: string, phone: string, router: AppRouterInstance) => Promise<void>
  logout: (router: AppRouterInstance) => Promise<void>
  resendOtp: (token: string) => Promise<ResendOtpResponse>
  _setState: (newState: Partial<AuthState>) => void
  loginWithUsernameAndPassword: (username: string, password: string) => Promise<void>
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // Initial State
      isAuthenticated: false,
      user: null,
      accessToken: null,

      // Internal state setter
      _setState: (newState) => set(newState),

      // Actions
      login: async (username: string) => {
        try {
          // Login just gets the token for OTP, doesn't set authenticated state yet
          const response = await AuthService.login(username)
          return response
        } catch (error) {
          console.error('Login Error:', error)
          throw error
        }
      },

      verifyOtp: async (otp: string, token: string, phone: string, router: AppRouterInstance) => {
        try {
          const response = await AuthService.verifyOtp(otp, token, phone)
          const verifyResponse = response as VerifyOtpResponse;

          if (!verifyResponse.user || !verifyResponse.access_token) {
            throw new Error('Invalid response format from server during OTP verification')
          }

          // Set state in Zustand store
          set({
            isAuthenticated: true,
            user: verifyResponse.user,
            accessToken: verifyResponse.access_token,
          });

          // Set cookies (consider if still needed with localStorage persistence)
          // Keeping them might be useful for server-side access or initial hydration before Zustand mounts
          try {
            const cookieOptions = {
              expires: 1, // 1 day
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict' as const,
            };
            Cookies.set('access_token', verifyResponse.access_token, cookieOptions)

            const userDataToStore = {
              id: verifyResponse.user.id,
              username: verifyResponse.user.username,
              phone: verifyResponse.user.phone,
              tenant_id: verifyResponse.user.tenant_id ? Number(verifyResponse.user.tenant_id) : undefined,
            }
            Cookies.set('user', JSON.stringify(userDataToStore), cookieOptions)

            if (verifyResponse.user.app_roles) {
              Cookies.set('app_roles', encodeURIComponent(JSON.stringify(verifyResponse.user.app_roles)), cookieOptions)
            }
          } catch (cookieError) {
             console.error('Error setting cookies during OTP verify:', cookieError)
             // Decide if this should throw or just warn
          }

          // Navigate and refresh
          router.push('/dashboard')
          router.refresh()
        } catch (error) {
          console.error('Verify OTP Error in store:', error)
          // Clear potentially partially set state on error?
          set({ isAuthenticated: false, user: null, accessToken: null });
          // Maybe remove cookies as well?
          Cookies.remove('access_token');
          Cookies.remove('user');
          Cookies.remove('app_roles');
          throw error
        }
      },

      logout: async (router: AppRouterInstance) => {
        const currentToken = get().accessToken;
        try {
          if (currentToken) {
            await AuthService.logout(currentToken)
          }
        } catch (error) {
           console.error('Logout API call failed, proceeding with client-side logout:', error)
           // Don't throw here, allow client-side logout regardless
        }

        // Clear state and cookies/storage
        set({ isAuthenticated: false, user: null, accessToken: null })
        Cookies.remove('access_token')
        Cookies.remove('user')
        Cookies.remove('app_roles')
        // Zustand persist middleware handles localStorage removal by default

        router.push('/auth/login')
        router.refresh()
      },

      resendOtp: async (token: string) => {
        try {
          const response = await AuthService.resendOtp(token)
          return response
        } catch (error) {
          console.error('Resend OTP Error:', error)
          throw error
        }
      },

      loginWithUsernameAndPassword: async (username: string, password: string) => {
        try {
          const response = await AuthService.loginWithUsernameAndPassword(username, password);

          if (!response.user || !response.access_token) {
            throw new Error('Invalid response format from server during admin login');
          }

          set({
            isAuthenticated: true,
            user: {
              ...response.user,
              tenant_id: response.user.tenant_id ? Number(response.user.tenant_id) : undefined,
            },
            accessToken: response.access_token,
          });

          // Set cookies (same as verifyOtp)
          try {
            const cookieOptions = {
              expires: 1, // 1 day
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict' as const,
            };
            Cookies.set('access_token', response.access_token, cookieOptions);

            const userDataToStore = {
              id: response.user.id,
              username: response.user.username,
              phone: response.user.phone,
              tenant_id: response.user.tenant_id ? Number(response.user.tenant_id) : undefined,
            };
            Cookies.set('user', JSON.stringify(userDataToStore), cookieOptions);

            if (response.user.app_roles) {
              Cookies.set('app_roles', encodeURIComponent(JSON.stringify(response.user.app_roles)), cookieOptions);
            }
          } catch (cookieError) {
            console.error('Error setting cookies during admin login:', cookieError);
          }
        } catch (error) {
          console.error('Admin login error in store:', error);
          set({ isAuthenticated: false, user: null, accessToken: null });
          Cookies.remove('access_token');
          Cookies.remove('user');
          Cookies.remove('app_roles');
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage', // Unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // Use localStorage
      // onRehydrateStorage is called when storage is loaded
      onRehydrateStorage: () => {
        console.log('Hydration from localStorage starting...');
        // The callback receives (state, error)
        return (hydratedState, error) => {
          if (error) {
            console.error('An error occurred during hydration:', error);
          }
          if (hydratedState) {
            console.log('Hydration from localStorage completed', hydratedState.user?.id);
            // Optionally: Perform additional checks or data migration after hydration
          } else {
             console.log('No data found in localStorage for hydration');
          }
        };
      },
      // Partialize allows selecting which parts of the state to persist
      // partialize: (state) => ({ 
      //   isAuthenticated: state.isAuthenticated,
      //   user: state.user, 
      //   accessToken: state.accessToken 
      // }),
    }
  )
)

// Optional: Log state changes for debugging
if (process.env.NODE_ENV === 'development') {
  // Remove unused prevState parameter
  useAuthStore.subscribe((state) => {
    console.log('Auth Store Changed:', { 
      isAuthenticated: state.isAuthenticated,
      user: state.user?.id,
      accessTokenExists: !!state.accessToken
    });
  });
} 