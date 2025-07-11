'use client';
import { useAuth } from '@/lib/context/auth.context';
import { useEffect } from 'react';
import { API_URL } from '@/lib/constants';

const VAPID_PUBLIC_KEY = 'BP8iYOpo04l4GtJgvMnqozigtWJaBsqY6PvBzf_mYl6zjPCiStPlnRIjUyjJUd--qHSz5pRCtKjuMVusnFZVV1Y'; // TODO: Replace with your actual VAPID public key

export default function VapidPushTest() {
  const { accessToken } = useAuth();

  // Helper to convert VAPID key
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Register service worker and subscribe to push notifications
  useEffect(() => {
    if (!accessToken) return; // Wait for accessToken to be available

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(async (registration) => {
        console.log('Service Worker registered:', registration);
        
        // Subscribe to push notifications
        if ('PushManager' in window) {
          const existing = await registration.pushManager.getSubscription();
          if (!existing) { 
            try {
              const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
              });
              
              // Send subscription to backend
              await fetch(`${API_URL}/api/save-subscription`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json', 
                  'Authorization': `Bearer ${accessToken}` 
                }, 
                body: JSON.stringify(subscription),
              });
              
              console.log('Push subscription sent to backend:', subscription);
              
              // Send auth token and API URL to service worker for action handling
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
            } catch (err) {
              console.error('Failed to subscribe for push:', err);
            }
          } else {
            console.log('Already subscribed to push:', existing);
            
            // Still send auth token and API URL for existing subscriptions
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
          }
        }
      }).catch(error => {
        console.error('Service Worker registration failed:', error);
      });
    }
  }, [accessToken]);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('Notification permission:', permission);
        });
      }
    }
  }, []);

  return (
    <>
      {/* This component only handles VAPID push subscription. */}
    </>
  );
}