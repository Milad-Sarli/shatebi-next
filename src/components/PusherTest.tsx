'use client';
import { useAuth } from '@/lib/context/auth.context';
import Script from 'next/script';
import { useEffect, useRef } from 'react';

const VAPID_PUBLIC_KEY = 'BP8iYOpo04l4GtJgvMnqozigtWJaBsqY6PvBzf_mYl6zjPCiStPlnRIjUyjJUd--qHSz5pRCtKjuMVusnFZVV1Y'; // TODO: Replace with your actual VAPID public key

export default function PusherTest() {
  const pusherRef = useRef<unknown>(null);
  const { accessToken } = useAuth();
 
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
              await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/save-subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` }, 
                body: JSON.stringify(subscription),
              });
              console.log('Push subscription sent to backend:', subscription);
            } catch (err) {
              console.error('Failed to subscribe for push:', err);
            }
          } else {
            console.log('Already subscribed to push:', existing);
          }
        }
      });
    }
  }, [accessToken]);

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

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  const handlePusherLoad = () => {
    if (typeof window !== 'undefined' && (window as unknown as { Pusher?: unknown }).Pusher) {
      console.log('Pusher JS loaded!');
      const win = window as unknown as { Pusher: unknown };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (win.Pusher as any).logToConsole = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pusher = new (win.Pusher as any)('7b0e62c1bb686419742c', {
        cluster: 'eu',
      });
      pusherRef.current = pusher;
      console.log('Pusher instance created:', pusher);

      const channel = pusher.subscribe('public');
      console.log('Subscribed to channel public:', channel);

      channel.bind('shatebi', function (data: object) {
        console.log('Received Pusher event data:', data);
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('New Message', {
              body: JSON.stringify(data),
              icon: '/fav-icon.png', // Optional: path to your app icon
            });
          } else {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                new Notification('New Message', {
                  body: JSON.stringify(data),
                  icon: '/fav-icon.png', // Optional: path to your app icon
                });
              } else {
                console.log('Notification permission not granted:', permission);
              }
            });
          }
        }
      });
    } else {
      console.log('Pusher JS NOT loaded!');
    }
  };

  return (
    <>
      <Script
        src="https://js.pusher.com/8.4.0/pusher.min.js"
        strategy="afterInteractive"
        onLoad={handlePusherLoad}
      />
      <h1>Pusher Test</h1>
      <p>
        Try publishing an event to channel <code>my-channel</code> with event name <code>my-event</code>.
      </p>
      <button
        onClick={async () => {
          try {
            const res = await fetch('https://api.shatebiapp.ir/api/pusher-test', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: 'Hello from frontend!' }),
            });
            if (res.ok) {
              alert('Real Pusher event sent via backend!');
            } else {
              alert('Failed to send event.');
            }
          } catch (error) {
            alert('Error sending event: ' + error);
          }
        }}
        style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '1rem' }}
      >
        Test Event
      </button>
    </>
  );
} 