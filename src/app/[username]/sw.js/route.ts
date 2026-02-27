
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const content = `
    /* standard PWA life-cycle events */
    self.addEventListener('install', (event) => {
      self.skipWaiting();
    });

    self.addEventListener('activate', (event) => {
      event.waitUntil(clients.claim());
    });

    /* Important: PWA requires a fetch handler to be installable */
    self.addEventListener('fetch', (event) => {
      // For now, we just let the network handle it.
      // This satisfies the browser's requirement for a fetch listener.
      if (event.request.mode === 'navigate') {
        event.respondWith(fetch(event.request));
      }
    });

    /* Firebase Cloud Messaging Integration */
    importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

    const firebaseConfig = {
      apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''}",
      authDomain: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''}",
      projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''}",
      storageBucket: "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''}",
      messagingSenderId: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''}",
      appId: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''}"
    };

    if (firebaseConfig.projectId && firebaseConfig.projectId !== '') {
        try {
            firebase.initializeApp(firebaseConfig);
            const messaging = firebase.messaging();

            // Background notification handler
            messaging.onBackgroundMessage((payload) => {
              console.log('Received background message ', payload);
              const notificationTitle = payload.notification.title || 'New Notification';
              const notificationOptions = {
                body: payload.notification.body || 'You have a new update.',
                icon: '/logo.png',
                data: payload.data,
              };

              self.registration.showNotification(notificationTitle, notificationOptions);
            });
        } catch (e) {
            console.error("SW Firebase error:", e);
        }
    }

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
