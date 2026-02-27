
'use client';

import { useEffect } from 'react';
import { getFCMToken, onMessageListener } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface FCMTokenManagerProps {
  userId: string | null | undefined;
  userType: 'admin' | 'customer';
}

export default function FCMTokenManager({ userId, userType }: FCMTokenManagerProps) {
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    const setupFCM = async () => {
      const token = await getFCMToken();
      if (token) {
        try {
          await fetch('/api/notifications/register-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, userType, token }),
          });
        } catch (error) {
          console.error('Failed to register FCM token:', error);
        }
      }
    };

    setupFCM();

    // Listen for foreground messages
    const unsubscribe = onMessageListener()?.then((payload: any) => {
      toast({
        title: payload.notification?.title || 'নতুন নোটিফিকেশন',
        description: payload.notification?.body,
      });
    });

    return () => {
      // Unsubscribe logic if applicable
    };
  }, [userId, userType, toast]);

  return null;
}
