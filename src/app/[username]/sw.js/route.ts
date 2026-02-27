import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
  };

  const content = `
    /* Standard PWA Service Worker with Caching and FCM Support */
    const CACHE_NAME = 'ehut-tenant-v1';
    
    self.addEventListener('install', (event) => {
      self.skipWaiting();
    });

    self.addEventListener('activate', (event) => {
      event.waitUntil(clients.claim());
    });

    /* Cache-First Fetch Handler for PWA offline support */
    self.addEventListener('fetch', (event) => {
      if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
        return;
      }

      event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          }).catch(() => {
              // If network fails and no cache, return null or fallback
              return null;
          });

          return cachedResponse || fetchPromise;
        })
      );
    });

    /* Firebase Cloud Messaging Integration */
    importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

    const firebaseConfig = {
      apiKey: "${config.apiKey}",
      authDomain: "${config.authDomain}",
      projectId: "${config.projectId}",
      storageBucket: "${config.storageBucket}",
      messagingSenderId: "${config.messagingSenderId}",
      appId: "${config.appId}"
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
