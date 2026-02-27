
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
  };

  // Only generate full SW if config is present
  if (!config.projectId) {
      return new NextResponse('// Firebase config missing', { headers: { 'Content-Type': 'application/javascript' } });
  }

  const content = `
    importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

    firebase.initializeApp({
      apiKey: "${config.apiKey}",
      projectId: "${config.projectId}",
      messagingSenderId: "${config.messagingSenderId}",
      appId: "${config.appId}"
    });

    const messaging = firebase.messaging();

    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
      console.log('[sw.js] Received background message ', payload);
      const notificationTitle = payload.notification.title || 'New Notification';
      const notificationOptions = {
        body: payload.notification.body || 'You have a new update.',
        icon: '/logo.png',
        badge: '/favicon.ico',
        data: payload.data,
        vibrate: [200, 100, 200],
        tag: 'notification-group', // Groups similar notifications
        renotify: true
      };

      return self.registration.showNotification(notificationTitle, notificationOptions);
    });

    self.addEventListener('notificationclick', (event) => {
      event.notification.close();
      const link = event.notification.data?.link || '/';
      
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
          // Check if there is already a window open and focus it
          for (var i = 0; i < windowClients.length; i++) {
            var client = windowClients[i];
            if (client.url === link && 'focus' in client) {
              return client.focus();
            }
          }
          // If no window is open, open a new one
          if (clients.openWindow) {
            return clients.openWindow(link);
          }
        })
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
