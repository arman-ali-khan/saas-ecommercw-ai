
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const content = `
    importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

    firebase.initializeApp({
      apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''}",
      projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''}",
      messagingSenderId: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''}",
      appId: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''}"
    });

    const messaging = firebase.messaging();

    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
      console.log('Received background message ', payload);
      const notificationTitle = payload.notification.title || 'New Notification';
      const notificationOptions = {
        body: payload.notification.body || 'You have a new update.',
        icon: '/favicon.ico',
        data: payload.data,
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });

    self.addEventListener('notificationclick', (event) => {
      event.notification.close();
      const link = event.notification.data?.link || '/';
      event.waitUntil(
        clients.openWindow(link)
      );
    });
  `;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'application/javascript',
      'Service-Worker-Allowed': '/',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
