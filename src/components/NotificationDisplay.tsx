'use client';

import { useState } from 'react';
import { X, Phone, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { API_URL } from '@/lib/constants';
import { useAuth } from '@/lib/context/auth.context';

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface NotificationData {
  editor_phone?: string;
  editor_name?: string;
  student_name?: string;
  course_name?: string;
  type?: string;
  actions?: NotificationAction[];
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: NotificationData;
}

interface NotificationDisplayProps {
  notification: NotificationPayload | null;
  onClose: () => void;
  className?: string;
}

interface NotificationActionResponse {
  phone?: string;
  suggested_message?: string;
  success: boolean;
  message?: string;
}

export default function NotificationDisplay({ 
  notification, 
  onClose, 
  className = '' 
}: NotificationDisplayProps) {
  const { accessToken } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!notification) return null;

  const handleNotificationAction = async (
    action: string, 
    data: NotificationData
  ): Promise<NotificationActionResponse | null> => {
    try {
      const response = await fetch(`${API_URL}/api/notification-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
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
  };

  const handleAction = async (action: string) => {
    if (!notification.data) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await handleNotificationAction(action, notification.data);
      
      if (result) {
        if (action === 'call' && result.phone) {
          window.open(`tel:${result.phone}`, '_self');
        } else if (action === 'message' && result.phone) {
          const message = result.suggested_message || '';
          const smsUrl = `sms:${result.phone}${message ? `?body=${encodeURIComponent(message)}` : ''}`;
          window.open(smsUrl, '_self');
        }
      } else {
        // Fallback: use stored phone number
        if (notification.data.editor_phone) {
          if (action === 'call') {
            window.open(`tel:${notification.data.editor_phone}`, '_self');
          } else if (action === 'message') {
            window.open(`sms:${notification.data.editor_phone}`, '_self');
          }
        }
      }
    } catch (error) {
      console.error('Action failed:', error);
      setError('خطا در انجام عملیات');
    } finally {
      setIsProcessing(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'message':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getActionVariant = (action: string) => {
    switch (action) {
      case 'call':
        return 'default' as const;
      case 'message':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <Card className={`fixed top-4 right-4 max-w-sm shadow-lg border z-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 space-x-reverse">
            {notification.icon && (
              <img 
                src={notification.icon} 
                alt="notification" 
                className="w-8 h-8 flex-shrink-0 rounded" 
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm">
                {notification.title}
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                {notification.body}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {notification.image && (
          <img 
            src={notification.image} 
            alt="notification" 
            className="mt-3 rounded max-w-full h-auto"
          />
        )}

        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
        
        {notification.data && (
          <div className="mt-4">
            {/* Show editor info if available */}
            {notification.data.editor_name && (
              <div className="text-xs text-gray-500 mb-2">
                ویرایش شده توسط: {notification.data.editor_name}
                {notification.data.editor_phone && (
                  <span className="block">شماره تماس: {notification.data.editor_phone}</span>
                )}
              </div>
            )}

            {/* Action buttons */}
            {notification.data.actions && notification.data.actions.length > 0 ? (
              <div className="flex space-x-2 space-x-reverse">
                {notification.data.actions.map((action, index) => (
                  <Button 
                    key={index}
                    variant={getActionVariant(action.action)}
                    size="sm"
                    onClick={() => handleAction(action.action)}
                    disabled={isProcessing}
                    className="flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {action.icon ? (
                          <img src={action.icon} alt="" className="w-4 h-4" />
                        ) : (
                          getActionIcon(action.action)
                        )}
                        {action.title}
                      </>
                    )}
                  </Button>
                ))}
              </div>
            ) : (
              // Fallback actions if none provided but we have editor phone
              notification.data.editor_phone && (
                <div className="flex space-x-2 space-x-reverse">
                  <Button 
                    variant="default"
                    size="sm"
                    onClick={() => handleAction('call')}
                    disabled={isProcessing}
                    className="flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Phone className="h-4 w-4" />
                        تماس
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAction('message')}
                    disabled={isProcessing}
                    className="flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4" />
                        پیام
                      </>
                    )}
                  </Button>
                </div>
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 