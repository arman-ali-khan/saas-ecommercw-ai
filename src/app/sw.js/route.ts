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
    /* Standard PWA Service Worker with Caching and FCM Support */
    const CACHE_NAME = 'ehut-v1';
    const ASSETS_TO_CACHE = [
      '/',
      '/manifest.json',
      '/favicon.ico',
      '/logo.png'
    ];

    self.addEventListener('install', (event) => {
      event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
          return cache.addAll(ASSETS_TO_CACHE);
        })
      );
      self.skipWaiting();
    });

    self.addEventListener('activate', (event) => {
      event.waitUntil(
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cache) => {
              if (cache !== CACHE_NAME) {
                return caches.delete(cache);
              }
            })
          );
        })
      );
      event.waitUntil(clients.claim());
    });

    self.addEventListener('fetch', (event) => {
      // Skip non-GET requests and API calls for caching
      if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
        return;
      }

      event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request).then((response) => {
            // Don't cache if not a valid success response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          }).catch(() => {
            // Offline fallback could go here
          });
        })
      );
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
