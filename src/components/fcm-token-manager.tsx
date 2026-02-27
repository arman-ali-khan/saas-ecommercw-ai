
'use client';

import { useEffect, useRef } from 'react';
import { getFCMToken, onMessageListener } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface FCMTokenManagerProps {
  userId: string | null | undefined;
  userType: 'admin' | 'customer';
}

export default function FCMTokenManager({ userId, userType }: FCMTokenManagerProps) {
  const { toast } = useToast();
  const hasRequested = useRef(false);

  useEffect(() => {
    if (!userId || hasRequested.current) return;
    hasRequested.current = true;

    const setupFCM = async () => {
      try {
        const token = await getFCMToken();
        if (token) {
          console.log("FCM Token registered:", token);
          await fetch('/api/notifications/register-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, userType, token }),
          });
        }
      } catch (error) {
        console.error('Failed to setup FCM:', error);
      }
    };

    setupFCM();

    // Listen for foreground messages
    const setupListener = async () => {
        const payload: any = await onMessageListener();
        if (payload && payload.notification) {
            const { title, body } = payload.notification;
            
            // 1. Show UI Toast
            toast({
                title: title || 'নতুন আপডেট',
                description: body,
            });

            // 2. Trigger Native Browser Notification (Foreground)
            // This makes it show in the Desktop/Mobile notification bar like Facebook
            if (Notification.permission === 'granted') {
                const options = {
                    body: body,
                    icon: '/logo.png', // Fallback icon
                    badge: '/favicon.ico',
                    data: payload.data
                };
                
                // Use Service Worker to show notification even in foreground for better OS integration
                navigator.serviceWorker.ready.then((registration) => {
                    registration.showNotification(title || 'নতুন আপডেট', options);
                });
            }
        }
    };
    
    // Polling or persistent listener setup
    const interval = setInterval(() => {
        setupListener();
    }, 1000);
    
    return () => clearInterval(interval);

  }, [userId, userType, toast]);

  return null;
}
