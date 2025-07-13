import { API_URL } from '@/lib/constants';

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationData {
  editor_phone?: string;
  editor_name?: string;
  student_name?: string;
  course_name?: string;
  type?: string;
  actions?: NotificationAction[];
  call_url?: string;
  message_url?: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: NotificationData;
}

export interface NotificationActionResponse {
  phone?: string;
  suggested_message?: string;
  success: boolean;
  message?: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class NotificationService {
  private static getAuthToken(): string {
    // Get token from cookie (matching your auth system)
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => 
        cookie.trim().startsWith('access_token=')
      );
      if (tokenCookie) {
        return tokenCookie.split('=')[1];
      }
    }
    return '';
  }

  /**
   * Save push subscription to backend
   */
  static async saveSubscription(subscription: PushSubscription): Promise<boolean> {
    try {
      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');
      
      if (!p256dhKey || !authKey) {
        throw new Error('Failed to get subscription keys');
      }

      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dhKey))),
          auth: btoa(String.fromCharCode(...new Uint8Array(authKey)))
        }
      };

      const response = await fetch(`${API_URL}/api/save-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(subscriptionData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save subscription');
      }

      return true;
    } catch (error) {
      console.error('Save subscription failed:', error);
      return false;
    }
  }

  /**
   * Handle notification action (call or message)
   */
  static async handleNotificationAction(
    action: string, 
    data: NotificationData
  ): Promise<NotificationActionResponse | null> {
    try {
      const response = await fetch(`${API_URL}/api/notification-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          action: action,
          editor_phone: data.editor_phone,
          editor_name: data.editor_name,
          student_name: data.student_name,
          course_name: data.course_name,
          type: data.type
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Notification action failed:', error);
      return null;
    }
  }

  /**
   * Request notification permission
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  /**
   * Check if push notifications are supported
   */
  static isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Register service worker and subscribe to push notifications
   */
  static async subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      // Request permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        return existingSubscription;
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey) as unknown as ArrayBuffer
      });

      // Save subscription to backend
      const saved = await this.saveSubscription(subscription);
      if (!saved) {
        throw new Error('Failed to save subscription to backend');
      }

      // Send auth token and API URL to service worker
      this.sendMessageToServiceWorker('SET_AUTH_TOKEN', this.getAuthToken());
      this.sendMessageToServiceWorker('SET_API_URL', API_URL);

      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  static async unsubscribe(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      return false;
    }
  }

  /**
   * Get current push subscription
   */
  static async getCurrentSubscription(): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        return await registration.pushManager.getSubscription();
      }
      return null;
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }

  /**
   * Send message to service worker
   */
  private static sendMessageToServiceWorker(type: string, data: string): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: type,
        [type === 'SET_AUTH_TOKEN' ? 'token' : 'url']: data
      });
    }
  }

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  /**
   * Test push notification (for development)
   */
  static async testPushNotification(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/test-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Test push notification failed:', error);
      return false;
    }
  }
} 

export async function fetchNotifications(token: string, search?: string) {
  let url = `${process.env.NEXT_PUBLIC_API_URL}/api/notifications`;
  if (search) {
    url += `?search=${encodeURIComponent(search)}`;
  }
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  const response = await res.json();
  return response.data; // Only return the notifications array
} 

export async function deleteNotification(token: string, id: string | number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete notification');
  return true;
}

export async function markNotificationAsRead(token: string, id: string | number) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${id}/mark-as-read`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to mark notification as read');
  return true;
} 