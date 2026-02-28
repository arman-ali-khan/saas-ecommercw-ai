import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
  };

  const content = `
    /* Standard PWA Service Worker with Network-First Strategy */
    const CACHE_NAME = 'ehut-saas-v2';
    const OFFLINE_FALLBACK_URL = '/';

    self.addEventListener('install', (event) => {
      event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
          return cache.add(new Request(OFFLINE_FALLBACK_URL, { cache: 'reload' }));
        })
      );
      self.skipWaiting();
    });

    self.addEventListener('activate', (event) => {
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName !== CACHE_NAME) {
                return caches.delete(cacheName);
              }
            })
          );
        })
      );
      return self.clients.claim();
    });

    self.addEventListener('fetch', (event) => {
      if (event.request.mode === 'navigate') {
        event.respondWith(
          fetch(event.request)
            .then((response) => {
              const copy = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
              return response;
            })
            .catch(() => {
              return caches.match(event.request).then(response => {
                return response || caches.match(OFFLINE_FALLBACK_URL);
              });
            })
        );
      }
    });

    /* Firebase Messaging Integration */
    importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

    if ("${config.projectId}" !== "") {
        try {
            firebase.initializeApp({
                apiKey: "${config.apiKey}",
                projectId: "${config.projectId}",
                messagingSenderId: "${config.messagingSenderId}",
                appId: "${config.appId}"
            });
            
            const messaging = firebase.messaging();

            messaging.onBackgroundMessage((payload) => {
                const notificationTitle = payload.notification.title || 'New Update';
                const notificationOptions = {
                    body: payload.notification.body || 'New message received.',
                    icon: '/logo.png',
                    data: payload.data,
                };
                return self.registration.showNotification(notificationTitle, notificationOptions);
            });
        } catch (e) {
            console.error("SW Firebase Init Error:", e);
        }
    }

    self.addEventListener('notificationclick', (event) => {
      event.notification.close();
      const link = event.notification.data?.link || '/';
      event.waitUntil(clients.openWindow(link));
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
