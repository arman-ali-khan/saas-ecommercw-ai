import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
  };

  const content = `
    /* Store Specific PWA Service Worker with Network-First Strategy */
    const CACHE_NAME = 'ehut-store-${username}-v2';
    const OFFLINE_URL = '/';

    self.addEventListener('install', (event) => {
      event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
          return cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
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
                return response || caches.match(OFFLINE_URL);
              });
            })
        );
      }
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
