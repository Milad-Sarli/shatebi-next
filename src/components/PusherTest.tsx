'use client';
import Script from 'next/script';
import { useEffect, useRef } from 'react';

export default function PusherTest() {
  const pusherRef = useRef<unknown>(null);

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