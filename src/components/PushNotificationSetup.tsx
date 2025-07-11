'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/auth.context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Bell, BellOff, Loader2 } from 'lucide-react';
import { API_URL } from '@/lib/constants';

// VAPID Public Key - Replace with your actual key from Laravel backend
const VAPID_PUBLIC_KEY = 'BP8iYOpo04l4GtJgvMnqozigtWJaBsqY6PvBzf_mYl6zjPCiStPlnRIjUyjJUd--qHSz5pRCtKjuMVusnFZVV1Y';

interface PushNotificationSetupProps {
  className?: string;
}

export default function PushNotificationSetup({ className }: PushNotificationSetupProps) {
  const { accessToken } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if push notifications are supported
    const supported = (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const existingSubscription = await registration.pushManager.getSubscription();
        setSubscription(existingSubscription);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  // Helper to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const saveSubscriptionToBackend = async (subscription: PushSubscription) => {
    try {
      const response = await fetch(`${API_URL}/api/save-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(subscription)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save subscription');
      }

      return true;
    } catch (error) {
      console.error('Save subscription failed:', error);
      throw error;
    }
  };

  const subscribeToPush = async () => {
    if (!accessToken) {
      setError('لطفاً ابتدا وارد شوید');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      // Request permission
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission !== 'granted') {
        throw new Error('دسترسی اعلان‌ها رد شد');
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Save subscription to backend
      await saveSubscriptionToBackend(subscription);

      // Send auth token and API URL to service worker
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SET_AUTH_TOKEN',
          token: accessToken
        });
        navigator.serviceWorker.controller.postMessage({
          type: 'SET_API_URL',
          url: API_URL
        });
      }

      setSubscription(subscription);
      console.log('Push subscription successful');
    } catch (error) {
      console.error('Push subscription failed:', error);
      setError(error instanceof Error ? error.message : 'خطا در فعال‌سازی اعلان‌ها');
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      if (subscription) {
        await subscription.unsubscribe();
        setSubscription(null);
      }
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      setError('خطا در غیرفعال‌سازی اعلان‌ها');
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = async () => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/test-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        // Show success message
        setError(null);
      } else {
        throw new Error('خطا در ارسال اعلان آزمایشی');
      }
    } catch (error) {
      console.error('Test notification failed:', error);
      setError('خطا در ارسال اعلان آزمایشی');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            اعلان‌های فوری
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              مرورگر شما از اعلان‌های فوری پشتیبانی نمی‌کند
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          اعلان‌های فوری
        </CardTitle>
        <CardDescription>
          برای دریافت اعلان‌های مهم سیستم، اعلان‌ها را فعال کنید
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!subscription ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              وضعیت دسترسی: {
                permission === 'granted' ? 'تایید شده' :
                permission === 'denied' ? 'رد شده' : 'در انتظار تایید'
              }
            </div>
            <Button 
              onClick={subscribeToPush} 
              disabled={isLoading || !accessToken}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  در حال فعال‌سازی...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  فعال‌سازی اعلان‌ها
                </>
              )}
            </Button>
            {!accessToken && (
              <p className="text-sm text-muted-foreground text-center">
                برای فعال‌سازی اعلان‌ها ابتدا وارد شوید
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">اعلان‌ها فعال است</span>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={testNotification}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'تست اعلان'
                )}
              </Button>
              
              <Button 
                variant="destructive"
                onClick={unsubscribe}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <BellOff className="mr-2 h-4 w-4" />
                    غیرفعال‌سازی
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 