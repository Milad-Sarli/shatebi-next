# Push Notifications Setup Guide

## Environment Variables

Add these variables to your `.env.local` file:

```bash
# Laravel API Base URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# For production, use your actual domain:
# NEXT_PUBLIC_API_URL=https://your-production-domain.com

# VAPID Public Key (get this from your Laravel .env file)
# Replace with the actual VAPID_PUBLIC_KEY from your Laravel backend
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BP8iYOpo04l4GtJgvMnqozigtWJaBsqY6PvBzf_mYl6zjPCiStPlnRIjUyjJUd--qHSz5pRCtKjuMVusnFZVV1Y
```

## Implementation Status

✅ **Completed Components:**
- Enhanced Service Worker (`public/sw.js`) with action button support
- NotificationService (`src/lib/services/notification.service.ts`) - API utilities
- PushNotificationSetup (`src/components/PushNotificationSetup.tsx`) - Setup UI
- NotificationDisplay (`src/components/NotificationDisplay.tsx`) - In-app notifications
- Updated PusherTest (`src/components/PusherTest.tsx`) - Auto-subscription

## Integration Steps

### 1. Add PushNotificationSetup to your app

Add the notification setup component to your settings or dashboard page:

```tsx
import PushNotificationSetup from '@/components/PushNotificationSetup';

export default function SettingsPage() {
  return (
    <div>
      {/* Your other settings */}
      <PushNotificationSetup />
    </div>
  );
}
```

### 2. Add NotificationDisplay for in-app notifications

Add to your main layout to show in-app notifications:

```tsx
import { useState, useEffect } from 'react';
import NotificationDisplay from '@/components/NotificationDisplay';

export default function Layout({ children }) {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Listen for push notifications when app is open
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
          setNotification(event.data.notification);
        }
      });
    }
  }, []);

  return (
    <>
      {children}
      <NotificationDisplay 
        notification={notification} 
        onClose={() => setNotification(null)} 
      />
    </>
  );
}
```

### 3. Update VAPID Key

1. Get the VAPID_PUBLIC_KEY from your Laravel `.env` file
2. Update the key in:
   - `src/components/PushNotificationSetup.tsx` (line 12)
   - `src/components/PusherTest.tsx` (line 6)
   - Your `.env.local` file

### 4. Test the Implementation

1. **Enable notifications**: Use the PushNotificationSetup component
2. **Test notifications**: Use the test button in the setup component
3. **Test actions**: Trigger a grade edit notification from Laravel backend

## Available Notification Data

When a grade edit notification is received, it includes:

```javascript
{
  title: "ویرایش نمره",
  body: "نمره برای درس ... ویرایش شد",
  icon: "/icons/grade-edit.svg",
  image: "/images/grade-edit-notification.png",
  data: {
    editor_phone: "09123456789",
    editor_name: "نام ویرایش کننده",
    student_name: "نام دانش آموز",
    course_name: "نام درس",
    type: "grade_edit",
    actions: [
      {
        action: "call",
        title: "تماس",
        icon: "/icons/call.svg"
      },
      {
        action: "message",
        title: "پیام",
        icon: "/icons/message.svg"
      }
    ]
  }
}
```

## Features

### ✅ Enhanced Service Worker
- Handles push notifications with action buttons
- Fallback actions if none provided
- Proper error handling and authentication
- Support for call and message actions

### ✅ PushNotificationSetup Component
- Persian UI with proper RTL support
- Auto-detects browser support
- Shows permission status
- Enable/disable notifications
- Test notification functionality
- Integrates with existing auth system

### ✅ NotificationDisplay Component
- Shows in-app notifications with action buttons
- Handles call and message actions
- Fallback to direct phone/SMS links
- Error handling and loading states
- Persian UI with proper styling

### ✅ Enhanced PusherTest Component
- Auto-subscribes authenticated users
- Sends auth token to service worker
- Better error handling
- Maintains existing functionality

## API Endpoints

Your Laravel backend should provide:

- `POST /api/save-subscription` - Save push subscription
- `POST /api/notification-actions` - Handle notification actions
- `POST /api/test-push` - Test push notification

## Troubleshooting

### Common Issues:

1. **Service Worker not registering**: Check browser console for errors
2. **Notifications not showing**: Verify permissions are granted
3. **Action buttons not working**: Ensure proper authentication headers
4. **VAPID key errors**: Verify the key is correct and properly formatted

### Debug Tips:

- Use browser DevTools → Application → Service Workers
- Check Network tab for API calls
- Test with browser's Push Messaging tab in DevTools
- Use console.log in service worker for debugging

## Next Steps

1. Get the actual VAPID_PUBLIC_KEY from your Laravel backend team
2. Update the API_URL to match your Laravel backend
3. Test with actual grade edit notifications
4. Add the components to your application layout
5. Style the components to match your design system

## Memory Note

The user prefers that the assistant never runs the application automatically because it is already running. 