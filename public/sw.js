// Enhanced Service Worker for Push Notifications with Action Buttons
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    
    const notificationOptions = {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      image: data.image,
      badge: '/icons/badge.png',
      tag: data.type || 'general',
      requireInteraction: true,
      data: data.data || {},
      actions: []
    };

    // Add action buttons if available
    if (data.data && data.data.actions) {
      data.data.actions.forEach(action => {
        notificationOptions.actions.push({
          action: action.action,
          title: action.title,
          icon: action.icon
        });
      });
    }

    // Fallback actions if none provided but we have editor info
    if (notificationOptions.actions.length === 0 && data.data && data.data.editor_phone) {
      notificationOptions.actions = [
        {
          action: 'call',
          title: 'تماس',
          icon: '/icons/call.svg'
        },
        {
          action: 'message',
          title: 'پیام',
          icon: '/icons/message.svg'
        }
      ];
    }

    event.waitUntil(
      self.registration.showNotification(data.title, notificationOptions)
    );
  }
});

// Handle notification clicks and action buttons
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'call') {
    // Handle call action
    event.waitUntil(
      handleNotificationAction('call', data)
        .then(result => {
          if (result && result.phone) {
            clients.openWindow(`tel:${result.phone}`);
          }
        })
        .catch(error => {
          console.error('Call action failed:', error);
          // Fallback: try to use stored phone number
          if (data.editor_phone) {
            clients.openWindow(`tel:${data.editor_phone}`);
          }
        })
    );
  } else if (action === 'message') {
    // Handle message action
    event.waitUntil(
      handleNotificationAction('message', data)
        .then(result => {
          if (result && result.phone && result.suggested_message) {
            const smsUrl = `sms:${result.phone}?body=${encodeURIComponent(result.suggested_message)}`;
            clients.openWindow(smsUrl);
          } else if (data.editor_phone) {
            // Fallback: open SMS without pre-filled message
            clients.openWindow(`sms:${data.editor_phone}`);
          }
        })
        .catch(error => {
          console.error('Message action failed:', error);
          // Fallback: try to use stored phone number
          if (data.editor_phone) {
            clients.openWindow(`sms:${data.editor_phone}`);
          }
        })
    );
  } else {
    // Default click - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function to handle notification actions
async function handleNotificationAction(action, data) {
  try {
    const token = await getStoredAuthToken();
    const apiUrl = await getApiUrl();
    
    const response = await fetch(`${apiUrl}/api/notification-actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Notification action request failed:', error);
    return null;
  }
}

// Helper function to get auth token from storage
async function getStoredAuthToken() {
  try {
    // Try to get token from cookies first (as used in your auth system)
    const cookies = await self.cookieStore?.getAll?.() || [];
    const tokenCookie = cookies.find(cookie => cookie.name === 'access_token');
    
    if (tokenCookie) {
      return tokenCookie.value;
    }
    
    // Fallback: try to get from IndexedDB or other storage
    // This is a fallback for browsers that don't support cookieStore API
    return '';
  } catch (error) {
    console.error('Error getting auth token:', error);
    return '';
  }
}

// Helper function to get API URL
async function getApiUrl() {
  // This should match your NEXT_PUBLIC_API_URL
  return 'https://test.bikerasol.ir'; // Default fallback, should be configured
}

// Listen for messages from the main thread (for token updates, etc.)
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SET_AUTH_TOKEN') {
    // Store token for use in service worker
    self.authToken = event.data.token;
  }
  
  if (event.data && event.data.type === 'SET_API_URL') {
    // Store API URL for use in service worker
    self.apiUrl = event.data.url;
  }
});

